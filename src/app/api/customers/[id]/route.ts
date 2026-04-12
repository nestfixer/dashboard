import { NextRequest, NextResponse } from "next/server"
import { revalidatePath } from "next/cache"
import { prisma } from "@/lib/prisma"
import { auth } from "@/auth"
import { UpdateCustomerSchema } from "@/lib/validations/customer"

export async function GET(_: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const customer = await prisma.customer.findUnique({
    where: { id: parseInt(params.id) },
    include: {
      workOrders: {
        include: { assignedTo: { select: { id: true, displayName: true } } },
        orderBy: { createdAt: "desc" },
      },
    },
  })
  if (!customer) return NextResponse.json({ error: "Not found" }, { status: 404 })
  return NextResponse.json(customer)
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const body = await req.json()
  const parsed = UpdateCustomerSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })

  const customer = await prisma.customer.update({
    where: { id: parseInt(params.id) },
    data: parsed.data,
  })
  revalidatePath("/customers")
  return NextResponse.json(customer)
}

export async function DELETE(_: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  await prisma.customer.delete({ where: { id: parseInt(params.id) } })
  revalidatePath("/customers")
  return NextResponse.json({ success: true })
}
