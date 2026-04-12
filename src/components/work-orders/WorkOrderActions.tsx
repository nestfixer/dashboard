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
      <div className="flex items-center gap-2">
        {status === "Pending" && (
          <button
            onClick={() => post("accept")}
            disabled={!!loading}
            className="px-3 py-1.5 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 rounded-lg transition-colors"
          >
            {loading === "accept" ? "…" : "Accept"}
          </button>
        )}
        {status === "Accepted" && assignedToId === currentUserId && (
          <button
            onClick={() => post("complete")}
            disabled={!!loading}
            className="px-3 py-1.5 text-sm font-medium text-white bg-green-600 hover:bg-green-700 disabled:bg-green-400 rounded-lg transition-colors"
          >
            {loading === "complete" ? "…" : "Complete"}
          </button>
        )}
        {status !== "Completed" && otherUsers.length > 0 && (
          <button
            onClick={() => setShowReassign(!showReassign)}
            className="px-3 py-1.5 text-sm font-medium text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Reassign
          </button>
        )}
        <button
          onClick={() => setConfirmDelete(true)}
          className="px-3 py-1.5 text-sm font-medium text-red-600 border border-red-200 rounded-lg hover:bg-red-50 transition-colors"
        >
          Delete
        </button>
      </div>

      {showReassign && (
        <div className="flex items-center gap-2 mt-2">
          <select
            className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
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
            className="px-3 py-1.5 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 rounded-lg"
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
