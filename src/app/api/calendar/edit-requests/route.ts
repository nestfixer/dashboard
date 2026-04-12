import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/auth"
import { z } from "zod"

export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const status = req.nextUrl.searchParams.get("status")
  const userId = parseInt(session.user.id)

  const requests = await prisma.calendarEditRequest.findMany({
    where: {
      ...(status ? { status } : {}),
      OR: [{ requestedById: userId }, { requestedToId: userId }],
    },
    include: {
      workOrder: { select: { id: true, title: true, dueDate: true } },
      requestedBy: { select: { id: true, displayName: true } },
      requestedTo: { select: { id: true, displayName: true } },
    },
    orderBy: { createdAt: "desc" },
  })
  return NextResponse.json(requests)
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const body = await req.json()
  const schema = z.object({
    workOrderId: z.number().int().positive(),
    newDueDate: z.string(),
    reason: z.string().optional(),
  })
  const parsed = schema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })

  const wo = await prisma.workOrder.findUnique({ where: { id: parsed.data.workOrderId } })
  if (!wo) return NextResponse.json({ error: "Not found" }, { status: 404 })

  const requestedById = parseInt(session.user.id)
  const requestedToId = wo.assignedToId ?? (requestedById === 1 ? 2 : 1)

  const request = await prisma.calendarEditRequest.create({
    data: {
      workOrderId: parsed.data.workOrderId,
      requestedById,
      requestedToId,
      newDueDate: new Date(parsed.data.newDueDate),
      reason: parsed.data.reason,
    },
    include: {
      workOrder: { select: { id: true, title: true } },
      requestedBy: { select: { id: true, displayName: true } },
      requestedTo: { select: { id: true, displayName: true } },
    },
  })
  return NextResponse.json(request, { status: 201 })
}
