import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { withApiV1 } from "@/lib/api-v1/middleware"
import { apiSuccess, apiError } from "@/lib/api-v1/response"
import { dispatchWebhook } from "@/lib/api-v1/webhook-dispatcher"

type RouteContext = { params: Promise<{ id: string }> }

export const POST = (request: NextRequest, ctx: RouteContext) =>
  withApiV1(
    async ({ apiKey }) => {
      const { id } = await ctx.params
      const existing = await prisma.workOrder.findUnique({ where: { id: parseInt(id) } })
      if (!existing) return apiError("NOT_FOUND", "Work order not found", 404) as NextResponse

      const workOrder = await prisma.workOrder.update({
        where: { id: parseInt(id) },
        data: { status: "Accepted", acceptedAt: new Date() },
      })
      dispatchWebhook("work_order.accepted", workOrder, apiKey.id)
      return apiSuccess(workOrder) as NextResponse
    },
    { permission: "write" }
  )(request)
