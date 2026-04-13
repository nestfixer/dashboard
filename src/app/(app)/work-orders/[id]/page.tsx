import { prisma } from "@/lib/prisma"
import { requireAuth } from "@/lib/auth-helpers"
import { notFound } from "next/navigation"
import Link from "next/link"
import { StatusBadge } from "@/components/shared/StatusBadge"
import { PriorityBadge } from "@/components/shared/PriorityBadge"
import { DueDateBadge } from "@/components/shared/DueDateBadge"
import { MaterialsTable } from "@/components/work-orders/MaterialsTable"
import { CommentThread } from "@/components/work-orders/CommentThread"
import { TimeTracker } from "@/components/work-orders/TimeTracker"
import { ImageUploader } from "@/components/work-orders/ImageUploader"
import { WorkOrderActions } from "@/components/work-orders/WorkOrderActions"
import { SubTaskList } from "@/components/work-orders/SubTaskList"
import { UserAvatar } from "@/components/shared/UserAvatar"
import { format } from "date-fns"

export default async function WorkOrderDetailPage({ params }: { params: { id: string } }) {
  const { userId } = await requireAuth()

  const [wo, users] = await Promise.all([
    prisma.workOrder.findUnique({
      where: { id: parseInt(params.id) },
      include: {
        customer: true,
        createdBy: { select: { id: true, displayName: true, color: true } },
        assignedTo: { select: { id: true, displayName: true, color: true } },
        materials: { orderBy: { createdAt: "asc" } },
        images: { orderBy: { uploadedAt: "asc" } },
        comments: {
          include: { author: { select: { id: true, displayName: true, color: true } } },
          orderBy: { createdAt: "asc" },
        },
        timeEntries: {
          include: { user: { select: { id: true, displayName: true } } },
          orderBy: { date: "desc" },
        },
        invoices: { orderBy: { issuedAt: "desc" }, take: 5 },
        subTasks: { orderBy: [{ position: "asc" }, { createdAt: "asc" }] },
      },
    }),
    prisma.user.findMany({ select: { id: true, displayName: true } }),
  ])

  if (!wo) notFound()

  const totalMins = wo.timeEntries.reduce((sum, e) => sum + (e.durationMins ?? 0), 0)
  const totalHours = (totalMins / 60).toFixed(1)

  const customerInitials = wo.customer?.name
    ? wo.customer.name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : "?"

  return (
    <div className="max-w-7xl space-y-6">

      {/* ── Header Card ── */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">

        {/* Top row: breadcrumb + status/elapsed */}
        <div className="flex items-center justify-between gap-4 mb-4">
          <nav className="flex items-center gap-1.5 text-sm text-gray-400">
            <Link href="/work-orders" className="hover:text-indigo-600 transition-colors">
              Work Orders
            </Link>
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
            <span className="text-gray-600 font-medium">#{wo.id}</span>
          </nav>

          <div className="flex items-center gap-3">
            <StatusBadge status={wo.status as any} />
            <span className="text-xs font-semibold text-gray-400 uppercase tracking-widest">
              Elapsed Time:
              <span className="text-gray-700 ml-1">{totalHours} hrs logged</span>
            </span>
          </div>
        </div>

        {/* Title */}
        <h1 className="text-2xl font-bold text-gray-900 leading-tight mb-1">
          {wo.title}
        </h1>

        {/* Subtitle */}
        <p className="text-sm text-gray-500 mb-6">
          {wo.dueDate
            ? `Scheduled for ${format(new Date(wo.dueDate), "MMMM d, yyyy")}`
            : "No due date set"}
          {" · "}Priority:{" "}
          <span className="font-medium text-gray-700">{wo.priority}</span>
        </p>

        {/* Info bar */}
        <div className="grid grid-cols-1 sm:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x divide-gray-100 border border-gray-100 rounded-lg bg-gray-50">
          {/* Assigned Tech */}
          <div className="flex items-center gap-3 px-5 py-3.5">
            <div className="w-8 h-8 rounded-full bg-indigo-50 flex items-center justify-center flex-shrink-0">
              <svg className="w-4 h-4 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
            <div className="min-w-0">
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-0.5">Assigned Tech</p>
              <p className="text-sm font-semibold text-gray-800 truncate">
                {wo.assignedTo?.displayName ?? "Unassigned"}
              </p>
            </div>
          </div>

          {/* Priority */}
          <div className="flex items-center gap-3 px-5 py-3.5">
            <div className="w-8 h-8 rounded-full bg-amber-50 flex items-center justify-center flex-shrink-0">
              <svg className="w-4 h-4 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            <div className="min-w-0">
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-0.5">Priority</p>
              <p className="text-sm font-semibold text-gray-800">{wo.priority}</p>
            </div>
          </div>

          {/* Customer */}
          <div className="flex items-center gap-3 px-5 py-3.5">
            <div className="w-8 h-8 rounded-full bg-emerald-50 flex items-center justify-center flex-shrink-0">
              <svg className="w-4 h-4 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            <div className="min-w-0">
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-0.5">Customer</p>
              <p className="text-sm font-semibold text-gray-800 truncate">
                {wo.customer?.name ?? "—"}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* ── Body ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">

        {/* Left: main content */}
        <div className="lg:col-span-2 space-y-5">
          <SubTaskList workOrderId={wo.id} initialSubTasks={wo.subTasks} />
          <ImageUploader workOrderId={wo.id} initialImages={wo.images} />
          <div id="comments">
            <CommentThread workOrderId={wo.id} initialComments={wo.comments as any} currentUserId={userId} />
          </div>
          <TimeTracker workOrderId={wo.id} initialEntries={wo.timeEntries as any} currentUserId={userId} />
        </div>

        {/* Right: sidebar */}
        <div className="space-y-4">

          {/* Customer Contact card */}
          {wo.customer && (
            <div className="bg-white rounded-xl border border-gray-200 p-4">
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3">
                Customer Contact
              </p>

              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-full bg-indigo-600 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                  {customerInitials}
                </div>
                <div className="min-w-0">
                  <p className="font-semibold text-gray-900 text-sm leading-tight">{wo.customer.name}</p>
                  {wo.customer.notes && (
                    <p className="text-xs text-gray-400 truncate mt-0.5">{wo.customer.notes}</p>
                  )}
                </div>
              </div>

              {/* Action buttons */}
              <div className="flex items-center gap-2 mb-3">
                {wo.customer.address && (
                  <a
                    href={`https://maps.google.com/?q=${encodeURIComponent(wo.customer.address)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    title="Navigate"
                    className="flex items-center justify-center w-8 h-8 rounded-lg border border-gray-200 text-gray-500 hover:text-indigo-600 hover:border-indigo-200 hover:bg-indigo-50 transition-colors"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  </a>
                )}
                {wo.customer.phone && (
                  <a
                    href={`tel:${wo.customer.phone}`}
                    title="Call"
                    className="flex items-center justify-center w-8 h-8 rounded-lg border border-gray-200 text-gray-500 hover:text-emerald-600 hover:border-emerald-200 hover:bg-emerald-50 transition-colors"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                    </svg>
                  </a>
                )}
                <a
                  href="#comments"
                  title="Message"
                  className="flex items-center justify-center w-8 h-8 rounded-lg border border-gray-200 text-gray-500 hover:text-blue-600 hover:border-blue-200 hover:bg-blue-50 transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                </a>
              </div>

              {wo.remarks && (
                <p className="text-xs text-gray-400 italic border-t border-gray-100 pt-3 leading-relaxed">
                  {wo.remarks}
                </p>
              )}
            </div>
          )}

          {/* Materials */}
          <MaterialsTable
            workOrderId={wo.id}
            initialMaterials={wo.materials}
            readonly={wo.status === "Completed"}
          />

          {/* Invoices */}
          {wo.invoices.length > 0 && (
            <div className="bg-white rounded-xl border border-gray-200 p-4">
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3">
                Invoices
              </p>
              <div className="space-y-1">
                {wo.invoices.map((inv) => (
                  <Link
                    key={inv.id}
                    href={`/invoices/${inv.id}`}
                    className="flex items-center justify-between py-1.5 text-sm text-gray-700 hover:text-indigo-600 transition-colors"
                  >
                    <span className="font-medium">{inv.invoiceNumber}</span>
                    <span className="text-gray-500 tabular-nums">${inv.grandTotal.toFixed(2)}</span>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* CTA: Actions + Edit */}
          <div className="space-y-2">
            <WorkOrderActions
              workOrderId={wo.id}
              status={wo.status}
              assignedToId={wo.assignedToId}
              currentUserId={userId}
              users={users}
            />
            <Link
              href={`/work-orders/${wo.id}/edit`}
              className="flex items-center justify-center w-full px-4 py-2.5 text-sm font-medium text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 hover:border-gray-400 transition-colors"
            >
              Edit Work Order
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
