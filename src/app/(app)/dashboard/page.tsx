import { prisma } from "@/lib/prisma"
import { requireAuth } from "@/lib/auth-helpers"
import Link from "next/link"
import { getDueDateStatus, dueDateClasses } from "@/lib/due-date"
import { format, addDays, startOfDay, endOfDay } from "date-fns"
import { DashboardCalendar } from "@/components/dashboard/DashboardCalendar"

export default async function DashboardPage() {
  const { userId } = await requireAuth()

  const allUsers = await prisma.user.findMany({ select: { id: true, displayName: true, color: true } })
  const otherUser = allUsers.find((u) => u.id !== userId)

  const todayStart = startOfDay(new Date())
  const todayEnd = endOfDay(new Date())

  const [totalWOs, pendingWOs, acceptedWOs, completedWOs, myWOs, recentWOs, todayWOs, otherUser_data] = await Promise.all([
    prisma.workOrder.count(),
    prisma.workOrder.count({ where: { status: "Pending" } }),
    prisma.workOrder.count({ where: { status: "Accepted" } }),
    prisma.workOrder.count({ where: { status: "Completed" } }),
    prisma.workOrder.count({ where: { assignedToId: userId, status: { not: "Completed" } } }),
    prisma.workOrder.findMany({
      take: 6,
      orderBy: { updatedAt: "desc" },
      include: {
        customer: { select: { name: true } },
        assignedTo: { select: { displayName: true, color: true } },
      },
    }),
    // Today: due today OR accepted (in-progress) with no specific due date
    prisma.workOrder.findMany({
      where: {
        status: { not: "Completed" },
        OR: [
          { dueDate: { gte: todayStart, lte: todayEnd } },
          { status: "Accepted", dueDate: null },
          { dueDate: { lte: todayEnd } }, // overdue — still needs doing
        ],
      },
      include: {
        customer: { select: { name: true } },
        assignedTo: { select: { displayName: true, color: true } },
        subTasks: { orderBy: [{ position: "asc" }, { createdAt: "asc" }] },
      },
      orderBy: [{ dueDate: "asc" }, { priority: "desc" }],
      take: 20,
    }),
    otherUser
      ? prisma.workOrder.findMany({
          where: {
            assignedToId: otherUser.id,
            status: { not: "Completed" },
            dueDate: { lte: addDays(new Date(), 3) },
          },
          select: { id: true, title: true, dueDate: true, status: true },
          orderBy: { dueDate: "asc" },
          take: 5,
        })
      : Promise.resolve([]),
  ])

  const stats = [
    { label: "Total WOs", value: totalWOs, color: "bg-indigo-50 text-indigo-700 border-indigo-200" },
    { label: "Pending", value: pendingWOs, color: "bg-yellow-50 text-yellow-700 border-yellow-200" },
    { label: "In Progress", value: acceptedWOs, color: "bg-blue-50 text-blue-700 border-blue-200" },
    { label: "Completed", value: completedWOs, color: "bg-green-50 text-green-700 border-green-200" },
    { label: "My Open WOs", value: myWOs, color: "bg-purple-50 text-purple-700 border-purple-200" },
  ]

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-gray-900">Dashboard</h2>
        <Link href="/work-orders/new" className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-lg transition-colors">
          + New Work Order
        </Link>
      </div>

      <div className="grid grid-cols-5 gap-3">
        {stats.map((s) => (
          <div key={s.label} className={`rounded-xl border p-4 ${s.color}`}>
            <div className="text-2xl font-bold">{s.value}</div>
            <div className="text-xs font-medium mt-1 opacity-80">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Calendar + Today's Schedule */}
      <div className="grid grid-cols-3 gap-5">
        {/* Calendar — takes 2/3 */}
        <div className="col-span-2">
          <DashboardCalendar />
        </div>

        {/* Today's schedule — 1/3 */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-gray-900">
              Today — {format(new Date(), "MMM d")}
            </h3>
            <span className="text-xs text-gray-400">{todayWOs.length} job{todayWOs.length !== 1 ? "s" : ""}</span>
          </div>

          {todayWOs.length === 0 ? (
            <div className="bg-white rounded-xl border border-gray-200 py-10 text-center">
              <p className="text-sm text-gray-400">Nothing scheduled today</p>
            </div>
          ) : (
            <div className="space-y-2">
              {todayWOs.map((wo) => {
                const dueSt = getDueDateStatus(wo.dueDate)
                const completedSubs = wo.subTasks.filter((s) => s.completed).length
                const totalSubs = wo.subTasks.length
                return (
                  <Link
                    key={wo.id}
                    href={`/work-orders/${wo.id}`}
                    className="block bg-white rounded-xl border border-gray-200 p-3.5 hover:border-indigo-300 hover:shadow-sm transition-all"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">{wo.title}</p>
                        {wo.customer && (
                          <p className="text-xs text-gray-500 truncate mt-0.5">{wo.customer.name}</p>
                        )}
                      </div>
                      {wo.assignedTo && (
                        <div
                          className="w-5 h-5 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0 mt-0.5"
                          style={{ backgroundColor: wo.assignedTo.color }}
                          title={wo.assignedTo.displayName}
                        >
                          {wo.assignedTo.displayName[0]}
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-2 mt-2 flex-wrap">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                        wo.status === "Pending" ? "bg-yellow-100 text-yellow-700" :
                        wo.status === "Accepted" ? "bg-blue-100 text-blue-700" :
                        "bg-green-100 text-green-700"
                      }`}>{wo.status}</span>

                      {wo.dueDate && dueSt && (
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${dueDateClasses[dueSt]}`}>
                          {format(new Date(wo.dueDate), "MMM d")}
                        </span>
                      )}

                      {totalSubs > 0 && (
                        <span className="text-xs text-gray-500 flex items-center gap-1">
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                          </svg>
                          {completedSubs}/{totalSubs}
                        </span>
                      )}
                    </div>

                    {totalSubs > 0 && (
                      <div className="mt-2 h-1 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-indigo-400 rounded-full transition-all"
                          style={{ width: `${Math.round((completedSubs / totalSubs) * 100)}%` }}
                        />
                      </div>
                    )}
                  </Link>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {/* Recent Work Orders */}
      <div className="bg-white rounded-xl border border-gray-200">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <h3 className="text-sm font-semibold text-gray-900">Recent Work Orders</h3>
          <Link href="/work-orders" className="text-xs text-indigo-600 hover:underline">View all</Link>
        </div>
        <div className="divide-y divide-gray-100">
          {recentWOs.length === 0 && (
            <p className="text-sm text-gray-500 px-5 py-6 text-center">No work orders yet.</p>
          )}
          {recentWOs.map((wo) => {
            const dueSt = getDueDateStatus(wo.dueDate)
            return (
              <Link key={wo.id} href={`/work-orders/${wo.id}`} className="flex items-center gap-4 px-5 py-3 hover:bg-gray-50 transition-colors">
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-gray-900 truncate">{wo.title}</div>
                  <div className="text-xs text-gray-500">{wo.customer?.name ?? "No customer"}</div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  {wo.dueDate && dueSt && (
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${dueDateClasses[dueSt]}`}>
                      {format(new Date(wo.dueDate), "MMM d")}
                    </span>
                  )}
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                    wo.status === "Pending" ? "bg-yellow-100 text-yellow-700" :
                    wo.status === "Accepted" ? "bg-blue-100 text-blue-700" :
                    "bg-green-100 text-green-700"
                  }`}>{wo.status}</span>
                  {wo.assignedTo && (
                    <div className="w-5 h-5 rounded-full flex items-center justify-center text-white text-xs font-bold"
                      style={{ backgroundColor: wo.assignedTo.color }} title={wo.assignedTo.displayName}>
                      {wo.assignedTo.displayName[0]}
                    </div>
                  )}
                </div>
              </Link>
            )
          })}
        </div>
      </div>

      {/* Partner's work */}
      {otherUser && (
        <div className="bg-white rounded-xl border border-gray-200">
          <div className="flex items-center gap-2.5 px-5 py-4 border-b border-gray-100">
            <div className="w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
              style={{ backgroundColor: otherUser.color }}>
              {otherUser.displayName[0]}
            </div>
            <h3 className="text-sm font-semibold text-gray-900">{otherUser.displayName}&apos;s Work</h3>
          </div>
          {(otherUser_data as any[]).length === 0 ? (
            <p className="text-sm text-gray-400 px-5 py-4">No work orders due in the next 3 days.</p>
          ) : (
            <div className="divide-y divide-gray-100">
              {(otherUser_data as { id: number; title: string; dueDate: string | null; status: string }[]).map((wo) => {
                const dueSt = getDueDateStatus(wo.dueDate)
                return (
                  <Link key={wo.id} href={`/work-orders/${wo.id}`} className="flex items-center justify-between px-5 py-3 hover:bg-gray-50 transition-colors">
                    <span className="text-sm text-gray-800 truncate">{wo.title}</span>
                    <div className="flex items-center gap-2 flex-shrink-0 ml-4">
                      {wo.dueDate && dueSt && (
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${dueDateClasses[dueSt]}`}>
                          {format(new Date(wo.dueDate), "MMM d")}
                        </span>
                      )}
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                        wo.status === "Pending" ? "bg-yellow-100 text-yellow-700" :
                        wo.status === "Accepted" ? "bg-blue-100 text-blue-700" :
                        "bg-green-100 text-green-700"
                      }`}>{wo.status}</span>
                    </div>
                  </Link>
                )
              })}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
