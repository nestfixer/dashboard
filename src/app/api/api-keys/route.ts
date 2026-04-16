import { NextRequest, NextResponse } from "next/server"
import { randomBytes, createHash } from "crypto"
import { prisma } from "@/lib/prisma"
import { auth } from "@/auth"

export async function GET() {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const userId = parseInt(session.user.id)
  const apiKeys = await prisma.apiKey.findMany({
    where: { userId, revokedAt: null },
    select: {
      id: true,
      name: true,
      keyPrefix: true,
      permissions: true,
      lastUsedAt: true,
      createdAt: true,
    },
    orderBy: { createdAt: "desc" },
  })

  return NextResponse.json(apiKeys)
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const userId = parseInt(session.user.id)
  const body = await req.json()
  const { name, permissions = ["read"] } = body

  if (!name || typeof name !== "string" || name.trim().length === 0) {
    return NextResponse.json({ error: "Name is required" }, { status: 400 })
  }

  const rawSecret = randomBytes(32).toString("hex")
  const rawKey = `sk_live_${rawSecret}`
  const keyHash = createHash("sha256").update(rawKey).digest("hex")
  const keyPrefix = `sk_live_${rawSecret.slice(0, 8)}`

  const apiKey = await prisma.apiKey.create({
    data: {
      name: name.trim(),
      keyHash,
      keyPrefix,
      userId,
      permissions,
    },
    select: {
      id: true,
      name: true,
      keyPrefix: true,
      permissions: true,
      createdAt: true,
    },
  })

  return NextResponse.json({ ...apiKey, key: rawKey }, { status: 201 })
}
