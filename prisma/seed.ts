import { PrismaClient } from "@prisma/client"
import bcrypt from "bcryptjs"

const prisma = new PrismaClient()

async function main() {
  const password1 = await bcrypt.hash("password123", 10)
  const password2 = await bcrypt.hash("password456", 10)

  const user1 = await prisma.user.upsert({
    where: { username: "user1" },
    update: {},
    create: {
      username: "user1",
      passwordHash: password1,
      displayName: "Alex",
      color: "#6366f1",
    },
  })

  const user2 = await prisma.user.upsert({
    where: { username: "user2" },
    update: {},
    create: {
      username: "user2",
      passwordHash: password2,
      displayName: "Jordan",
      color: "#f59e0b",
    },
  })

  console.log("Seeded users:", user1.username, user2.username)
  console.log("")
  console.log("Login credentials:")
  console.log("  user1 / password123  (Alex)")
  console.log("  user2 / password456  (Jordan)")
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
