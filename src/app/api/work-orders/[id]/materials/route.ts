import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/auth"
import { z } from "zod"

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const body = await req.json()
  const schema = z.object({
    name: z.string().min(1),
    quantity: z.number().min(0).default(1),
    unitCost: z.number().min(0).default(0),
  })
  const parsed = schema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })

  const material = await prisma.material.create({
    data: { workOrderId: parseInt(params.id), ...parsed.data },
  })
  return NextResponse.json(material, { status: 201 })
}
