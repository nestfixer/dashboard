import { requireAuth } from "@/lib/auth-helpers"
import { prisma } from "@/lib/prisma"
import { WorkOrderForm } from "@/components/work-orders/WorkOrderForm"

export default async function NewWorkOrderPage() {
  const { userId } = await requireAuth()
  const [customers, users] = await Promise.all([
    prisma.customer.findMany({ orderBy: { name: "asc" } }),
    prisma.user.findMany({ select: { id: true, displayName: true } }),
  ])
  return (
    <div className="max-w-2xl">
      <h2 className="text-xl font-semibold text-gray-900 mb-6">New Work Order</h2>
      <WorkOrderForm customers={customers} users={users} currentUserId={userId} />
    </div>
  )
}
