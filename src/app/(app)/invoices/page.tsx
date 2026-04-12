import { prisma } from "@/lib/prisma"
import { requireAuth } from "@/lib/auth-helpers"
import Link from "next/link"
import { format } from "date-fns"

const STATUS_STYLES: Record<string, string> = {
  Draft: "bg-gray-100 text-gray-700",
  Sent: "bg-blue-100 text-blue-700",
  Paid: "bg-green-100 text-green-700",
}

function formatCurrency(n: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(n)
}

export default async function InvoicesPage({
  searchParams,
}: {
  searchParams: { status?: string }
}) {
  await requireAuth()
  const statusFilter = searchParams.status ?? ""

  const invoices = await prisma.invoice.findMany({
    where: statusFilter ? { status: statusFilter } : undefined,
    include: {
      workOrder: {
        include: { customer: { select: { name: true } } },
      },
    },
    orderBy: { issuedAt: "desc" },
  })

  const statuses = ["", "Draft", "Sent", "Paid"]

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-gray-900">Invoices</h2>
        <Link
          href="/work-orders"
          className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-gray-600 border border-gray-300 hover:bg-gray-50 rounded-lg transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
          Go to Work Orders
        </Link>
      </div>

      {/* Status filter tabs */}
      <div className="flex gap-1 mb-4 bg-gray-100 rounded-lg p-1 w-fit">
        {statuses.map((s) => (
          <Link
            key={s}
            href={s ? `/invoices?status=${s}` : "/invoices"}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
              statusFilter === s
                ? "bg-white text-gray-900 shadow-sm"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            {s || "All"}
          </Link>
        ))}
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {invoices.length === 0 ? (
          <div className="py-16 text-center">
            <p className="text-gray-500 text-sm">No invoices found.</p>
            <p className="text-xs text-gray-400 mt-1">Create invoices from a work order&apos;s detail page.</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-600 uppercase tracking-wide">Invoice #</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-600 uppercase tracking-wide">Work Order</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-600 uppercase tracking-wide">Customer</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-600 uppercase tracking-wide">Status</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-gray-600 uppercase tracking-wide">Total</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-600 uppercase tracking-wide">Issued</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {invoices.map((inv) => (
                <tr key={inv.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3">
                    <Link href={`/invoices/${inv.id}`} className="font-medium text-indigo-600 hover:text-indigo-800">
                      {inv.invoiceNumber}
                    </Link>
                  </td>
                  <td className="px-4 py-3">
                    <Link href={`/work-orders/${inv.workOrderId}`} className="text-gray-900 hover:text-indigo-600 transition-colors">
                      {inv.workOrder.title}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-gray-600">
                    {inv.workOrder.customer?.name ?? <span className="text-gray-300">—</span>}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_STYLES[inv.status] ?? "bg-gray-100 text-gray-700"}`}>
                      {inv.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right font-medium text-gray-900">
                    {formatCurrency(inv.grandTotal)}
                  </td>
                  <td className="px-4 py-3 text-gray-500 text-xs">
                    {format(new Date(inv.issuedAt), "MMM d, yyyy")}
                    {inv.paidAt && (
                      <p className="text-green-600">Paid {format(new Date(inv.paidAt), "MMM d")}</p>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
