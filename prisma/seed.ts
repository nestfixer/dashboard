import { PrismaClient } from "@prisma/client"
import bcrypt from "bcryptjs"

const prisma = new PrismaClient()

async function main() {
  const hash = await bcrypt.hash("Blueleg5.", 10)
  await prisma.user.upsert({
    where: { username: "morgan" },
    update: {},
    create: {
      username: "morgan",
      passwordHash: hash,
      displayName: "Morgan",
      color: "#6366f1",
    },
  })
  console.log("✓ User morgan created")
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
