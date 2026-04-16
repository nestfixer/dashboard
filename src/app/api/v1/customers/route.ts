import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { CreateCustomerSchema } from "@/lib/validations/customer"
import { withApiV1 } from "@/lib/api-v1/middleware"
import { apiSuccess, apiError } from "@/lib/api-v1/response"
import { dispatchWebhook } from "@/lib/api-v1/webhook-dispatcher"

export const GET = withApiV1(
  async ({ pagination }, request: NextRequest) => {
    const search = request.nextUrl.searchParams.get("search") ?? ""

    const where = search
      ? {
          OR: [
            { name: { contains: search, mode: "insensitive" as const } },
            { phone: { contains: search, mode: "insensitive" as const } },
            { email: { contains: search, mode: "insensitive" as const } },
          ],
        }
      : {}

    const [customers, total] = await Promise.all([
      prisma.customer.findMany({
        where,
        skip: pagination.skip,
        take: pagination.take,
        orderBy: { name: "asc" },
        include: { _count: { select: { workOrders: true } } },
      }),
      prisma.customer.count({ where }),
    ])

    return apiSuccess(customers, pagination.buildMeta(total)) as NextResponse
  },
  { permission: "read" }
)

export const POST = withApiV1(
  async ({ apiKey }, request: NextRequest) => {
    const body = await request.json()
    const parsed = CreateCustomerSchema.safeParse(body)
    if (!parsed.success) {
      return apiError("VALIDATION_ERROR", "Invalid request body", 400, parsed.error.flatten()) as NextResponse
    }

    const customer = await prisma.customer.create({ data: parsed.data })
    dispatchWebhook("customer.created", customer, apiKey.id)
    return apiSuccess(customer) as NextResponse
  },
  { permission: "write" }
)
