import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { CreateInvoiceSchema } from "@/lib/validations/invoice"
import { withApiV1 } from "@/lib/api-v1/middleware"
import { apiSuccess, apiError } from "@/lib/api-v1/response"
import { dispatchWebhook } from "@/lib/api-v1/webhook-dispatcher"

const invoiceInclude = {
  workOrder: { select: { id: true, title: true } },
  lines: true,
}

export const GET = withApiV1(
  async ({ pagination }, request: NextRequest) => {
    const status = request.nextUrl.searchParams.get("status") ?? ""
    const workOrderId = request.nextUrl.searchParams.get("workOrderId")

    const where: Record<string, unknown> = {}
    if (status) where.status = status
    if (workOrderId) where.workOrderId = parseInt(workOrderId)

    const [invoices, total] = await Promise.all([
      prisma.invoice.findMany({
        where,
        skip: pagination.skip,
        take: pagination.take,
        orderBy: { issuedAt: "desc" },
        include: invoiceInclude,
      }),
      prisma.invoice.count({ where }),
    ])

    return apiSuccess(invoices, pagination.buildMeta(total)) as NextResponse
  },
  { permission: "read" }
)

export const POST = withApiV1(
  async ({ apiKey }, request: NextRequest) => {
    const body = await request.json()
    const parsed = CreateInvoiceSchema.safeParse(body)
    if (!parsed.success) {
      return apiError("VALIDATION_ERROR", "Invalid request body", 400, parsed.error.flatten()) as NextResponse
    }

    const workOrder = await prisma.workOrder.findUnique({ where: { id: parsed.data.workOrderId } })
    if (!workOrder) {
      return apiError("NOT_FOUND", "Work order not found", 404) as NextResponse
    }

    const invoiceNumber = `INV-${Date.now()}`
    const invoice = await prisma.invoice.create({
      data: { ...parsed.data, invoiceNumber },
      include: invoiceInclude,
    })
    dispatchWebhook("invoice.created", invoice, apiKey.id)
    return apiSuccess(invoice) as NextResponse
  },
  { permission: "write" }
)
