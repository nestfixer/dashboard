import { auth } from "@/auth"
import { redirect } from "next/navigation"

export async function requireAuth() {
  const session = await auth()
  if (!session?.user?.id) redirect("/login")
  return { userId: parseInt(session.user.id), session }
}

export async function getSession() {
  return await auth()
}
