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
  isPropertyManagement: boolean
  createdAt: string
  workOrders: WorkOrder[]
}

const STATUS_STYLES: Record<string, string> = {
  Pending: "bg-yellow-500/20 text-yellow-400",
  Accepted: "bg-blue-500/20 text-blue-400",
  Completed: "bg-green-500/20 text-green-400",
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
  const [isPropertyManagement, setIsPropertyManagement] = useState(false)

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
        setIsPropertyManagement(data.isPropertyManagement ?? false)
        setLoading(false)
      })
  }, [params.id])

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    const res = await fetch(`/api/customers/${params.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, phone: phone || null, email: email || null, address: address || null, notes: notes || null, isPropertyManagement }),
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

  if (loading) return <div className="flex items-center justify-center h-64"><p className="text-sm text-muted">Loading…</p></div>
  if (!customer) return <div className="text-sm text-red-400">Customer not found.</div>

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/customers" className="text-sm text-muted hover:text-[#1a2b6b] transition-colors">← Customers</Link>
          <h2 className="text-xl font-semibold text-foreground">{customer.name}</h2>
          {customer.isPropertyManagement && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-purple-500/15 text-purple-400">
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>
              Prop. Mgmt
            </span>
          )}
        </div>
        {!editing && (
          <div className="flex items-center gap-2">
            <button onClick={() => setEditing(true)} className="px-3 py-1.5 text-sm text-foreground border border-border hover:bg-gray-100 rounded-lg transition-colors">Edit</button>
            <button onClick={() => setConfirmDelete(true)} className="px-3 py-1.5 text-sm text-red-400 border border-red-500/30 hover:bg-red-500/10 rounded-lg transition-colors">Delete</button>
          </div>
        )}
      </div>

      {confirmDelete && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 flex items-center justify-between">
          <p className="text-sm text-red-400">Delete this customer? This cannot be undone.</p>
          <div className="flex gap-2">
            <button onClick={() => setConfirmDelete(false)} className="px-3 py-1.5 text-sm text-muted hover:bg-gray-50 rounded-lg transition-colors">Cancel</button>
            <button onClick={handleDelete} disabled={deleting} className="px-3 py-1.5 text-sm text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors disabled:opacity-50">
              {deleting ? "Deleting…" : "Confirm Delete"}
            </button>
          </div>
        </div>
      )}

      <div className="bg-card rounded-xl border border-border p-6">
        {editing ? (
          <form onSubmit={handleSave} className="space-y-4">
            <h3 className="text-sm font-semibold text-foreground mb-4">Edit Customer</h3>
            <div>
              <label className="block text-xs font-medium text-muted mb-1">Name *</label>
              <input value={name} onChange={(e) => setName(e.target.value)} required className="w-full rounded-lg border border-border bg-card text-foreground px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent-blue" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-muted mb-1">Phone</label>
                <input value={phone} onChange={(e) => setPhone(e.target.value)} className="w-full rounded-lg border border-border bg-card text-foreground px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent-blue" />
              </div>
              <div>
                <label className="block text-xs font-medium text-muted mb-1">Email</label>
                <input value={email} onChange={(e) => setEmail(e.target.value)} type="email" className="w-full rounded-lg border border-border bg-card text-foreground px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent-blue" />
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-muted mb-1">Address</label>
              <input value={address} onChange={(e) => setAddress(e.target.value)} className="w-full rounded-lg border border-border bg-card text-foreground px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent-blue" />
            </div>
            <div>
              <label className="block text-xs font-medium text-muted mb-1">Notes</label>
              <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} className="w-full rounded-lg border border-border bg-card text-foreground px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent-blue resize-none" />
            </div>
            <div className="flex items-center gap-2.5">
              <input
                type="checkbox"
                id="isPropertyManagement"
                checked={isPropertyManagement}
                onChange={(e) => setIsPropertyManagement(e.target.checked)}
                className="w-4 h-4 rounded border-border accent-purple-500"
              />
              <label htmlFor="isPropertyManagement" className="text-sm text-muted cursor-pointer select-none">
                Property management company
              </label>
            </div>
            <div className="flex gap-3 pt-2">
              <button type="submit" disabled={saving} className="px-4 py-2 bg-accent-blue hover:bg-accent-blue/90 disabled:opacity-50 text-white text-sm font-medium rounded-lg transition-colors">
                {saving ? "Saving…" : "Save Changes"}
              </button>
              <button type="button" onClick={() => setEditing(false)} className="px-4 py-2 text-sm text-muted hover:bg-gray-100 rounded-lg transition-colors">Cancel</button>
            </div>
          </form>
        ) : (
          <div className="grid grid-cols-2 gap-x-8 gap-y-4 text-sm">
            <div>
              <p className="text-xs font-medium text-muted mb-0.5">Phone</p>
              <p className="text-foreground">{customer.phone || <span className="text-muted">—</span>}</p>
            </div>
            <div>
              <p className="text-xs font-medium text-muted mb-0.5">Email</p>
              <p className="text-foreground">{customer.email || <span className="text-muted">—</span>}</p>
            </div>
            <div>
              <p className="text-xs font-medium text-muted mb-0.5">Address</p>
              <p className="text-foreground">{customer.address || <span className="text-muted">—</span>}</p>
            </div>
            <div>
              <p className="text-xs font-medium text-muted mb-0.5">Customer since</p>
              <p className="text-foreground">{format(new Date(customer.createdAt), "MMMM d, yyyy")}</p>
            </div>
            {customer.notes && (
              <div className="col-span-2">
                <p className="text-xs font-medium text-muted mb-0.5">Notes</p>
                <p className="text-foreground whitespace-pre-wrap">{customer.notes}</p>
              </div>
            )}
          </div>
        )}
      </div>

      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-foreground">Work Orders ({customer.workOrders.length})</h3>
          <Link href={`/work-orders/new`} className="text-xs text-accent-blue hover:text-accent-blue/80 font-medium transition-colors">+ New WO</Link>
        </div>
        <div className="bg-card rounded-xl border border-border overflow-hidden">
          {customer.workOrders.length === 0 ? (
            <p className="text-sm text-muted py-8 text-center">No work orders for this customer.</p>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-background border-b border-border">
                <tr>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-muted uppercase tracking-wide">Title</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-muted uppercase tracking-wide">Status</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-muted uppercase tracking-wide">Assigned To</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-muted uppercase tracking-wide">Due</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {customer.workOrders.map((wo) => (
                  <tr key={wo.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3">
                      <Link href={`/work-orders/${wo.id}`} className="font-medium text-foreground hover:text-accent-blue transition-colors">{wo.title}</Link>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_STYLES[wo.status] ?? "bg-gray-100 text-slate-400"}`}>{wo.status}</span>
                    </td>
                    <td className="px-4 py-3 text-muted">{wo.assignedTo?.displayName ?? <span className="text-muted">Unassigned</span>}</td>
                    <td className="px-4 py-3 text-muted text-xs">
                      {wo.dueDate ? format(new Date(wo.dueDate), "MMM d, yyyy") : <span className="text-muted">—</span>}
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
