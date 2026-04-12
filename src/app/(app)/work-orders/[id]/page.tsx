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

  return (
    <div className="max-w-4xl space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 text-sm text-gray-500 mb-1">
            <Link href="/work-orders" className="hover:text-indigo-600">Work Orders</Link>
            <span>/</span>
            <span>#{wo.id}</span>
          </div>
          <h2 className="text-xl font-semibold text-gray-900">{wo.title}</h2>
          <div className="flex flex-wrap items-center gap-2 mt-2">
            <StatusBadge status={wo.status as any} />
            <PriorityBadge priority={wo.priority as any} />
            <DueDateBadge dueDate={wo.dueDate} />
          </div>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <Link
            href={`/work-orders/${wo.id}/edit`}
            className="px-3 py-1.5 text-sm font-medium text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Edit
          </Link>
          <WorkOrderActions
            workOrderId={wo.id}
            status={wo.status}
            assignedToId={wo.assignedToId}
            currentUserId={userId}
            users={users}
          />
        </div>
      </div>

      <div className="grid grid-cols-3 gap-6">
        {/* Main content */}
        <div className="col-span-2 space-y-6">
          {wo.description && (
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <h3 className="text-sm font-semibold text-gray-900 mb-2">Description</h3>
              <p className="text-sm text-gray-700 whitespace-pre-wrap">{wo.description}</p>
            </div>
          )}

          {wo.remarks && (
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <h3 className="text-sm font-semibold text-gray-900 mb-2">Remarks</h3>
              <p className="text-sm text-gray-700 whitespace-pre-wrap">{wo.remarks}</p>
            </div>
          )}

          <SubTaskList workOrderId={wo.id} initialSubTasks={wo.subTasks} />

          <MaterialsTable workOrderId={wo.id} initialMaterials={wo.materials} readonly={wo.status === "Completed"} />

          <ImageUploader workOrderId={wo.id} initialImages={wo.images} />

          <TimeTracker workOrderId={wo.id} initialEntries={wo.timeEntries as any} currentUserId={userId} />

          <CommentThread workOrderId={wo.id} initialComments={wo.comments as any} currentUserId={userId} />
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          <div className="bg-white rounded-xl border border-gray-200 p-4 space-y-3 text-sm">
            <h3 className="font-semibold text-gray-900">Details</h3>
            <div>
              <span className="text-gray-500">Created by</span>
              <div className="flex items-center gap-1.5 mt-0.5">
                <div className="w-4 h-4 rounded-full" style={{ backgroundColor: wo.createdBy.color }} />
                <span className="font-medium">{wo.createdBy.displayName}</span>
              </div>
            </div>
            {wo.assignedTo && (
              <div>
                <span className="text-gray-500">Assigned to</span>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <div className="w-4 h-4 rounded-full" style={{ backgroundColor: wo.assignedTo.color }} />
                  <span className="font-medium">{wo.assignedTo.displayName}</span>
                </div>
              </div>
            )}
            <div>
              <span className="text-gray-500">Created</span>
              <p className="font-medium">{format(new Date(wo.createdAt), "MMM d, yyyy")}</p>
            </div>
            {wo.acceptedAt && (
              <div>
                <span className="text-gray-500">Accepted</span>
                <p className="font-medium">{format(new Date(wo.acceptedAt), "MMM d, yyyy")}</p>
              </div>
            )}
            <div>
              <span className="text-gray-500">Time logged</span>
              <p className="font-medium">{totalHours} hrs</p>
            </div>
          </div>

          {wo.customer && (
            <div className="bg-white rounded-xl border border-gray-200 p-4 text-sm">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-semibold text-gray-900">Customer</h3>
                <Link href={`/customers/${wo.customer.id}`} className="text-xs text-indigo-600 hover:underline">View</Link>
              </div>
              <p className="font-medium">{wo.customer.name}</p>
              {wo.customer.phone && <p className="text-gray-600">{wo.customer.phone}</p>}
              {wo.customer.address && <p className="text-gray-600 text-xs mt-0.5">{wo.customer.address}</p>}
            </div>
          )}

          {wo.invoices.length > 0 && (
            <div className="bg-white rounded-xl border border-gray-200 p-4 text-sm">
              <h3 className="font-semibold text-gray-900 mb-2">Invoices</h3>
              {wo.invoices.map((inv) => (
                <Link key={inv.id} href={`/invoices/${inv.id}`} className="flex items-center justify-between py-1.5 hover:text-indigo-600">
                  <span>{inv.invoiceNumber}</span>
                  <span className="text-gray-500">${inv.grandTotal.toFixed(2)}</span>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
