import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/auth"

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const userId = parseInt(session.user.id)
  const { id } = await params
  const keyId = parseInt(id)

  const apiKey = await prisma.apiKey.findUnique({ where: { id: keyId } })
  if (!apiKey) return NextResponse.json({ error: "Not found" }, { status: 404 })
  if (apiKey.userId !== userId) return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  if (apiKey.revokedAt) return NextResponse.json({ error: "Already revoked" }, { status: 409 })

  await prisma.apiKey.update({
    where: { id: keyId },
    data: { revokedAt: new Date() },
  })

  return NextResponse.json({ revoked: true })
}
