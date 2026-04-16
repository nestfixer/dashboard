import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { ReassignSchema } from "@/lib/validations/work-order"
import { withApiV1 } from "@/lib/api-v1/middleware"
import { apiSuccess, apiError } from "@/lib/api-v1/response"

type RouteContext = { params: Promise<{ id: string }> }

export const POST = (request: NextRequest, ctx: RouteContext) =>
  withApiV1(
    async (_, req) => {
      const { id } = await ctx.params
      const body = await req.json()
      const parsed = ReassignSchema.safeParse(body)
      if (!parsed.success) {
        return apiError("VALIDATION_ERROR", "Invalid request body", 400, parsed.error.flatten()) as NextResponse
      }

      const existing = await prisma.workOrder.findUnique({ where: { id: parseInt(id) } })
      if (!existing) return apiError("NOT_FOUND", "Work order not found", 404) as NextResponse

      const workOrder = await prisma.workOrder.update({
        where: { id: parseInt(id) },
        data: { assignedToId: parsed.data.assignedToId },
      })
      return apiSuccess(workOrder) as NextResponse
    },
    { permission: "write" }
  )(request)
