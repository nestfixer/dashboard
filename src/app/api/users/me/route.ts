import { NextRequest, NextResponse } from "next/server"
import { revalidatePath } from "next/cache"
import { prisma } from "@/lib/prisma"
import { auth } from "@/auth"
import bcrypt from "bcryptjs"
import { z } from "zod"

const UpdateProfileSchema = z.object({
  displayName: z.string().min(1).max(64).optional(),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/).optional(),
  currentPassword: z.string().optional(),
  newPassword: z.string().min(6).optional(),
})

export async function GET() {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const user = await prisma.user.findUnique({
    where: { id: parseInt(session.user.id) },
    select: { id: true, username: true, displayName: true, color: true },
  })
  return NextResponse.json(user)
}

export async function PATCH(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const body = await req.json()
  const parsed = UpdateProfileSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })

  const userId = parseInt(session.user.id)
  const { displayName, color, currentPassword, newPassword } = parsed.data

  if (newPassword) {
    if (!currentPassword) return NextResponse.json({ error: "Current password required" }, { status: 400 })
    const user = await prisma.user.findUnique({ where: { id: userId } })
    if (!user) return NextResponse.json({ error: "Not found" }, { status: 404 })
    const valid = await bcrypt.compare(currentPassword, user.passwordHash)
    if (!valid) return NextResponse.json({ error: "Current password is incorrect" }, { status: 400 })
  }

  const data: Record<string, unknown> = {}
  if (displayName) data.displayName = displayName
  if (color) data.color = color
  if (newPassword) data.passwordHash = await bcrypt.hash(newPassword, 10)

  const user = await prisma.user.update({
    where: { id: userId },
    data,
    select: { id: true, username: true, displayName: true, color: true },
  })

  revalidatePath("/dashboard")
  return NextResponse.json(user)
}
