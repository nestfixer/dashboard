"use client"

import { useState, useRef } from "react"
import { useRouter } from "next/navigation"
import Input from "@/components/ui/Input"
import Button from "@/components/ui/Button"

interface Material {
  id: number
  name: string
  quantity: number
  unitCost: number
}

interface Props {
  workOrderId: number
  initialMaterials: Material[]
  readonly?: boolean
}

export function MaterialsTable({ workOrderId, initialMaterials, readonly }: Props) {
  const router = useRouter()
  const [materials, setMaterials] = useState(initialMaterials)
  const [adding, setAdding] = useState(false)
  const [newName, setNewName] = useState("")
  const [newQty, setNewQty] = useState("1")
  const [newCost, setNewCost] = useState("0")
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [isScanning, setIsScanning] = useState(false)

  const total = materials.reduce((sum, m) => sum + m.quantity * m.unitCost, 0)

  async function addMaterial() {
    const res = await fetch(`/api/work-orders/${workOrderId}/materials`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: newName, quantity: parseFloat(newQty), unitCost: parseFloat(newCost) }),
    })
    if (res.ok) {
      const m = await res.json()
      setMaterials([...materials, m])
      setNewName(""); setNewQty("1"); setNewCost("0"); setAdding(false)
    }
  }

  async function deleteMaterial(id: number) {
    await fetch(`/api/work-orders/${workOrderId}/materials/${id}`, { method: "DELETE" })
    setMaterials(materials.filter((m) => m.id !== id))
  }

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    setIsScanning(true)
    try {
      const reader = new FileReader()
      const base64Promise = new Promise<string>((resolve) => {
        reader.onloadend = () => {
          const base64 = reader.result?.toString().split(",")[1] || ""
          resolve(base64)
        }
      })
      reader.readAsDataURL(file)
      const imageBase64 = await base64Promise

      const res = await fetch("/api/vision/process-receipt", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageBase64 }),
      })
      
      if (!res.ok) throw new Error("AI processing failed")
      const items = await res.json()

      const newItems = []
      for (const item of items) {
        const addRes = await fetch(`/api/work-orders/${workOrderId}/materials`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ 
            name: item.name, 
            quantity: item.quantity, 
            unitCost: item.unitCost 
          }),
        })
        if (addRes.ok) {
          const m = await addRes.json()
          newItems.push(m)
        }
      }
      
      setMaterials(prev => [...prev, ...newItems])
      alert(`Successfully added ${newItems.length} items from receipt.`)
    } catch (error) {
      console.error("Scan error:", error)
      alert("Failed to process receipt. Please try again.")
    } finally {
      setIsScanning(false)
      if (fileInputRef.current) fileInputRef.current.value = ""
    }
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200">
      <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
        <h3 className="text-sm font-semibold text-gray-900">Materials</h3>
        {!readonly && (
          <div className="flex items-center gap-2">
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept="image/*"
              capture="environment"
              className="hidden"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={isScanning}
              className="text-xs px-2.5 py-1.5 bg-indigo-50 text-indigo-600 hover:bg-indigo-100 disabled:opacity-50 rounded-lg transition-all flex items-center gap-1.5"
            >
              {isScanning ? (
                <>
                  <div className="w-3 h-3 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
                  Scanning...
                </>
              ) : (
                <>
                  <span>📸</span>
                  Scan Receipt
                </>
              )}
            </button>
            <button
              onClick={() => setAdding(true)}
              className="text-xs px-2.5 py-1.5 bg-gray-50 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            >
              + Add Item
            </button>
          </div>
        )}
      </div>
      <div className="p-5">
        {materials.length === 0 && !adding && (
          <p className="text-sm text-gray-500 text-center py-4">No materials added yet.</p>
        )}
        {materials.length > 0 && (
          <table className="w-full text-sm mb-3">
            <thead>
              <tr className="text-xs text-gray-500 border-b border-gray-100">
                <th className="text-left pb-2">Item</th>
                <th className="text-right pb-2">Qty</th>
                <th className="text-right pb-2">Unit Cost</th>
                <th className="text-right pb-2">Total</th>
                {!readonly && <th className="pb-2" />}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {materials.map((m) => (
                <tr key={m.id}>
                  <td className="py-2 font-medium">{m.name}</td>
                  <td className="py-2 text-right text-gray-600">{m.quantity}</td>
                  <td className="py-2 text-right text-gray-600">${m.unitCost.toFixed(2)}</td>
                  <td className="py-2 text-right font-medium">${(m.quantity * m.unitCost).toFixed(2)}</td>
                  {!readonly && (
                    <td className="py-2 text-right">
                      <button onClick={() => deleteMaterial(m.id)} className="text-gray-400 hover:text-red-500 text-xs ml-2">✕</button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="border-t border-gray-200 font-semibold">
                <td colSpan={3} className="pt-2 text-right text-gray-700">Total</td>
                <td className="pt-2 text-right">${total.toFixed(2)}</td>
                {!readonly && <td />}
              </tr>
            </tfoot>
          </table>
        )}

        {adding && !readonly && (
          <div className="flex gap-2 items-end mt-2">
            <div className="flex-1">
              <label className="text-xs text-gray-500 mb-1 block">Item name</label>
              <input
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="e.g. PVC Pipe"
              />
            </div>
            <div className="w-20">
              <label className="text-xs text-gray-500 mb-1 block">Qty</label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={newQty}
                onChange={(e) => setNewQty(e.target.value)}
                className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div className="w-24">
              <label className="text-xs text-gray-500 mb-1 block">Unit cost</label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={newCost}
                onChange={(e) => setNewCost(e.target.value)}
                className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <button
              onClick={addMaterial}
              disabled={!newName}
              className="px-3 py-1.5 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 rounded-lg"
            >
              Add
            </button>
            <button onClick={() => setAdding(false)} className="px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-100 rounded-lg">
              Cancel
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
