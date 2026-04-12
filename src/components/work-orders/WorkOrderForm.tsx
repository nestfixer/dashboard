"use client"

import { useState, useRef } from "react"
import { useRouter } from "next/navigation"

interface Customer { id: number; name: string; phone?: string | null; address?: string | null; email?: string | null }
interface User { id: number; displayName: string }

interface Props {
  customers: Customer[]
  users: User[]
  currentUserId: number
  defaultValues?: {
    id?: number
    title?: string
    description?: string
    priority?: string
    dueDate?: string | null
    remarks?: string | null
    customerId?: number | null
  }
}

export function WorkOrderForm({ customers, users, currentUserId, defaultValues }: Props) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [customerSearch, setCustomerSearch] = useState("")
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(
    defaultValues?.customerId ? customers.find((c) => c.id === defaultValues.customerId) ?? null : null
  )

  // Controlled form fields so extraction can populate them
  const [title, setTitle] = useState(defaultValues?.title ?? "")
  const [description, setDescription] = useState(defaultValues?.description ?? "")
  const [priority, setPriority] = useState(defaultValues?.priority ?? "Medium")
  const [remarks, setRemarks] = useState(defaultValues?.remarks ?? "")

  // New customer inline creation
  const [newCustomerMode, setNewCustomerMode] = useState(false)
  const [newCustomerName, setNewCustomerName] = useState("")
  const [newCustomerPhone, setNewCustomerPhone] = useState("")
  const [newCustomerAddress, setNewCustomerAddress] = useState("")

  // Image extraction state
  const [extracting, setExtracting] = useState(false)
  const [extractError, setExtractError] = useState("")
  const [extractedFrom, setExtractedFrom] = useState<string | null>(null)
  const [dragOver, setDragOver] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const filteredCustomers = customers.filter((c) =>
    c.name.toLowerCase().includes(customerSearch.toLowerCase())
  )

  async function extractFromImage(file: File) {
    setExtracting(true)
    setExtractError("")
    setExtractedFrom(null)
    try {
      const fd = new FormData()
      fd.append("image", file)
      const res = await fetch("/api/work-orders/extract-from-image", { method: "POST", body: fd })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? "Extraction failed")
      if (data.title) setTitle(data.title)
      if (data.description) setDescription(data.description)
      if (data.priority) setPriority(data.priority)
      if (data.remarks) setRemarks(data.remarks)
      if (data.customerName || data.customerPhone || data.customerAddress) {
        setNewCustomerMode(true)
        if (data.customerName) setNewCustomerName(data.customerName)
        if (data.customerPhone) setNewCustomerPhone(data.customerPhone)
        if (data.customerAddress) setNewCustomerAddress(data.customerAddress)
      }
      setExtractedFrom(file.name)
    } catch (err: any) {
      setExtractError(err.message ?? "Could not extract from image")
    } finally {
      setExtracting(false)
    }
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (file) extractFromImage(file)
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault()
    setDragOver(false)
    const file = e.dataTransfer.files?.[0]
    if (file && file.type.startsWith("image/")) extractFromImage(file)
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setError("")
    const form = e.currentTarget

    // Create new customer inline if needed
    let customerId = selectedCustomer?.id ?? null
    if (newCustomerMode && newCustomerName.trim()) {
      const res = await fetch("/api/customers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newCustomerName.trim(),
          phone: newCustomerPhone.trim() || undefined,
          address: newCustomerAddress.trim() || undefined,
        }),
      })
      if (res.ok) {
        const cust = await res.json()
        customerId = cust.id
      }
    }

    const data = {
      title,
      description: description || undefined,
      priority,
      dueDate: (form.elements.namedItem("dueDate") as HTMLInputElement).value || null,
      remarks: remarks || null,
      customerId,
    }

    const isEdit = !!defaultValues?.id
    const res = await fetch(
      isEdit ? `/api/work-orders/${defaultValues!.id}` : "/api/work-orders",
      {
        method: isEdit ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      }
    )
    const json = await res.json()
    if (!res.ok) {
      setError(json.error?.formErrors?.[0] ?? "Failed to save work order")
      setLoading(false)
      return
    }
    router.push(`/work-orders/${json.id}`)
    router.refresh()
  }

  return (
    <div className="space-y-4">
      {/* Image extraction zone — only show on new WO */}
      {!defaultValues?.id && (
        <div
          onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`relative flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed p-6 cursor-pointer transition-colors ${
            dragOver
              ? "border-indigo-400 bg-indigo-50"
              : extractedFrom
              ? "border-green-300 bg-green-50"
              : "border-gray-200 bg-gray-50 hover:border-indigo-300 hover:bg-indigo-50/40"
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleFileChange}
          />

          {extracting ? (
            <>
              <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
              <p className="text-sm text-indigo-600 font-medium">Extracting from screenshot…</p>
            </>
          ) : extractedFrom ? (
            <>
              <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <p className="text-sm font-medium text-green-700">Extracted from <span className="font-semibold">{extractedFrom}</span></p>
              <p className="text-xs text-green-600">Review and edit the fields below, then save</p>
            </>
          ) : (
            <>
              <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <p className="text-sm font-medium text-gray-600">Drop a screenshot to auto-fill</p>
              <p className="text-xs text-gray-400">or click to browse — works with Latchel, AppFolio, and similar apps</p>
            </>
          )}
        </div>
      )}

      {extractError && (
        <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">{extractError}</p>
      )}

      <form onSubmit={handleSubmit} className="space-y-5 bg-white rounded-xl border border-gray-200 p-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Title *</label>
          <input
            name="title"
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            placeholder="e.g. Install HVAC Unit"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
            <select
              name="priority"
              value={priority}
              onChange={(e) => setPriority(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option>Low</option>
              <option>Medium</option>
              <option>High</option>
              <option>Urgent</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Due Date</label>
            <input
              name="dueDate"
              type="date"
              defaultValue={defaultValues?.dueDate?.split("T")[0] ?? ""}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="block text-sm font-medium text-gray-700">Customer</label>
            <button
              type="button"
              onClick={() => { setNewCustomerMode(!newCustomerMode); setSelectedCustomer(null); setCustomerSearch("") }}
              className="text-xs text-indigo-600 hover:text-indigo-800 font-medium"
            >
              {newCustomerMode ? "← Search existing" : "+ New customer"}
            </button>
          </div>

          {newCustomerMode ? (
            <div className="space-y-2 p-3 bg-indigo-50 border border-indigo-100 rounded-lg">
              <input
                value={newCustomerName}
                onChange={(e) => setNewCustomerName(e.target.value)}
                placeholder="Full name *"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
              />
              <input
                value={newCustomerPhone}
                onChange={(e) => setNewCustomerPhone(e.target.value)}
                placeholder="Phone number"
                type="tel"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
              />
              <input
                value={newCustomerAddress}
                onChange={(e) => setNewCustomerAddress(e.target.value)}
                placeholder="Address"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
              />
            </div>
          ) : (
            <>
              <div className="relative">
                <input
                  value={selectedCustomer ? selectedCustomer.name : customerSearch}
                  onChange={(e) => { setCustomerSearch(e.target.value); setSelectedCustomer(null) }}
                  placeholder="Search customers…"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
                {!selectedCustomer && customerSearch && filteredCustomers.length > 0 && (
                  <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-10 max-h-40 overflow-y-auto">
                    {filteredCustomers.map((c) => (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() => { setSelectedCustomer(c); setCustomerSearch("") }}
                        className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50 transition-colors"
                      >
                        <div className="font-medium">{c.name}</div>
                        {c.phone && <div className="text-xs text-gray-500">{c.phone}</div>}
                      </button>
                    ))}
                  </div>
                )}
              </div>
              {selectedCustomer && (
                <div className="mt-2 p-3 bg-gray-50 rounded-lg text-sm">
                  <div className="flex items-center justify-between">
                    <span className="font-medium">{selectedCustomer.name}</span>
                    <button type="button" onClick={() => setSelectedCustomer(null)} className="text-xs text-gray-500 hover:text-red-500">Remove</button>
                  </div>
                  {selectedCustomer.phone && <div className="text-gray-600 text-xs mt-0.5">{selectedCustomer.phone}</div>}
                  {selectedCustomer.address && <div className="text-gray-600 text-xs">{selectedCustomer.address}</div>}
                </div>
              )}
            </>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
          <textarea
            name="description"
            rows={4}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
            placeholder="Describe the work to be done…"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Remarks</label>
          <textarea
            name="remarks"
            rows={2}
            value={remarks}
            onChange={(e) => setRemarks(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
            placeholder="Any additional notes…"
          />
        </div>

        {error && <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">{error}</p>}

        <div className="flex gap-3 pt-2">
          <button
            type="button"
            onClick={() => router.back()}
            className="px-4 py-2 text-sm font-medium text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 rounded-lg transition-colors"
          >
            {loading ? "Saving…" : defaultValues?.id ? "Update Work Order" : "Create Work Order"}
          </button>
        </div>
      </form>
    </div>
  )
}
