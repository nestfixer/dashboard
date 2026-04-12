import { NextRequest, NextResponse } from "next/server"
import { revalidatePath } from "next/cache"
import { prisma } from "@/lib/prisma"
import { auth } from "@/auth"
import { UpdateInvoiceSchema } from "@/lib/validations/invoice"

export async function GET(_: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const invoice = await prisma.invoice.findUnique({
    where: { id: parseInt(params.id) },
    include: {
      workOrder: { include: { customer: true, assignedTo: { select: { id: true, displayName: true } } } },
      lines: true,
    },
  })
  if (!invoice) return NextResponse.json({ error: "Not found" }, { status: 404 })
  return NextResponse.json(invoice)
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const body = await req.json()
  const parsed = UpdateInvoiceSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })

  const invoice = await prisma.invoice.update({
    where: { id: parseInt(params.id) },
    data: {
      ...parsed.data,
      paidAt: parsed.data.paidAt ? new Date(parsed.data.paidAt) : parsed.data.paidAt,
    },
    include: { lines: true },
  })
  revalidatePath("/invoices")
  return NextResponse.json(invoice)
}
