import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/auth"

export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { searchParams } = req.nextUrl
  const userId = searchParams.get("userId")
  const startDate = searchParams.get("startDate")
  const endDate = searchParams.get("endDate")

  const entries = await prisma.timeEntry.findMany({
    where: {
      ...(userId ? { userId: parseInt(userId) } : {}),
      ...(startDate || endDate
        ? {
            date: {
              ...(startDate ? { gte: new Date(startDate) } : {}),
              ...(endDate ? { lte: new Date(endDate) } : {}),
            },
          }
        : {}),
    },
    include: {
      user: { select: { id: true, displayName: true } },
      workOrder: { select: { id: true, title: true } },
    },
    orderBy: { date: "asc" },
  })
  return NextResponse.json(entries)
}
