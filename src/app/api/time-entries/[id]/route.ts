import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/auth"
import { UpdateTimeEntrySchema } from "@/lib/validations/time-entry"

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const body = await req.json()
  const parsed = UpdateTimeEntrySchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })

  const entry = await prisma.timeEntry.update({
    where: { id: parseInt(params.id) },
    data: {
      endTime: parsed.data.endTime ? new Date(parsed.data.endTime) : undefined,
      durationMins: parsed.data.durationMins ?? undefined,
      notes: parsed.data.notes ?? undefined,
    },
    include: { user: { select: { id: true, displayName: true } } },
  })
  return NextResponse.json(entry)
}

export async function DELETE(_: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  await prisma.timeEntry.delete({ where: { id: parseInt(params.id) } })
  return NextResponse.json({ success: true })
}
