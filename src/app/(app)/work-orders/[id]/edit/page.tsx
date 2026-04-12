import { prisma } from "@/lib/prisma"
import { requireAuth } from "@/lib/auth-helpers"
import { notFound } from "next/navigation"
import { WorkOrderForm } from "@/components/work-orders/WorkOrderForm"

export default async function EditWorkOrderPage({ params }: { params: { id: string } }) {
  const { userId } = await requireAuth()
  const [wo, customers, users] = await Promise.all([
    prisma.workOrder.findUnique({ where: { id: parseInt(params.id) } }),
    prisma.customer.findMany({ orderBy: { name: "asc" } }),
    prisma.user.findMany({ select: { id: true, displayName: true } }),
  ])
  if (!wo) notFound()
  return (
    <div className="max-w-2xl">
      <h2 className="text-xl font-semibold text-gray-900 mb-6">Edit Work Order</h2>
      <WorkOrderForm
        customers={customers}
        users={users}
        currentUserId={userId}
        defaultValues={{
          id: wo.id,
          title: wo.title,
          description: wo.description ?? undefined,
          priority: wo.priority,
          dueDate: wo.dueDate?.toISOString() ?? null,
          remarks: wo.remarks ?? null,
          customerId: wo.customerId ?? null,
        }}
      />
    </div>
  )
}
