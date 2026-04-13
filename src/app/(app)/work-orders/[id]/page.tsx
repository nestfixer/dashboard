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
      <div className="bg-card rounded-xl border border-border p-6 shadow-sm">

        {/* Top row: breadcrumb + status/elapsed */}
        <div className="flex items-center justify-between gap-4 mb-4">
          <nav className="flex items-center gap-1.5 text-sm text-muted">
            <Link href="/work-orders" className="hover:text-accent-blue transition-colors">
              Work Orders
            </Link>
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
            <span className="text-white font-medium">#{wo.id}</span>
          </nav>

          <div className="flex items-center gap-3">
            <StatusBadge status={wo.status as any} />
            <span className="text-[10px] font-bold text-muted uppercase tracking-widest">
              Elapsed Time:
              <span className="text-white ml-2">{totalHours} hrs logged</span>
            </span>
          </div>
        </div>

        {/* Title */}
        <h1 className="text-2xl font-bold text-white leading-tight mb-2 tracking-tight">
          {wo.title}
        </h1>

        {/* Subtitle */}
        <p className="text-sm text-muted mb-8">
          {wo.dueDate
            ? `Scheduled for ${format(new Date(wo.dueDate), "MMMM d, yyyy")}`
            : "No due date set"}
          {" · "}Priority:{" "}
          <span className="font-semibold text-white">{wo.priority}</span>
        </p>

        {/* Description - ALWAYS SHOW IF REQUESTED, but check if user meant they need it to be more obvious */}
        <div className="mb-8 p-5 bg-background/40 rounded-xl border border-border/50">
          <p className="text-[10px] font-bold text-muted uppercase tracking-widest mb-2.5 flex items-center gap-2">
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h7" />
            </svg>
            Work Order Description
          </p>
          <p className="text-sm text-white/90 leading-relaxed whitespace-pre-wrap">
            {wo.description || "No description provided."}
          </p>
        </div>

        {/* Info bar */}
        <div className="grid grid-cols-1 sm:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x divide-border border border-border rounded-xl bg-background/30 px-2 py-1">
          {/* Assigned Tech */}
          <div className="flex items-center gap-3 px-5 py-4">
            <div className="w-8 h-8 rounded-full bg-accent-blue/10 flex items-center justify-center flex-shrink-0">
              <svg className="w-4 h-4 text-accent-blue" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
            <div className="min-w-0">
              <p className="text-[10px] font-bold text-muted uppercase tracking-widest mb-0.5">Assigned Tech</p>
              <p className="text-sm font-semibold text-white truncate">
                {wo.assignedTo?.displayName ?? "Unassigned"}
              </p>
            </div>
          </div>

          {/* Priority */}
          <div className="flex items-center gap-3 px-5 py-4">
            <div className="w-8 h-8 rounded-full bg-accent-yellow/10 flex items-center justify-center flex-shrink-0">
              <svg className="w-4 h-4 text-accent-yellow" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <div className="min-w-0">
              <p className="text-[10px] font-bold text-muted uppercase tracking-widest mb-0.5">Priority</p>
              <p className="text-sm font-semibold text-white">{wo.priority}</p>
            </div>
          </div>

          {/* Customer */}
          <div className="flex items-center gap-3 px-5 py-4">
            <div className="w-8 h-8 rounded-full bg-accent-green/10 flex items-center justify-center flex-shrink-0">
              <svg className="w-4 h-4 text-accent-green" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            <div className="min-w-0">
              <p className="text-[10px] font-bold text-muted uppercase tracking-widest mb-0.5">Customer</p>
              <p className="text-sm font-semibold text-white truncate">
                {wo.customer?.name ?? "—"}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* ── Body ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">

        {/* Left: main content */}
        <div className="lg:col-span-2 space-y-6">
          <SubTaskList workOrderId={wo.id} initialSubTasks={wo.subTasks} />
          <ImageUploader workOrderId={wo.id} initialImages={wo.images} />
          <div id="comments">
            <CommentThread workOrderId={wo.id} initialComments={wo.comments as any} currentUserId={userId} />
          </div>
          <TimeTracker workOrderId={wo.id} initialEntries={wo.timeEntries as any} currentUserId={userId} />
        </div>

        {/* Right: sidebar */}
        <div className="space-y-6">

          {/* Customer Contact card */}
          {wo.customer && (
            <div className="bg-card rounded-xl border border-border p-6 shadow-sm">
              <p className="text-[10px] font-bold text-muted uppercase tracking-widest mb-4 flex items-center gap-2">
                <svg className="w-3 h-3 text-accent-blue" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                Customer Contact
              </p>

              <div className="flex items-center gap-4 mb-5">
                <div 
                  className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-lg flex-shrink-0 shadow-lg"
                  style={{ backgroundColor: wo.customer.color || "#4A90E2" }}
                >
                  {customerInitials}
                </div>
                <div className="min-w-0">
                  <p className="font-bold text-foreground text-base leading-tight">{wo.customer.name}</p>
                  {wo.customer.notes && (
                    <p className="text-xs text-muted-foreground truncate mt-1">{wo.customer.notes}</p>
                  )}
                </div>
              </div>

              {/* Action buttons */}
              <div className="flex items-center gap-2.5 mb-5">
                {wo.customer.address && (
                  <a
                    href={`https://maps.google.com/?q=${encodeURIComponent(wo.customer.address)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    title="Navigate"
                    className="flex items-center justify-center w-9 h-9 rounded-lg border border-border bg-white/[0.03] text-muted hover:text-accent-blue hover:border-accent-blue/50 hover:bg-accent-blue/5 transition-all active:scale-95"
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
                    className="flex items-center justify-center w-9 h-9 rounded-lg border border-border bg-white/[0.03] text-muted hover:text-accent-green hover:border-accent-green/50 hover:bg-accent-green/5 transition-all active:scale-95"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                    </svg>
                  </a>
                )}
                <a
                  href="#comments"
                  title="Message"
                  className="flex items-center justify-center w-9 h-9 rounded-lg border border-border bg-white/[0.03] text-muted hover:text-accent-blue hover:border-accent-blue/50 hover:bg-accent-blue/5 transition-all active:scale-95"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                </a>
              </div>

              {wo.remarks && (
                <div className="border-t border-white/5 pt-4">
                  <p className="text-[10px] font-bold text-muted uppercase tracking-widest mb-1.5 leading-relaxed">
                    Account Remarks
                  </p>
                  <p className="text-xs text-muted-foreground italic leading-relaxed">
                    {wo.remarks}
                  </p>
                </div>
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
            <div className="bg-card rounded-xl border border-border p-5 shadow-sm">
              <p className="text-[10px] font-bold text-muted uppercase tracking-widest mb-4 flex items-center gap-2">
                <svg className="w-3.5 h-3.5 text-accent-blue" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Related Invoices
              </p>
              <div className="space-y-1">
                {wo.invoices.map((inv) => (
                  <Link
                    key={inv.id}
                    href={`/invoices/${inv.id}`}
                    className="flex items-center justify-between p-2.5 -mx-1.5 rounded-lg text-sm text-foreground hover:bg-white/[0.03] transition-all group"
                  >
                    <span className="font-medium group-hover:text-accent-blue transition-colors">{inv.invoiceNumber}</span>
                    <span className="text-muted tabular-nums decoration-white/20 ">${inv.grandTotal.toFixed(2)}</span>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* CTA: Actions + Edit */}
          <div className="space-y-3 pt-2">
            <WorkOrderActions
              workOrderId={wo.id}
              status={wo.status}
              assignedToId={wo.assignedToId}
              currentUserId={userId}
              users={users}
            />
            <Link
              href={`/work-orders/${wo.id}/edit`}
              className="flex items-center justify-center w-full px-4 py-3 text-sm font-bold uppercase tracking-wider text-foreground border border-border rounded-xl bg-white/[0.03] hover:bg-white/[0.08] hover:border-accent-blue/30 transition-all active:scale-[0.98] shadow-sm"
            >
              Edit Work Order
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
