"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { format } from "date-fns"
import { formatCurrency } from "@/lib/invoice-calc"
import { generateInvoicePDF } from "@/lib/pdf-generator"
import { Invoice } from "@/types"

const STATUS_STYLES: Record<string, string> = {
  Draft: "bg-gray-100 text-gray-700",
  Sent: "bg-blue-100 text-blue-700",
  Paid: "bg-green-100 text-green-700",
}

export default function InvoiceDetailPage({ params }: { params: { id: string } }) {
  const [invoice, setInvoice] = useState<Invoice | null>(null)
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState(false)

  useEffect(() => {
    fetch(`/api/invoices/${params.id}`)
      .then((r) => r.json())
      .then((data) => { setInvoice(data); setLoading(false) })
  }, [params.id])

  async function updateStatus(status: string) {
    setUpdating(true)
    const body: Record<string, string> = { status }
    if (status === "Paid") body.paidAt = new Date().toISOString()
    const res = await fetch(`/api/invoices/${params.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    })
    if (res.ok) {
      const updated = await res.json()
      setInvoice((prev) => (prev ? { ...prev, ...updated } : null))
    }
    setUpdating(false)
  }

  if (loading) return <div className="flex items-center justify-center h-64"><p className="text-sm text-gray-400">Loading…</p></div>
  if (!invoice) return <div className="text-sm text-red-500">Invoice not found.</div>

  const customer = invoice.workOrder?.customer

  return (
    <div className="max-w-3xl space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/invoices" className="text-sm text-gray-500 hover:text-gray-700 transition-colors">← Invoices</Link>
          <h2 className="text-xl font-semibold text-gray-900">{invoice.invoiceNumber}</h2>
          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${STATUS_STYLES[invoice.status] ?? "bg-gray-100 text-gray-700"}`}>
            {invoice.status}
          </span>
        </div>
        <button
          onClick={() => generateInvoicePDF(invoice)}
          className="flex items-center gap-2 px-3 py-1.5 text-sm text-indigo-600 border border-indigo-200 hover:bg-indigo-50 rounded-lg transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          Download PDF
        </button>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="grid grid-cols-2 gap-6 text-sm">
          <div>
            <p className="text-xs font-medium text-gray-500 mb-1">Bill To</p>
            {customer ? (
              <>
                <p className="font-semibold text-gray-900">{customer.name}</p>
                {customer.phone && <p className="text-gray-600 mt-0.5">{customer.phone}</p>}
                {customer.email && <p className="text-gray-600">{customer.email}</p>}
                {customer.address && <p className="text-gray-500 text-xs mt-1">{customer.address}</p>}
              </>
            ) : (
              <p className="text-gray-400">No customer attached</p>
            )}
          </div>
          <div className="space-y-3">
            <div>
              <p className="text-xs font-medium text-gray-500 mb-0.5">Work Order</p>
              <Link href={`/work-orders/${invoice.workOrderId}`} className="text-indigo-600 hover:text-indigo-800 font-medium">
                {invoice.workOrder?.title}
              </Link>
            </div>
            <div>
              <p className="text-xs font-medium text-gray-500 mb-0.5">Issued</p>
              <p className="text-gray-900">{format(new Date(invoice.issuedAt), "MMMM d, yyyy")}</p>
            </div>
            {invoice.paidAt && (
              <div>
                <p className="text-xs font-medium text-gray-500 mb-0.5">Paid</p>
                <p className="text-green-700 font-medium">{format(new Date(invoice.paidAt), "MMMM d, yyyy")}</p>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-600 uppercase tracking-wide">Description</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-600 uppercase tracking-wide">Type</th>
              <th className="text-right px-4 py-3 text-xs font-semibold text-gray-600 uppercase tracking-wide">Qty</th>
              <th className="text-right px-4 py-3 text-xs font-semibold text-gray-600 uppercase tracking-wide">Unit Cost</th>
              <th className="text-right px-4 py-3 text-xs font-semibold text-gray-600 uppercase tracking-wide">Total</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {(invoice.lines ?? []).map((line) => (
              <tr key={line.id}>
                <td className="px-4 py-3 text-gray-900">{line.description}</td>
                <td className="px-4 py-3">
                  <span className="text-xs px-1.5 py-0.5 rounded bg-gray-100 text-gray-600 capitalize">{line.lineType}</span>
                </td>
                <td className="px-4 py-3 text-right text-gray-600">{line.quantity}</td>
                <td className="px-4 py-3 text-right text-gray-600">{formatCurrency(line.unitCost)}</td>
                <td className="px-4 py-3 text-right font-medium text-gray-900">{formatCurrency(line.lineTotal)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="border-t border-gray-200 px-4 py-4 bg-gray-50 space-y-1.5 text-sm">
          <div className="flex justify-between text-gray-600">
            <span>Materials</span>
            <span>{formatCurrency(invoice.materialTotal)}</span>
          </div>
          {invoice.bufferAmount > 0 && (
            <div className="flex justify-between text-gray-600">
              <span>Buffer ({invoice.bufferPct}%)</span>
              <span>{formatCurrency(invoice.bufferAmount)}</span>
            </div>
          )}
          {invoice.laborTotal > 0 && (
            <div className="flex justify-between text-gray-600">
              <span>Labor ({invoice.laborHours}h @ {formatCurrency(invoice.laborRate)}/h)</span>
              <span>{formatCurrency(invoice.laborTotal)}</span>
            </div>
          )}
          <div className="flex justify-between font-semibold text-gray-900 text-base pt-1.5 border-t border-gray-200 mt-1">
            <span>Grand Total</span>
            <span>{formatCurrency(invoice.grandTotal)}</span>
          </div>
        </div>
      </div>

      {invoice.notes && (
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <p className="text-xs font-medium text-gray-500 mb-1">Notes</p>
          <p className="text-sm text-gray-700 whitespace-pre-wrap">{invoice.notes}</p>
        </div>
      )}

      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-3">Update Status</p>
        <div className="flex gap-2 flex-wrap">
          {invoice.status === "Draft" && (
            <button onClick={() => updateStatus("Sent")} disabled={updating}
              className="px-4 py-2 text-sm font-medium text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-lg transition-colors disabled:opacity-50">
              Mark as Sent
            </button>
          )}
          {invoice.status !== "Paid" && (
            <button onClick={() => updateStatus("Paid")} disabled={updating}
              className="px-4 py-2 text-sm font-medium text-green-700 bg-green-50 hover:bg-green-100 border border-green-200 rounded-lg transition-colors disabled:opacity-50">
              Mark as Paid
            </button>
          )}
          {invoice.status !== "Draft" && (
            <button onClick={() => updateStatus("Draft")} disabled={updating}
              className="px-4 py-2 text-sm font-medium text-gray-600 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-lg transition-colors disabled:opacity-50">
              Revert to Draft
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
