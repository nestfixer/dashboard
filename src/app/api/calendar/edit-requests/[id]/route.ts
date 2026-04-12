import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/auth"
import { z } from "zod"

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const body = await req.json()
  const schema = z.object({ status: z.enum(["Approved", "Denied"]) })
  const parsed = schema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })

  const editRequest = await prisma.calendarEditRequest.findUnique({
    where: { id: parseInt(params.id) },
  })
  if (!editRequest) return NextResponse.json({ error: "Not found" }, { status: 404 })

  const updated = await prisma.calendarEditRequest.update({
    where: { id: parseInt(params.id) },
    data: { status: parsed.data.status, resolvedAt: new Date() },
  })

  // If approved, update the work order's due date
  if (parsed.data.status === "Approved") {
    await prisma.workOrder.update({
      where: { id: editRequest.workOrderId },
      data: { dueDate: editRequest.newDueDate },
    })
  }

  return NextResponse.json(updated)
}
