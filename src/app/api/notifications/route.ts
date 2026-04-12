import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/auth"
import { addDays } from "date-fns"

export async function GET() {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const userId = parseInt(session.user.id)
  const now = new Date()
  const soon = addDays(now, 3)

  const workOrders = await prisma.workOrder.findMany({
    where: {
      assignedToId: userId,
      status: { not: "Completed" },
      dueDate: { lte: soon },
    },
    include: {
      customer: { select: { name: true } },
    },
    orderBy: { dueDate: "asc" },
  })

  return NextResponse.json(workOrders)
}
