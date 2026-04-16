import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { CreateTimeEntrySchema } from "@/lib/validations/time-entry"
import { withApiV1 } from "@/lib/api-v1/middleware"
import { apiSuccess, apiError } from "@/lib/api-v1/response"
import { dispatchWebhook } from "@/lib/api-v1/webhook-dispatcher"

const timeEntryInclude = {
  user: { select: { id: true, displayName: true } },
  workOrder: { select: { id: true, title: true } },
}

export const GET = withApiV1(
  async ({ pagination }, request: NextRequest) => {
    const workOrderId = request.nextUrl.searchParams.get("workOrderId")
    const userId = request.nextUrl.searchParams.get("userId")

    const where: Record<string, unknown> = {}
    if (workOrderId) where.workOrderId = parseInt(workOrderId)
    if (userId) where.userId = parseInt(userId)

    const [entries, total] = await Promise.all([
      prisma.timeEntry.findMany({
        where,
        skip: pagination.skip,
        take: pagination.take,
        orderBy: { date: "desc" },
        include: timeEntryInclude,
      }),
      prisma.timeEntry.count({ where }),
    ])

    return apiSuccess(entries, pagination.buildMeta(total)) as NextResponse
  },
  { permission: "read" }
)

export const POST = withApiV1(
  async ({ userId, apiKey }, request: NextRequest) => {
    const body = await request.json()

    const workOrderId = body.workOrderId
    if (!workOrderId || typeof workOrderId !== "number") {
      return apiError("VALIDATION_ERROR", "workOrderId is required", 400) as NextResponse
    }

    const workOrder = await prisma.workOrder.findUnique({ where: { id: workOrderId } })
    if (!workOrder) return apiError("NOT_FOUND", "Work order not found", 404) as NextResponse

    const parsed = CreateTimeEntrySchema.safeParse(body)
    if (!parsed.success) {
      return apiError("VALIDATION_ERROR", "Invalid request body", 400, parsed.error.flatten()) as NextResponse
    }

    const entry = await prisma.timeEntry.create({
      data: {
        ...parsed.data,
        workOrderId,
        userId,
        startTime: parsed.data.startTime ? new Date(parsed.data.startTime) : undefined,
        date: parsed.data.date ? new Date(parsed.data.date) : new Date(),
      },
      include: timeEntryInclude,
    })
    dispatchWebhook("time_entry.created", entry, apiKey.id)
    return apiSuccess(entry) as NextResponse
  },
  { permission: "write" }
)
