import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/auth"

export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const startParam = req.nextUrl.searchParams.get("start")
  const endParam = req.nextUrl.searchParams.get("end")
  if (!startParam || !endParam) return NextResponse.json({ error: "start and end required" }, { status: 400 })

  const start = new Date(startParam)
  const end = new Date(endParam)

  const [workOrders, timeEntries] = await Promise.all([
    prisma.workOrder.findMany({
      where: {
        dueDate: { gte: start, lte: end },
      },
      include: {
        assignedTo: { select: { id: true, displayName: true, color: true } },
        customer: { select: { name: true } },
      },
    }),
    prisma.timeEntry.findMany({
      where: {
        OR: [
          { startTime: { gte: start, lte: end } },
          { date: { gte: start, lte: end } },
        ],
        durationMins: { not: null },
      },
      include: {
        user: { select: { id: true, displayName: true, color: true } },
        workOrder: { select: { id: true, title: true } },
      },
    }),
  ])

  const events: object[] = []

  for (const wo of workOrders) {
    const color = wo.assignedTo?.color ?? "#6366f1"
    const dimmed = wo.status === "Completed"
    
    // Heuristic: if time is 00:00:00, treat as all-day event
    const dueDate = wo.dueDate ? new Date(wo.dueDate) : null
    const isAllDay = dueDate ? (
      dueDate.getHours() === 0 && 
      dueDate.getMinutes() === 0 && 
      dueDate.getSeconds() === 0
    ) : true

    events.push({
      id: `wo-${wo.id}`,
      title: wo.title,
      start: wo.dueDate,
      end: wo.endDate,
      allDay: isAllDay,
      backgroundColor: dimmed ? "#d1d5db" : color,
      borderColor: dimmed ? "#9ca3af" : color,
      textColor: "#ffffff",
      extendedProps: {
        type: "workorder",
        woId: wo.id,
        status: wo.status,
        customer: wo.customer?.name ?? null,
        assignedTo: wo.assignedTo?.displayName ?? null,
      },
    })
  }

  for (const te of timeEntries) {
    const color = te.user.color ?? "#6366f1"
    const label = `${te.user.displayName} — ${te.workOrder.title}`

    if (te.startTime && te.endTime) {
      events.push({
        id: `te-${te.id}`,
        title: label,
        start: te.startTime,
        end: te.endTime,
        backgroundColor: color + "33",
        borderColor: color,
        textColor: "#1f2937",
        extendedProps: { type: "timeentry", woId: te.workOrder.id },
      })
    } else if (te.durationMins) {
      // Manual entry — no start time, show as all-day with duration
      events.push({
        id: `te-${te.id}`,
        title: `${label} (${(te.durationMins / 60).toFixed(1)}h)`,
        start: te.date,
        allDay: true,
        backgroundColor: color + "33",
        borderColor: color,
        textColor: "#374151",
        extendedProps: { type: "timeentry", woId: te.workOrder.id },
      })
    }
  }

  return NextResponse.json(events)
}
