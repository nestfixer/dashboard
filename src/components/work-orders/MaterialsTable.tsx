"use client"

import { useState, useRef } from "react"
import { useReceiptScanner } from "../../hooks/useReceiptScanner"
import { BoxIcon, CameraIcon, XIcon } from "../ui/Icons"

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
  const [materials, setMaterials] = useState(initialMaterials)
  const [adding, setAdding] = useState(false)
  const [newName, setNewName] = useState("")
  const [newQty, setNewQty] = useState("1")
  const [newCost, setNewCost] = useState("0")
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { isScanning, handleScanChange } = useReceiptScanner(workOrderId, setMaterials, fileInputRef)

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

  return (
    <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
      <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-gray-50">
        <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
          <BoxIcon className="w-4 h-4 text-accent-blue" strokeWidth={2} />
          Materials & Expenses
        </h3>
        {!readonly && (
          <div className="flex items-center gap-2">
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleScanChange}
              accept="image/*"
              capture="environment"
              className="hidden"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={isScanning}
              className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider bg-accent-blue/10 text-accent-blue hover:bg-accent-blue/20 disabled:opacity-50 rounded-lg transition-all flex items-center gap-2 border border-accent-blue/20 active:scale-95"
            >
              {isScanning ? (
                <>
                  <div className="w-3 h-3 border-2 border-accent-blue border-t-transparent rounded-full animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <CameraIcon className="w-3.5 h-3.5" />
                  Scan Receipt
                </>
              )}
            </button>
            <button
              onClick={() => setAdding(true)}
              className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider bg-gray-100 text-foreground hover:bg-gray-200 rounded-lg transition-all border border-border active:scale-95"
            >
              + Add Item
            </button>
          </div>
        )}
      </div>
      <div className="p-6">
        {materials.length === 0 && !adding && (
          <div className="text-center py-10">
            <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4 border border-border">
              <BoxIcon className="w-6 h-6 text-muted" strokeWidth={1.5} />
            </div>
            <p className="text-sm text-slate-400">No materials or expenses logged for this order.</p>
          </div>
        )}
        {materials.length > 0 && (
          <table className="w-full text-sm mb-4">
            <thead>
              <tr className="text-[10px] font-bold text-slate-400 uppercase tracking-widest border-b border-border">
                <th className="text-left pb-3 font-bold">Item Description</th>
                <th className="text-right pb-3 font-bold">Qty</th>
                <th className="text-right pb-3 font-bold">Unit Cost</th>
                <th className="text-right pb-3 font-bold">Total</th>
                {!readonly && <th className="pb-3" />}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {materials.map((m) => (
                <tr key={m.id} className="group transition-all hover:bg-gray-50">
                  <td className="py-3.5 font-medium text-foreground">{m.name}</td>
                  <td className="py-3.5 text-right text-slate-500 tabular-nums">{m.quantity}</td>
                  <td className="py-3.5 text-right text-slate-500 tabular-nums">${m.unitCost.toFixed(2)}</td>
                  <td className="py-3.5 text-right font-bold text-foreground tabular-nums">${(m.quantity * m.unitCost).toFixed(2)}</td>
                  {!readonly && (
                    <td className="py-3.5 text-right">
                      <button 
                        onClick={() => deleteMaterial(m.id)} 
                        className="p-1 text-muted hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all active:scale-90"
                        title="Remove item"
                      >
                        <XIcon className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr>
                <td colSpan={3} className="pt-6 text-right">
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Total Materials</span>
                </td>
                <td className="pt-6 text-right">
                  <span className="text-xl font-black text-foreground tabular-nums tracking-tighter shadow-accent-blue/10">
                    ${total.toFixed(2)}
                  </span>
                </td>
                {!readonly && <td className="pt-6" />}
              </tr>
            </tfoot>
          </table>
        )}

        {adding && !readonly && (
          <div className="mt-8 p-5 bg-gray-50 border border-border rounded-xl shadow-inner relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-4">
              <button 
                onClick={() => setAdding(false)}
                className="text-muted hover:text-foreground transition-colors"
                title="Cancel"
              >
                <XIcon className="w-4 h-4" />
              </button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 items-end">
              <div className="sm:col-span-2">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5 block">Item name</label>
                <input
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-card border border-border rounded-lg focus:outline-none focus:ring-1 focus:ring-accent-blue/50 focus:border-accent-blue text-foreground placeholder:text-muted transition-all"
                  placeholder="e.g. 1/2-in PVC Compression Coupler"
                />
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5 block">Quantity</label>
                <input
                  type="number"
                  min="0"
                  step="1"
                  value={newQty}
                  onChange={(e) => setNewQty(e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-card border border-border rounded-lg focus:outline-none focus:ring-1 focus:ring-accent-blue/50 focus:border-accent-blue text-foreground tabular-nums transition-all"
                />
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5 block">Unit cost</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted text-xs">$</span>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={newCost}
                    onChange={(e) => setNewCost(e.target.value)}
                    className="w-full pl-6 pr-3 py-2 text-sm bg-card border border-border rounded-lg focus:outline-none focus:ring-1 focus:ring-accent-blue/50 focus:border-accent-blue text-foreground tabular-nums transition-all"
                  />
                </div>
              </div>
            </div>
            <div className="flex justify-end mt-5">
              <button
                onClick={addMaterial}
                disabled={!newName}
                className="px-6 py-2.5 text-xs font-bold uppercase tracking-widest text-white bg-[#1a2b6b] hover:bg-[#152359] disabled:opacity-30 rounded-lg transition-all active:scale-95"
              >
                Save Material Item
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
