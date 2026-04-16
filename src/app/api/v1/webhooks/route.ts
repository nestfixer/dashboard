import { NextRequest, NextResponse } from "next/server"
import { randomBytes } from "crypto"
import { z } from "zod"
import { prisma } from "@/lib/prisma"
import { withApiV1 } from "@/lib/api-v1/middleware"
import { apiSuccess, apiError } from "@/lib/api-v1/response"

const VALID_EVENTS = [
  "customer.created", "customer.updated", "customer.deleted",
  "work_order.created", "work_order.updated", "work_order.accepted", "work_order.completed",
  "invoice.created", "invoice.updated", "invoice.deleted",
  "time_entry.created", "time_entry.updated", "time_entry.deleted",
]

const CreateWebhookSchema = z.object({
  url: z.string().url().startsWith("https://", { message: "Webhook URL must use HTTPS" }),
  events: z.array(z.enum(VALID_EVENTS as [string, ...string[]])).min(1),
})

export const GET = withApiV1(
  async ({ apiKey }) => {
    const webhooks = await prisma.webhook.findMany({
      where: { apiKeyId: apiKey.id },
      select: { id: true, url: true, events: true, active: true, createdAt: true },
      orderBy: { createdAt: "desc" },
    })
    return apiSuccess(webhooks) as NextResponse
  },
  { permission: "webhooks" }
)

export const POST = withApiV1(
  async ({ apiKey }, request: NextRequest) => {
    const body = await request.json()
    const parsed = CreateWebhookSchema.safeParse(body)
    if (!parsed.success) {
      return apiError("VALIDATION_ERROR", "Invalid request body", 400, parsed.error.flatten()) as NextResponse
    }

    const { url } = parsed.data
    try {
      const parsed_url = new URL(url)
      const hostname = parsed_url.hostname
      if (
        hostname === "localhost" ||
        hostname === "127.0.0.1" ||
        hostname === "0.0.0.0" ||
        hostname.startsWith("10.") ||
        hostname.startsWith("192.168.") ||
        hostname.startsWith("172.")
      ) {
        return apiError("VALIDATION_ERROR", "Webhook URL must not point to private/internal addresses", 400) as NextResponse
      }
    } catch {
      return apiError("VALIDATION_ERROR", "Invalid URL", 400) as NextResponse
    }

    const secret = randomBytes(32).toString("hex")

    const webhook = await prisma.webhook.create({
      data: {
        url: parsed.data.url,
        events: parsed.data.events,
        secret,
        apiKeyId: apiKey.id,
      },
    })

    return apiSuccess({ ...webhook, secret }) as NextResponse
  },
  { permission: "webhooks" }
)
