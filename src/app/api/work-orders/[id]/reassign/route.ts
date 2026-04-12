import { NextRequest, NextResponse } from "next/server"
import { revalidatePath } from "next/cache"
import { prisma } from "@/lib/prisma"
import { auth } from "@/auth"
import { ReassignSchema } from "@/lib/validations/work-order"

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const body = await req.json()
  const parsed = ReassignSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })

  const wo = await prisma.workOrder.update({
    where: { id: parseInt(params.id) },
    data: { assignedToId: parsed.data.assignedToId },
    include: { assignedTo: { select: { id: true, displayName: true, color: true } } },
  })
  revalidatePath("/dashboard")
  revalidatePath("/work-orders")
  revalidatePath(`/work-orders/${params.id}`)
  return NextResponse.json(wo)
}
