"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { format } from "date-fns"

interface WorkOrder {
  id: number
  title: string
  status: string
  dueDate: string | null
  assignedTo: { id: number; displayName: string } | null
}

interface Customer {
  id: number
  name: string
  phone: string | null
  email: string | null
  address: string | null
  notes: string | null
  createdAt: string
  workOrders: WorkOrder[]
}

const STATUS_STYLES: Record<string, string> = {
  Pending: "bg-yellow-100 text-yellow-700",
  Accepted: "bg-blue-100 text-blue-700",
  Completed: "bg-green-100 text-green-700",
}

export default function CustomerDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const [customer, setCustomer] = useState<Customer | null>(null)
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const [name, setName] = useState("")
  const [phone, setPhone] = useState("")
  const [email, setEmail] = useState("")
  const [address, setAddress] = useState("")
  const [notes, setNotes] = useState("")

  useEffect(() => {
    fetch(`/api/customers/${params.id}`)
      .then((r) => r.json())
      .then((data) => {
        setCustomer(data)
        setName(data.name ?? "")
        setPhone(data.phone ?? "")
        setEmail(data.email ?? "")
        setAddress(data.address ?? "")
        setNotes(data.notes ?? "")
        setLoading(false)
      })
  }, [params.id])

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    const res = await fetch(`/api/customers/${params.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, phone: phone || null, email: email || null, address: address || null, notes: notes || null }),
    })
    if (res.ok) {
      const updated = await res.json()
      setCustomer((prev) => (prev ? { ...prev, ...updated } : null))
      setEditing(false)
    }
    setSaving(false)
  }

  async function handleDelete() {
    setDeleting(true)
    await fetch(`/api/customers/${params.id}`, { method: "DELETE" })
    router.push("/customers")
  }

  if (loading) return <div className="flex items-center justify-center h-64"><p className="text-sm text-gray-400">Loading…</p></div>
  if (!customer) return <div className="text-sm text-red-500">Customer not found.</div>

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/customers" className="text-sm text-gray-500 hover:text-gray-700 transition-colors">← Customers</Link>
          <h2 className="text-xl font-semibold text-gray-900">{customer.name}</h2>
        </div>
        {!editing && (
          <div className="flex items-center gap-2">
            <button onClick={() => setEditing(true)} className="px-3 py-1.5 text-sm text-gray-600 border border-gray-300 hover:bg-gray-50 rounded-lg transition-colors">Edit</button>
            <button onClick={() => setConfirmDelete(true)} className="px-3 py-1.5 text-sm text-red-600 border border-red-200 hover:bg-red-50 rounded-lg transition-colors">Delete</button>
          </div>
        )}
      </div>

      {confirmDelete && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-center justify-between">
          <p className="text-sm text-red-700">Delete this customer? This cannot be undone.</p>
          <div className="flex gap-2">
            <button onClick={() => setConfirmDelete(false)} className="px-3 py-1.5 text-sm text-gray-600 hover:bg-white rounded-lg transition-colors">Cancel</button>
            <button onClick={handleDelete} disabled={deleting} className="px-3 py-1.5 text-sm text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors disabled:opacity-50">
              {deleting ? "Deleting…" : "Confirm Delete"}
            </button>
          </div>
        </div>
      )}

      <div className="bg-white rounded-xl border border-gray-200 p-6">
        {editing ? (
          <form onSubmit={handleSave} className="space-y-4">
            <h3 className="text-sm font-semibold text-gray-900 mb-4">Edit Customer</h3>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Name *</label>
              <input value={name} onChange={(e) => setName(e.target.value)} required className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Phone</label>
                <input value={phone} onChange={(e) => setPhone(e.target.value)} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Email</label>
                <input value={email} onChange={(e) => setEmail(e.target.value)} type="email" className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Address</label>
              <input value={address} onChange={(e) => setAddress(e.target.value)} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Notes</label>
              <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none" />
            </div>
            <div className="flex gap-3 pt-2">
              <button type="submit" disabled={saving} className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-sm font-medium rounded-lg transition-colors">
                {saving ? "Saving…" : "Save Changes"}
              </button>
              <button type="button" onClick={() => setEditing(false)} className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">Cancel</button>
            </div>
          </form>
        ) : (
          <div className="grid grid-cols-2 gap-x-8 gap-y-4 text-sm">
            <div>
              <p className="text-xs font-medium text-gray-500 mb-0.5">Phone</p>
              <p className="text-gray-900">{customer.phone || <span className="text-gray-400">—</span>}</p>
            </div>
            <div>
              <p className="text-xs font-medium text-gray-500 mb-0.5">Email</p>
              <p className="text-gray-900">{customer.email || <span className="text-gray-400">—</span>}</p>
            </div>
            <div>
              <p className="text-xs font-medium text-gray-500 mb-0.5">Address</p>
              <p className="text-gray-900">{customer.address || <span className="text-gray-400">—</span>}</p>
            </div>
            <div>
              <p className="text-xs font-medium text-gray-500 mb-0.5">Customer since</p>
              <p className="text-gray-900">{format(new Date(customer.createdAt), "MMMM d, yyyy")}</p>
            </div>
            {customer.notes && (
              <div className="col-span-2">
                <p className="text-xs font-medium text-gray-500 mb-0.5">Notes</p>
                <p className="text-gray-700 whitespace-pre-wrap">{customer.notes}</p>
              </div>
            )}
          </div>
        )}
      </div>

      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-gray-900">Work Orders ({customer.workOrders.length})</h3>
          <Link href={`/work-orders/new`} className="text-xs text-indigo-600 hover:text-indigo-800 font-medium transition-colors">+ New WO</Link>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          {customer.workOrders.length === 0 ? (
            <p className="text-sm text-gray-400 py-8 text-center">No work orders for this customer.</p>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-600 uppercase tracking-wide">Title</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-600 uppercase tracking-wide">Status</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-600 uppercase tracking-wide">Assigned To</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-600 uppercase tracking-wide">Due</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {customer.workOrders.map((wo) => (
                  <tr key={wo.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3">
                      <Link href={`/work-orders/${wo.id}`} className="font-medium text-gray-900 hover:text-indigo-600 transition-colors">{wo.title}</Link>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_STYLES[wo.status] ?? "bg-gray-100 text-gray-700"}`}>{wo.status}</span>
                    </td>
                    <td className="px-4 py-3 text-gray-600">{wo.assignedTo?.displayName ?? <span className="text-gray-300">Unassigned</span>}</td>
                    <td className="px-4 py-3 text-gray-500 text-xs">
                      {wo.dueDate ? format(new Date(wo.dueDate), "MMM d, yyyy") : <span className="text-gray-300">—</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  )
}
