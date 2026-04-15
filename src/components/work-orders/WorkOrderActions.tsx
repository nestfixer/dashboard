"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { ConfirmDialog } from "@/components/shared/ConfirmDialog"
import Button from "@/components/ui/Button"
import Select from "@/components/ui/Select"

interface Props {
  workOrderId: number
  status: string
  assignedToId: number | null
  currentUserId: number
  users: { id: number; displayName: string }[]
}

export function WorkOrderActions({ workOrderId, status, assignedToId, currentUserId, users }: Props) {
  const router = useRouter()
  const [loading, setLoading] = useState<string | null>(null)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [reassignTo, setReassignTo] = useState<number | null>(null)
  const [showReassign, setShowReassign] = useState(false)

  async function post(path: string, body?: object) {
    setLoading(path)
    await fetch(`/api/work-orders/${workOrderId}/${path}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: body ? JSON.stringify(body) : undefined,
    })
    router.refresh()
    setLoading(null)
  }

  async function deleteWO() {
    setLoading("delete")
    await fetch(`/api/work-orders/${workOrderId}`, { method: "DELETE" })
    router.push("/work-orders")
  }

  const otherUsers = users.filter((u) => u.id !== currentUserId)

  return (
    <>
      <div className="flex flex-wrap gap-2">
        {status === "Pending" && (
          <button
            onClick={() => post("accept")}
            disabled={loading === "accept"}
            className="flex-1 px-4 py-2.5 text-xs font-bold uppercase tracking-wider text-white bg-[#1a2b6b] hover:bg-[#152359] disabled:opacity-50 rounded-xl transition-all active:scale-95"
          >
            {loading === "accept" ? "…" : "Accept"}
          </button>
        )}
        {status === "Accepted" && (
          <button
            onClick={() => post("complete")}
            disabled={loading === "complete"}
            className="flex-1 px-4 py-2.5 text-xs font-bold uppercase tracking-wider text-white bg-accent-green/80 hover:bg-accent-green disabled:opacity-50 rounded-xl transition-all active:scale-95"
          >
            {loading === "complete" ? "…" : "Mark Complete"}
          </button>
        )}
        {status === "Completed" && (
          <button
            onClick={() => post("reopen")}
            disabled={loading === "reopen"}
            className="flex-1 px-4 py-2.5 text-xs font-bold uppercase tracking-wider text-foreground bg-gray-100 hover:bg-gray-200 disabled:opacity-50 rounded-xl transition-all active:scale-95"
          >
            {loading === "reopen" ? "…" : "Reopen"}
          </button>
        )}
        <button
          onClick={() => setShowReassign(!showReassign)}
          className="px-4 py-2.5 text-xs font-bold uppercase tracking-wider text-foreground bg-gray-100 hover:bg-gray-200 rounded-xl transition-all border border-border active:scale-95"
        >
          Reassign
        </button>
        <button
          onClick={() => setConfirmDelete(true)}
          className="px-4 py-2.5 text-xs font-bold uppercase tracking-wider text-red-400 bg-red-500/10 hover:bg-red-500/20 rounded-xl transition-all border border-red-500/20 active:scale-95"
        >
          Delete
        </button>
      </div>

      {showReassign && (
        <div className="flex items-center gap-2 mt-2">
          <select
            className="px-3 py-1.5 text-sm border border-border bg-card text-foreground rounded-lg focus:outline-none focus:ring-2 focus:ring-accent-blue"
            onChange={(e) => setReassignTo(parseInt(e.target.value))}
          >
            <option value="">Select user…</option>
            {users.map((u) => (
              <option key={u.id} value={u.id}>{u.displayName}</option>
            ))}
          </select>
          <button
            onClick={() => { if (reassignTo) post("reassign", { assignedToId: reassignTo }); setShowReassign(false) }}
            disabled={!reassignTo}
            className="px-3 py-1.5 text-sm font-medium text-white bg-accent-blue hover:bg-accent-blue/90 disabled:opacity-50 rounded-lg"
          >
            Confirm
          </button>
        </div>
      )}

      <ConfirmDialog
        open={confirmDelete}
        title="Delete Work Order"
        message="This will permanently delete the work order and all related data. This cannot be undone."
        confirmLabel="Delete"
        destructive
        onConfirm={deleteWO}
        onCancel={() => setConfirmDelete(false)}
      />
    </>
  )
}
