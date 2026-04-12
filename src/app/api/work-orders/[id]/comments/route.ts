import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/auth"
import { z } from "zod"

export async function GET(_: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const comments = await prisma.comment.findMany({
    where: { workOrderId: parseInt(params.id) },
    include: { author: { select: { id: true, displayName: true, color: true } } },
    orderBy: { createdAt: "asc" },
  })
  return NextResponse.json(comments)
}

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const body = await req.json()
  const parsed = z.object({ body: z.string().min(1) }).safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })

  const comment = await prisma.comment.create({
    data: {
      workOrderId: parseInt(params.id),
      authorId: parseInt(session.user.id),
      body: parsed.data.body,
    },
    include: { author: { select: { id: true, displayName: true, color: true } } },
  })
  return NextResponse.json(comment, { status: 201 })
}
