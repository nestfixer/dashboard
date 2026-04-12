import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/auth"

export async function GET(_: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const subTasks = await prisma.subTask.findMany({
    where: { workOrderId: parseInt(params.id) },
    orderBy: [{ position: "asc" }, { createdAt: "asc" }],
  })
  return NextResponse.json(subTasks)
}

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const { title } = await req.json()
  if (!title?.trim()) return NextResponse.json({ error: "Title required" }, { status: 400 })
  const count = await prisma.subTask.count({ where: { workOrderId: parseInt(params.id) } })
  const subTask = await prisma.subTask.create({
    data: { workOrderId: parseInt(params.id), title: title.trim(), position: count },
  })
  return NextResponse.json(subTask)
}
