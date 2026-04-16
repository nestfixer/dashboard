import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { UpdateTimeEntrySchema } from "@/lib/validations/time-entry"
import { withApiV1 } from "@/lib/api-v1/middleware"
import { apiSuccess, apiError } from "@/lib/api-v1/response"
import { dispatchWebhook } from "@/lib/api-v1/webhook-dispatcher"

type RouteContext = { params: Promise<{ id: string }> }

const timeEntryInclude = {
  user: { select: { id: true, displayName: true } },
  workOrder: { select: { id: true, title: true } },
}

export const GET = (request: NextRequest, ctx: RouteContext) =>
  withApiV1(
    async () => {
      const { id } = await ctx.params
      const entry = await prisma.timeEntry.findUnique({
        where: { id: parseInt(id) },
        include: timeEntryInclude,
      })
      if (!entry) return apiError("NOT_FOUND", "Time entry not found", 404) as NextResponse
      return apiSuccess(entry) as NextResponse
    },
    { permission: "read" }
  )(request)

export const PATCH = (request: NextRequest, ctx: RouteContext) =>
  withApiV1(
    async ({ apiKey }, req) => {
      const { id } = await ctx.params
      const body = await req.json()
      const parsed = UpdateTimeEntrySchema.safeParse(body)
      if (!parsed.success) {
        return apiError("VALIDATION_ERROR", "Invalid request body", 400, parsed.error.flatten()) as NextResponse
      }

      const existing = await prisma.timeEntry.findUnique({ where: { id: parseInt(id) } })
      if (!existing) return apiError("NOT_FOUND", "Time entry not found", 404) as NextResponse

      const entry = await prisma.timeEntry.update({
        where: { id: parseInt(id) },
        data: {
          ...parsed.data,
          endTime: parsed.data.endTime ? new Date(parsed.data.endTime) : undefined,
        },
        include: timeEntryInclude,
      })
      dispatchWebhook("time_entry.updated", entry, apiKey.id)
      return apiSuccess(entry) as NextResponse
    },
    { permission: "write" }
  )(request)

export const DELETE = (request: NextRequest, ctx: RouteContext) =>
  withApiV1(
    async ({ apiKey }) => {
      const { id } = await ctx.params
      const existing = await prisma.timeEntry.findUnique({ where: { id: parseInt(id) } })
      if (!existing) return apiError("NOT_FOUND", "Time entry not found", 404) as NextResponse

      await prisma.timeEntry.delete({ where: { id: parseInt(id) } })
      dispatchWebhook("time_entry.deleted", { id: parseInt(id) }, apiKey.id)
      return apiSuccess({ deleted: true }) as NextResponse
    },
    { permission: "write" }
  )(request)
