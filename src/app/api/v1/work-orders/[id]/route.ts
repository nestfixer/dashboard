import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { UpdateWorkOrderSchema } from "@/lib/validations/work-order"
import { withApiV1 } from "@/lib/api-v1/middleware"
import { apiSuccess, apiError } from "@/lib/api-v1/response"
import { dispatchWebhook } from "@/lib/api-v1/webhook-dispatcher"

type RouteContext = { params: Promise<{ id: string }> }

const workOrderInclude = {
  customer: { select: { id: true, name: true } },
  createdBy: { select: { id: true, displayName: true } },
  assignedTo: { select: { id: true, displayName: true } },
  _count: { select: { materials: true, comments: true, timeEntries: true } },
}

export const GET = (request: NextRequest, ctx: RouteContext) =>
  withApiV1(
    async () => {
      const { id } = await ctx.params
      const workOrder = await prisma.workOrder.findUnique({
        where: { id: parseInt(id) },
        include: workOrderInclude,
      })
      if (!workOrder) return apiError("NOT_FOUND", "Work order not found", 404) as NextResponse
      return apiSuccess(workOrder) as NextResponse
    },
    { permission: "read" }
  )(request)

export const PATCH = (request: NextRequest, ctx: RouteContext) =>
  withApiV1(
    async ({ apiKey }, req) => {
      const { id } = await ctx.params
      const body = await req.json()
      const parsed = UpdateWorkOrderSchema.safeParse(body)
      if (!parsed.success) {
        return apiError("VALIDATION_ERROR", "Invalid request body", 400, parsed.error.flatten()) as NextResponse
      }

      const existing = await prisma.workOrder.findUnique({ where: { id: parseInt(id) } })
      if (!existing) return apiError("NOT_FOUND", "Work order not found", 404) as NextResponse

      const workOrder = await prisma.workOrder.update({
        where: { id: parseInt(id) },
        data: {
          ...parsed.data,
          dueDate: parsed.data.dueDate ? new Date(parsed.data.dueDate) : undefined,
        },
        include: workOrderInclude,
      })
      dispatchWebhook("work_order.updated", workOrder, apiKey.id)
      return apiSuccess(workOrder) as NextResponse
    },
    { permission: "write" }
  )(request)

export const DELETE = (request: NextRequest, ctx: RouteContext) =>
  withApiV1(
    async ({ apiKey }) => {
      const { id } = await ctx.params
      const existing = await prisma.workOrder.findUnique({ where: { id: parseInt(id) } })
      if (!existing) return apiError("NOT_FOUND", "Work order not found", 404) as NextResponse

      await prisma.workOrder.delete({ where: { id: parseInt(id) } })
      dispatchWebhook("work_order.deleted", { id: parseInt(id) }, apiKey.id)
      return apiSuccess({ deleted: true }) as NextResponse
    },
    { permission: "write" }
  )(request)
