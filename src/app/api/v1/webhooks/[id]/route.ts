import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { withApiV1 } from "@/lib/api-v1/middleware"
import { apiSuccess, apiError } from "@/lib/api-v1/response"

type RouteContext = { params: Promise<{ id: string }> }

export const DELETE = (request: NextRequest, ctx: RouteContext) =>
  withApiV1(
    async ({ apiKey }) => {
      const { id } = await ctx.params
      const webhook = await prisma.webhook.findUnique({ where: { id: parseInt(id) } })
      if (!webhook) return apiError("NOT_FOUND", "Webhook not found", 404) as NextResponse
      if (webhook.apiKeyId !== apiKey.id) {
        return apiError("FORBIDDEN", "Cannot delete webhook belonging to another API key", 403) as NextResponse
      }

      await prisma.webhook.update({
        where: { id: parseInt(id) },
        data: { active: false },
      })
      return apiSuccess({ deactivated: true }) as NextResponse
    },
    { permission: "webhooks" }
  )(request)
