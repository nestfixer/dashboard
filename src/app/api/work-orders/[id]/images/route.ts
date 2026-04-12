import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/auth"
import { writeFile } from "fs/promises"
import path from "path"
import { randomUUID } from "crypto"


export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const formData = await req.formData()
  const file = formData.get("file") as File | null
  if (!file) return NextResponse.json({ error: "No file" }, { status: 400 })

  if (file.size > 10 * 1024 * 1024) {
    return NextResponse.json({ error: "File too large (max 10MB)" }, { status: 400 })
  }

  const ext = file.name.split(".").pop() ?? "jpg"
  const filename = `${randomUUID()}.${ext}`
  const uploadDir = path.join(process.cwd(), "public", "uploads")
  const filePath = path.join(uploadDir, filename)

  const buffer = Buffer.from(await file.arrayBuffer())
  await writeFile(filePath, buffer)

  const image = await prisma.workOrderImage.create({
    data: {
      workOrderId: parseInt(params.id),
      filename,
      originalName: file.name,
      url: `/uploads/${filename}`,
    },
  })
  return NextResponse.json(image, { status: 201 })
}
