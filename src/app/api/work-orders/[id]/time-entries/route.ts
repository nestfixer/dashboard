import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/auth"
import { CreateTimeEntrySchema } from "@/lib/validations/time-entry"

export async function GET(_: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const entries = await prisma.timeEntry.findMany({
    where: { workOrderId: parseInt(params.id) },
    include: { user: { select: { id: true, displayName: true } } },
    orderBy: { date: "desc" },
  })
  return NextResponse.json(entries)
}

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const body = await req.json()
  const parsed = CreateTimeEntrySchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })

  const entry = await prisma.timeEntry.create({
    data: {
      workOrderId: parseInt(params.id),
      userId: parseInt(session.user.id),
      entryType: parsed.data.entryType,
      startTime: parsed.data.startTime ? new Date(parsed.data.startTime) : undefined,
      durationMins: parsed.data.durationMins ?? undefined,
      date: parsed.data.date ? new Date(parsed.data.date) : new Date(),
      notes: parsed.data.notes ?? undefined,
    },
    include: { user: { select: { id: true, displayName: true } } },
  })
  return NextResponse.json(entry, { status: 201 })
}
