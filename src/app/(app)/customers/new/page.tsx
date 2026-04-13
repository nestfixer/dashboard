"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"

export default function NewCustomerPage() {
  const router = useRouter()
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setSaving(true)
    setError("")
    const form = e.currentTarget
    const get = (name: string) => (form.elements.namedItem(name) as HTMLInputElement).value.trim() || null

    try {
      const res = await fetch("/api/customers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: (form.elements.namedItem("name") as HTMLInputElement).value.trim(),
          phone: get("phone"),
          email: get("email"),
          address: get("address"),
          notes: get("notes"),
        }),
      })
      if (!res.ok) { setError("Failed to create customer"); return }
      const customer = await res.json()
      router.push(`/customers/${customer.id}`)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="max-w-lg">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/customers" className="text-sm text-muted hover:text-white transition-colors">
          ← Customers
        </Link>
        <h2 className="text-xl font-semibold text-white">New Customer</h2>
      </div>

      <div className="bg-card rounded-xl border border-border p-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-muted mb-1">Name *</label>
            <input
              name="name"
              required
              className="w-full rounded-lg border border-border bg-card text-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent-blue placeholder-gray-600"
              placeholder="Customer name"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-muted mb-1">Phone</label>
              <input
                name="phone"
                type="tel"
                className="w-full rounded-lg border border-border bg-card text-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent-blue"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-muted mb-1">Email</label>
              <input
                name="email"
                type="email"
                className="w-full rounded-lg border border-border bg-card text-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent-blue"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-muted mb-1">Address</label>
            <input
              name="address"
              className="w-full rounded-lg border border-border bg-card text-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent-blue"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-muted mb-1">Notes</label>
            <textarea
              name="notes"
              rows={3}
              className="w-full rounded-lg border border-border bg-card text-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent-blue resize-none"
            />
          </div>
          {error && <p className="text-sm text-red-400">{error}</p>}
          <div className="flex gap-3 pt-2">
            <button
              type="submit"
              disabled={saving}
              className="px-4 py-2 bg-accent-blue hover:bg-accent-blue/90 disabled:opacity-50 text-white text-sm font-medium rounded-lg transition-colors"
            >
              {saving ? "Saving…" : "Create Customer"}
            </button>
            <Link
              href="/customers"
              className="px-4 py-2 text-sm text-muted hover:bg-white/10 rounded-lg transition-colors"
            >
              Cancel
            </Link>
          </div>
        </form>
      </div>
    </div>
  )
}
