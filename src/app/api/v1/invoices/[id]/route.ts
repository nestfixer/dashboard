import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { UpdateInvoiceSchema } from "@/lib/validations/invoice"
import { withApiV1 } from "@/lib/api-v1/middleware"
import { apiSuccess, apiError } from "@/lib/api-v1/response"
import { dispatchWebhook } from "@/lib/api-v1/webhook-dispatcher"

type RouteContext = { params: Promise<{ id: string }> }

const invoiceInclude = {
  workOrder: { select: { id: true, title: true } },
  lines: true,
}

export const GET = (request: NextRequest, ctx: RouteContext) =>
  withApiV1(
    async () => {
      const { id } = await ctx.params
      const invoice = await prisma.invoice.findUnique({
        where: { id: parseInt(id) },
        include: invoiceInclude,
      })
      if (!invoice) return apiError("NOT_FOUND", "Invoice not found", 404) as NextResponse
      return apiSuccess(invoice) as NextResponse
    },
    { permission: "read" }
  )(request)

export const PATCH = (request: NextRequest, ctx: RouteContext) =>
  withApiV1(
    async ({ apiKey }, req) => {
      const { id } = await ctx.params
      const body = await req.json()
      const parsed = UpdateInvoiceSchema.safeParse(body)
      if (!parsed.success) {
        return apiError("VALIDATION_ERROR", "Invalid request body", 400, parsed.error.flatten()) as NextResponse
      }

      const existing = await prisma.invoice.findUnique({ where: { id: parseInt(id) } })
      if (!existing) return apiError("NOT_FOUND", "Invoice not found", 404) as NextResponse

      const invoice = await prisma.invoice.update({
        where: { id: parseInt(id) },
        data: {
          ...parsed.data,
          paidAt: parsed.data.paidAt ? new Date(parsed.data.paidAt) : undefined,
        },
        include: invoiceInclude,
      })
      dispatchWebhook("invoice.updated", invoice, apiKey.id)
      return apiSuccess(invoice) as NextResponse
    },
    { permission: "write" }
  )(request)

export const DELETE = (request: NextRequest, ctx: RouteContext) =>
  withApiV1(
    async ({ apiKey }) => {
      const { id } = await ctx.params
      const existing = await prisma.invoice.findUnique({ where: { id: parseInt(id) } })
      if (!existing) return apiError("NOT_FOUND", "Invoice not found", 404) as NextResponse

      await prisma.invoice.delete({ where: { id: parseInt(id) } })
      dispatchWebhook("invoice.deleted", { id: parseInt(id) }, apiKey.id)
      return apiSuccess({ deleted: true }) as NextResponse
    },
    { permission: "write" }
  )(request)
