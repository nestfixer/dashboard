import { NextRequest, NextResponse } from "next/server"
import { revalidatePath } from "next/cache"
import { prisma } from "@/lib/prisma"
import { auth } from "@/auth"
import { CreateWorkOrderSchema } from "@/lib/validations/work-order"
import { Prisma } from "@prisma/client"

export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { searchParams } = req.nextUrl
  const search = searchParams.get("search") ?? ""
  const status = searchParams.get("status") ?? ""
  const assignedTo = searchParams.get("assignedTo") ?? ""
  const sort = searchParams.get("sort") ?? "createdAt"
  const order = (searchParams.get("order") ?? "desc") as "asc" | "desc"

  const scheduled = searchParams.get("scheduled")
  
  const where: Prisma.WorkOrderWhereInput = {}
  if (search) {
    where.OR = [
      { title: { contains: search, mode: "insensitive" } },
      { customer: { name: { contains: search, mode: "insensitive" } } },
    ]
  }
  if (status) where.status = status
  if (assignedTo) where.assignedToId = parseInt(assignedTo)
  if (scheduled === "true") where.dueDate = { not: null }
  if (scheduled === "false") where.dueDate = null

  const validSort = ["createdAt", "dueDate", "priority", "status", "title"]
  const sortField = validSort.includes(sort) ? sort : "createdAt"

  const workOrders = await prisma.workOrder.findMany({
    where,
    include: {
      customer: true,
      createdBy: { select: { id: true, displayName: true, color: true } },
      assignedTo: { select: { id: true, displayName: true, color: true } },
      _count: { select: { comments: true, timeEntries: true } },
    },
    orderBy: { [sortField]: order },
  })

  return NextResponse.json(workOrders)
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const body = await req.json()
  const parsed = CreateWorkOrderSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })

  const userId = parseInt(session.user.id)
  const wo = await prisma.workOrder.create({
    data: {
      ...parsed.data,
      dueDate: parsed.data.dueDate ? new Date(parsed.data.dueDate) : undefined,
      createdById: userId,
    },
    include: {
      customer: true,
      createdBy: { select: { id: true, displayName: true, color: true } },
    },
  })

  revalidatePath("/dashboard")
  revalidatePath("/work-orders")
  return NextResponse.json(wo, { status: 201 })
}
