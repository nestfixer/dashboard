import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/auth"
import { unlink } from "fs/promises"
import path from "path"

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string; imageId: string }> }
) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { imageId } = await params
  const image = await prisma.workOrderImage.findUnique({ where: { id: parseInt(imageId) } })

  if (!image) return NextResponse.json({ error: "Not found" }, { status: 404 })

  // Delete DB record
  await prisma.workOrderImage.delete({ where: { id: image.id } })

  // Best-effort delete of file from disk
  const filePath = path.join(process.cwd(), "public", image.url)
  unlink(filePath).catch(() => {})

  return NextResponse.json({ deleted: true })
}
