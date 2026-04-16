import { prisma } from "@/lib/prisma"
import { requireAuth } from "@/lib/auth-helpers"
import Link from "next/link"
import { startOfDay, endOfDay, addDays } from "date-fns"
import { DashboardCalendar } from "@/components/dashboard/DashboardCalendar"
import { StatsGrid } from "@/components/dashboard/StatsGrid"
import { TodaySchedule } from "@/components/dashboard/TodaySchedule"
import { RecentWorkOrders } from "@/components/dashboard/RecentWorkOrders"
import { PartnerWork } from "@/components/dashboard/PartnerWork"
import { PageHeader } from "@/components/layout/PageHeader"

export default async function DashboardPage() {
  const { userId } = await requireAuth()

  const allUsers = await prisma.user.findMany({ select: { id: true, displayName: true, color: true } })
  const otherUser = allUsers.find((u) => u.id !== userId)

  const todayStart = startOfDay(new Date())
  const todayEnd = endOfDay(new Date())

  const [totalWOs, pendingWOs, acceptedWOs, completedWOs, myWOs, recentWOs, todayWOs, partnerWOs] = await Promise.all([
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
    prisma.workOrder.findMany({
      where: {
        status: { not: "Completed" },
        OR: [
          { dueDate: { gte: todayStart, lte: todayEnd } },
          { status: "Accepted", dueDate: null },
          { dueDate: { lte: todayEnd } }, // overdue
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

  return (
    <div className="space-y-6">
      <PageHeader
        title="Dashboard"
        action={
          <Link
            href="/work-orders/new"
            className="px-4 py-2 bg-accent-blue hover:bg-accent-blue/90 text-white text-sm font-medium rounded-lg transition-colors"
          >
            + New Work Order
          </Link>
        }
      />

      <StatsGrid
        totalWOs={totalWOs}
        pendingWOs={pendingWOs}
        acceptedWOs={acceptedWOs}
        completedWOs={completedWOs}
        myWOs={myWOs}
      />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
        <div className="lg:col-span-2">
          <DashboardCalendar />
        </div>

        <TodaySchedule jobs={todayWOs as React.ComponentProps<typeof TodaySchedule>["jobs"]} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <RecentWorkOrders workOrders={recentWOs as React.ComponentProps<typeof RecentWorkOrders>["workOrders"]} />
        {otherUser && <PartnerWork user={otherUser} workOrders={partnerWOs} />}
      </div>
    </div>
  )
}
