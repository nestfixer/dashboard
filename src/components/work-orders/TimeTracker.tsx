"use client"

import { useState } from "react"
import { useTimer } from "@/hooks/useTimer"
import { format } from "date-fns"
import Input from "@/components/ui/Input"
import Button from "@/components/ui/Button"

interface TimeEntry {
  id: number
  entryType: string
  durationMins: number | null
  date: string
  notes: string | null
  user: { id: number; displayName: string }
}

interface Props {
  workOrderId: number
  initialEntries: TimeEntry[]
  currentUserId: number
}

export function TimeTracker({ workOrderId, initialEntries, currentUserId }: Props) {
  const { isRunning, isRunningFor, displayTime, startTimer, stopTimer } = useTimer()
  const [entries, setEntries] = useState(initialEntries)
  const [showManual, setShowManual] = useState(false)
  const [manualMins, setManualMins] = useState("")
  const [manualDate, setManualDate] = useState(new Date().toISOString().split("T")[0])
  const [manualNotes, setManualNotes] = useState("")
  const [saving, setSaving] = useState(false)

  const isMyTimer = isRunningFor === workOrderId

  async function handleTimerToggle() {
    if (isMyTimer) {
      const entry = await stopTimer()
      if (entry) setEntries([entry, ...entries])
    } else {
      await startTimer(workOrderId)
    }
  }

  async function saveManual(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    const res = await fetch(`/api/work-orders/${workOrderId}/time-entries`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        entryType: "manual",
        durationMins: parseInt(manualMins),
        date: manualDate,
        notes: manualNotes || null,
      }),
    })
    if (res.ok) {
      const entry = await res.json()
      setEntries([entry, ...entries])
      setManualMins(""); setManualNotes(""); setShowManual(false)
    }
    setSaving(false)
  }

  async function deleteEntry(id: number) {
    await fetch(`/api/time-entries/${id}`, { method: "DELETE" })
    setEntries(entries.filter((e) => e.id !== id))
  }

  const totalMins = entries.reduce((sum, e) => sum + (e.durationMins ?? 0), 0)

  return (
    <div className="bg-white rounded-xl border border-gray-200">
      <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
        <h3 className="text-sm font-semibold text-gray-900">Time Tracking ({(totalMins / 60).toFixed(1)} hrs total)</h3>
        <button
          onClick={() => setShowManual(!showManual)}
          className="text-xs px-2 py-1 bg-gray-100 text-gray-600 hover:bg-gray-200 rounded-lg transition-colors"
        >
          + Manual
        </button>
      </div>
      <div className="p-5 space-y-4">
        {/* Live timer */}
        <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
          <div className="flex-1">
            {isMyTimer ? (
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                <span className="font-mono text-lg font-semibold text-gray-900">{displayTime}</span>
                <span className="text-xs text-gray-500">recording…</span>
              </div>
            ) : (
              <span className="text-sm text-gray-500">
                {isRunning ? "Timer running for another WO" : "Start a live timer"}
              </span>
            )}
          </div>
          <button
            onClick={handleTimerToggle}
            disabled={isRunning && !isMyTimer}
            className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${
              isMyTimer
                ? "bg-red-600 hover:bg-red-700 text-white"
                : "bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-300 text-white"
            }`}
          >
            {isMyTimer ? "Stop" : "Start"}
          </button>
        </div>

        {/* Manual entry form */}
        {showManual && (
          <form onSubmit={saveManual} className="flex gap-2 items-end p-3 bg-blue-50 rounded-lg">
            <div>
              <label className="text-xs text-gray-500 mb-1 block">Minutes</label>
              <input
                type="number"
                min="1"
                required
                value={manualMins}
                onChange={(e) => setManualMins(e.target.value)}
                className="w-20 px-2 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="60"
              />
            </div>
            <div>
              <label className="text-xs text-gray-500 mb-1 block">Date</label>
              <input
                type="date"
                value={manualDate}
                onChange={(e) => setManualDate(e.target.value)}
                className="px-2 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div className="flex-1">
              <label className="text-xs text-gray-500 mb-1 block">Notes</label>
              <input
                value={manualNotes}
                onChange={(e) => setManualNotes(e.target.value)}
                className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="Optional notes…"
              />
            </div>
            <button type="submit" disabled={saving} className="px-3 py-1.5 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg">
              {saving ? "…" : "Save"}
            </button>
            <button type="button" onClick={() => setShowManual(false)} className="px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-100 rounded-lg">
              Cancel
            </button>
          </form>
        )}

        {/* Entries list */}
        {entries.length > 0 && (
          <div className="space-y-1">
            {entries.map((e) => (
              <div key={e.id} className="flex items-center justify-between py-2 px-3 hover:bg-gray-50 rounded-lg text-sm">
                <div>
                  <span className="font-medium text-gray-900">{e.user.displayName}</span>
                  <span className="text-gray-500 ml-2">{e.durationMins ? `${(e.durationMins / 60).toFixed(1)}h` : "Running…"}</span>
                  {e.notes && <span className="text-gray-400 ml-2 text-xs">— {e.notes}</span>}
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-400">{format(new Date(e.date), "MMM d")}</span>
                  {e.user.id === currentUserId && (
                    <button onClick={() => deleteEntry(e.id)} className="text-gray-300 hover:text-red-500 text-xs">✕</button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
