import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/auth"

export async function PATCH(req: NextRequest, { params }: { params: { id: string; subtaskId: string } }) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const body = await req.json()
  const subTask = await prisma.subTask.update({
    where: { id: parseInt(params.subtaskId) },
    data: {
      ...(body.title !== undefined && { title: body.title }),
      ...(body.completed !== undefined && { completed: body.completed }),
      ...(body.position !== undefined && { position: body.position }),
    },
  })
  return NextResponse.json(subTask)
}

export async function DELETE(_: NextRequest, { params }: { params: { id: string; subtaskId: string } }) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  await prisma.subTask.delete({ where: { id: parseInt(params.subtaskId) } })
  return NextResponse.json({ ok: true })
}
