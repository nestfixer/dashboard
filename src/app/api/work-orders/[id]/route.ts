import { NextRequest, NextResponse } from "next/server"
import { revalidatePath } from "next/cache"
import { prisma } from "@/lib/prisma"
import { auth } from "@/auth"
import { UpdateWorkOrderSchema } from "@/lib/validations/work-order"

export async function GET(_: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const wo = await prisma.workOrder.findUnique({
    where: { id: parseInt(params.id) },
    include: {
      customer: true,
      createdBy: { select: { id: true, displayName: true, color: true, username: true } },
      assignedTo: { select: { id: true, displayName: true, color: true, username: true } },
      materials: { orderBy: { createdAt: "asc" } },
      images: { orderBy: { uploadedAt: "asc" } },
      comments: {
        include: { author: { select: { id: true, displayName: true, color: true } } },
        orderBy: { createdAt: "asc" },
      },
      timeEntries: {
        include: { user: { select: { id: true, displayName: true } } },
        orderBy: { date: "desc" },
      },
      invoices: { orderBy: { issuedAt: "desc" } },
    },
  })

  if (!wo) return NextResponse.json({ error: "Not found" }, { status: 404 })
  return NextResponse.json(wo)
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const body = await req.json()
  const parsed = UpdateWorkOrderSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })

  const wo = await prisma.workOrder.update({
    where: { id: parseInt(params.id) },
    data: {
      ...parsed.data,
      dueDate: parsed.data.dueDate !== undefined ? (parsed.data.dueDate ? new Date(parsed.data.dueDate) : null) : undefined,
      endDate: parsed.data.endDate !== undefined ? (parsed.data.endDate ? new Date(parsed.data.endDate) : null) : undefined,
    },
    include: { customer: true, assignedTo: { select: { id: true, displayName: true, color: true } } },
  })

  revalidatePath("/dashboard")
  revalidatePath("/work-orders")
  revalidatePath(`/work-orders/${params.id}`)
  return NextResponse.json(wo)
}

export async function DELETE(_: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  await prisma.workOrder.delete({ where: { id: parseInt(params.id) } })
  revalidatePath("/dashboard")
  revalidatePath("/work-orders")
  return NextResponse.json({ success: true })
}
