import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"
import { exportBackup, importBackup } from "@/lib/backup"

export async function GET() {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const backup = await exportBackup()
  const json = JSON.stringify(backup, null, 2)

  return new NextResponse(json, {
    headers: {
      "Content-Type": "application/json",
      "Content-Disposition": `attachment; filename="dashboard-backup-${new Date().toISOString().split("T")[0]}.json"`,
    },
  })
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const body = await req.json()
  if (!body?.data || !body?.version) {
    return NextResponse.json({ error: "Invalid backup file" }, { status: 400 })
  }

  await importBackup(body)
  return NextResponse.json({ success: true })
}
