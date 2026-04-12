import { NextRequest, NextResponse } from "next/server"
import { revalidatePath } from "next/cache"
import { prisma } from "@/lib/prisma"
import { auth } from "@/auth"

export async function POST(_: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const wo = await prisma.workOrder.update({
    where: { id: parseInt(params.id) },
    data: { status: "Completed" },
  })
  revalidatePath("/dashboard")
  revalidatePath("/work-orders")
  revalidatePath(`/work-orders/${params.id}`)
  return NextResponse.json(wo)
}
