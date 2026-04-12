import { NextRequest, NextResponse } from "next/server"
import { revalidatePath } from "next/cache"
import { prisma } from "@/lib/prisma"
import { auth } from "@/auth"
import { CreateInvoiceSchema } from "@/lib/validations/invoice"
import { calculateInvoice } from "@/lib/invoice-calc"

export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const workOrderId = req.nextUrl.searchParams.get("workOrderId")
  const invoices = await prisma.invoice.findMany({
    where: workOrderId ? { workOrderId: parseInt(workOrderId) } : undefined,
    include: {
      workOrder: {
        include: { customer: true },
      },
      lines: true,
    },
    orderBy: { issuedAt: "desc" },
  })
  return NextResponse.json(invoices)
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const body = await req.json()
  const parsed = CreateInvoiceSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })

  const { workOrderId, bufferPct, laborRate, laborHours, notes } = parsed.data

  // Get WO materials
  const wo = await prisma.workOrder.findUnique({
    where: { id: workOrderId },
    include: { materials: true },
  })
  if (!wo) return NextResponse.json({ error: "Work order not found" }, { status: 404 })

  const calc = calculateInvoice({
    materials: wo.materials,
    bufferPct,
    laborRate,
    laborHours,
  })

  // Generate sequential invoice number
  const last = await prisma.invoice.findFirst({ orderBy: { id: "desc" } })
  const nextNum = (last?.id ?? 0) + 1
  const invoiceNumber = `INV-${String(nextNum).padStart(4, "0")}`

  const lines: { description: string; quantity: number; unitCost: number; lineTotal: number; lineType: string }[] = [
    ...wo.materials.map((m) => ({
      description: m.name,
      quantity: m.quantity,
      unitCost: m.unitCost,
      lineTotal: m.quantity * m.unitCost,
      lineType: "material",
    })),
  ]

  if (calc.bufferAmount > 0) {
    lines.push({
      description: `Buffer (${bufferPct}%)`,
      quantity: 1,
      unitCost: calc.bufferAmount,
      lineTotal: calc.bufferAmount,
      lineType: "buffer" as const,
    })
  }

  if (calc.laborTotal > 0) {
    lines.push({
      description: `Labor (${laborHours}h @ $${laborRate}/h)`,
      quantity: laborHours,
      unitCost: laborRate,
      lineTotal: calc.laborTotal,
      lineType: "labor" as const,
    })
  }

  const invoice = await prisma.invoice.create({
    data: {
      workOrderId,
      invoiceNumber,
      bufferPct,
      laborRate,
      laborHours,
      notes: notes ?? undefined,
      ...calc,
      lines: { create: lines },
    },
    include: {
      workOrder: { include: { customer: true } },
      lines: true,
    },
  })

  revalidatePath("/invoices")
  revalidatePath("/dashboard")
  return NextResponse.json(invoice, { status: 201 })
}
