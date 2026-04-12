import { prisma } from "@/lib/prisma"
import { requireAuth } from "@/lib/auth-helpers"
import Link from "next/link"
import { StatusBadge } from "@/components/shared/StatusBadge"
import { PriorityBadge } from "@/components/shared/PriorityBadge"
import { DueDateBadge } from "@/components/shared/DueDateBadge"
import { getDueDateStatus, dueDateRowClasses } from "@/lib/due-date"
import { WorkOrderFilters } from "@/components/work-orders/WorkOrderFilters"
import { PageHeader } from "@/components/layout/PageHeader"
import { EmptyState } from "@/components/shared/EmptyState"
import Button from "@/components/ui/Button"

export default async function WorkOrdersPage({
  searchParams,
}: {
  searchParams: { search?: string; status?: string; assignedTo?: string; sort?: string; order?: string }
}) {
  await requireAuth()

  const { search = "", status = "", assignedTo = "", sort = "createdAt", order = "desc" } = searchParams

  const where: any = {}
  if (search) {
    where.OR = [
      { title: { contains: search } },
      { customer: { name: { contains: search } } },
    ]
  }
  if (status) where.status = status
  if (assignedTo) where.assignedToId = parseInt(assignedTo)

  const validSort = ["createdAt", "dueDate", "priority", "status", "title"]
  const sortField = validSort.includes(sort) ? sort : "createdAt"

  const [workOrders, users] = await Promise.all([
    prisma.workOrder.findMany({
      where,
      include: {
        customer: { select: { name: true } },
        createdBy: { select: { id: true, displayName: true, color: true } },
        assignedTo: { select: { id: true, displayName: true, color: true } },
        _count: { select: { comments: true, timeEntries: true } },
      },
      orderBy: { [sortField]: order as "asc" | "desc" },
    }),
    prisma.user.findMany({ select: { id: true, displayName: true } }),
  ])

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-gray-900">Work Orders</h2>
        <Link
          href="/work-orders/new"
          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-lg transition-colors"
        >
          + New Work Order
        </Link>
      </div>

      <WorkOrderFilters users={users} />

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {workOrders.length === 0 ? (
          <div className="py-16 text-center flex flex-col items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center">
              <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
              </svg>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-700">{search ? "No work orders match your search" : "No work orders yet"}</p>
              <p className="text-xs text-gray-400 mt-0.5">{search ? "Try a different search term or filter" : "Create your first work order to get started"}</p>
            </div>
            {!search && (
              <Link href="/work-orders/new" className="mt-1 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-lg transition-colors">
                + New Work Order
              </Link>
            )}
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-600 uppercase tracking-wide">Title</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-600 uppercase tracking-wide">Customer</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-600 uppercase tracking-wide">Status</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-600 uppercase tracking-wide">Priority</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-600 uppercase tracking-wide">Due Date</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-600 uppercase tracking-wide">Assigned To</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {workOrders.map((wo) => {
                const dueSt = getDueDateStatus(wo.dueDate)
                const rowCls = dueSt && wo.status !== "Completed" ? dueDateRowClasses[dueSt] : ""
                return (
                  <tr key={wo.id} className={`hover:bg-gray-50 transition-colors ${rowCls}`}>
                    <td className="px-4 py-3">
                      <Link href={`/work-orders/${wo.id}`} className="font-medium text-gray-900 hover:text-indigo-600">
                        {wo.title}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-gray-600">{wo.customer?.name ?? "—"}</td>
                    <td className="px-4 py-3"><StatusBadge status={wo.status as any} /></td>
                    <td className="px-4 py-3"><PriorityBadge priority={wo.priority as any} /></td>
                    <td className="px-4 py-3">
                      {wo.status !== "Completed" ? <DueDateBadge dueDate={wo.dueDate} /> : <span className="text-xs text-gray-400">—</span>}
                    </td>
                    <td className="px-4 py-3">
                      {wo.assignedTo ? (
                        <div className="flex items-center gap-1.5">
                          <div
                            className="w-5 h-5 rounded-full flex items-center justify-center text-white text-xs font-bold"
                            style={{ backgroundColor: wo.assignedTo.color }}
                          >
                            {wo.assignedTo.displayName[0]}
                          </div>
                          <span className="text-gray-600">{wo.assignedTo.displayName}</span>
                        </div>
                      ) : <span className="text-gray-400">Unassigned</span>}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
