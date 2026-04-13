import { PrismaClient } from "@prisma/client"
import bcrypt from "bcryptjs"

const prisma = new PrismaClient()

async function main() {
  const morganHash = await bcrypt.hash("Blueleg5.", 10)
  await prisma.user.upsert({
    where: { username: "morgan" },
    update: { passwordHash: morganHash },
    create: {
      username: "morgan",
      passwordHash: morganHash,
      displayName: "Morgan",
      color: "#6366f1",
    },
  })
  console.log("✓ User morgan created")

  const neilHash = await bcrypt.hash("King123", 10)
  await prisma.user.upsert({
    where: { username: "neil" },
    update: { passwordHash: neilHash },
    create: {
      username: "neil",
      passwordHash: neilHash,
      displayName: "Neil",
      color: "#ef4444",
    },
  })
  console.log("✓ User neil created")
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
