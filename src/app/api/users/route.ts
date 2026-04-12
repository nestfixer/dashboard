import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/auth"

export async function GET() {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const users = await prisma.user.findMany({
    select: { id: true, displayName: true, color: true },
    orderBy: { displayName: "asc" },
  })
  return NextResponse.json(users)
}
