import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/auth"

export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const start = req.nextUrl.searchParams.get("start")
  const end = req.nextUrl.searchParams.get("end")
  if (!start || !end) return NextResponse.json({ error: "start and end required" }, { status: 400 })
  const tasks = await prisma.calendarTask.findMany({
    where: { date: { gte: new Date(start), lte: new Date(end) } },
    include: { createdBy: { select: { id: true, displayName: true, color: true } } },
    orderBy: { date: "asc" },
  })
  return NextResponse.json(tasks)
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const body = await req.json()
  const task = await prisma.calendarTask.create({
    data: {
      title: body.title,
      description: body.description || null,
      date: new Date(body.date),
      endDate: body.endDate ? new Date(body.endDate) : null,
      allDay: body.allDay ?? true,
      color: body.color || "#50e3c2",
      createdById: parseInt(session.user.id),
    },
  })
  return NextResponse.json(task, { status: 201 })
}
