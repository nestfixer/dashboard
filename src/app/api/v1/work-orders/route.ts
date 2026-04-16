import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { CreateWorkOrderSchema } from "@/lib/validations/work-order"
import { withApiV1 } from "@/lib/api-v1/middleware"
import { apiSuccess, apiError } from "@/lib/api-v1/response"
import { dispatchWebhook } from "@/lib/api-v1/webhook-dispatcher"

const workOrderInclude = {
  customer: { select: { id: true, name: true } },
  createdBy: { select: { id: true, displayName: true } },
  assignedTo: { select: { id: true, displayName: true } },
  _count: { select: { materials: true, comments: true, timeEntries: true } },
}

export const GET = withApiV1(
  async ({ pagination }, request: NextRequest) => {
    const params = request.nextUrl.searchParams
    const search = params.get("search") ?? ""
    const status = params.get("status") ?? ""
    const assignedToId = params.get("assignedToId")

    const where: Record<string, unknown> = {}
    if (search) {
      where.OR = [
        { title: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
      ]
    }
    if (status) where.status = status
    if (assignedToId) where.assignedToId = parseInt(assignedToId)

    const [workOrders, total] = await Promise.all([
      prisma.workOrder.findMany({
        where,
        skip: pagination.skip,
        take: pagination.take,
        orderBy: { createdAt: "desc" },
        include: workOrderInclude,
      }),
      prisma.workOrder.count({ where }),
    ])

    return apiSuccess(workOrders, pagination.buildMeta(total)) as NextResponse
  },
  { permission: "read" }
)

export const POST = withApiV1(
  async ({ userId, apiKey }, request: NextRequest) => {
    const body = await request.json()
    const parsed = CreateWorkOrderSchema.safeParse(body)
    if (!parsed.success) {
      return apiError("VALIDATION_ERROR", "Invalid request body", 400, parsed.error.flatten()) as NextResponse
    }

    const workOrder = await prisma.workOrder.create({
      data: { ...parsed.data, createdById: userId },
      include: workOrderInclude,
    })
    dispatchWebhook("work_order.created", workOrder, apiKey.id)
    return apiSuccess(workOrder) as NextResponse
  },
  { permission: "write" }
)
