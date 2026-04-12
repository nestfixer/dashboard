import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/auth"

export async function DELETE(_: NextRequest, { params }: { params: { id: string; materialId: string } }) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  await prisma.material.delete({ where: { id: parseInt(params.materialId) } })
  return NextResponse.json({ success: true })
}
