import { createHash } from "crypto"
import { prisma } from "@/lib/prisma"
import { ApiError } from "./errors"

export async function requireApiKey(request: Request) {
  const authHeader = request.headers.get("authorization")
  if (!authHeader?.startsWith("Bearer ")) {
    throw new ApiError("UNAUTHORIZED", 401, "Missing or invalid Authorization header")
  }

  const rawKey = authHeader.slice(7).trim()
  if (!rawKey) {
    throw new ApiError("UNAUTHORIZED", 401, "Missing or invalid Authorization header")
  }

  const keyHash = createHash("sha256").update(rawKey).digest("hex")

  const apiKey = await prisma.apiKey.findUnique({ where: { keyHash } })

  if (!apiKey || apiKey.revokedAt) {
    throw new ApiError("UNAUTHORIZED", 401, "Invalid or revoked API key")
  }

  prisma.apiKey
    .update({ where: { id: apiKey.id }, data: { lastUsedAt: new Date() } })
    .catch(() => {})

  return { apiKey, userId: apiKey.userId }
}
