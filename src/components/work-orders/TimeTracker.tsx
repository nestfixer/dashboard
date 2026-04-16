"use client"

import { useState } from "react"
import { useTimer } from "@/hooks/useTimer"
import { format } from "date-fns"


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
    <div className="bg-card rounded-xl border border-border overflow-hidden">
      <div className="flex items-center justify-between px-5 py-4 border-b border-border bg-gray-50">
        <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
          <svg className="w-4 h-4 text-accent-blue" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          Time Tracking <span className="text-muted-foreground font-normal ml-1">({(totalMins / 60).toFixed(1)} hrs total)</span>
        </h3>
        <button
          onClick={() => setShowManual(!showManual)}
          className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 bg-gray-100 text-muted-foreground hover:bg-gray-200 hover:text-foreground rounded-lg transition-all border border-border"
        >
          + Manual
        </button>
      </div>
      <div className="p-5 space-y-4">
        {/* Live timer */}
        <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl border border-border">
          <div className="flex-1">
            {isMyTimer ? (
              <div className="flex items-center gap-3">
                <div className="relative flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
                </div>
                <span className="font-mono text-2xl font-bold text-foreground tracking-tight">{displayTime}</span>
                <span className="text-xs text-muted-foreground font-medium uppercase tracking-widest animate-pulse">Recording</span>
              </div>
            ) : (
              <span className="text-sm text-muted-foreground">
                {isRunning ? "Timer running for another WO" : "Start a live timer"}
              </span>
            )}
          </div>
          <button
            onClick={handleTimerToggle}
            disabled={isRunning && !isMyTimer}
            className={`px-6 py-2 text-sm font-bold rounded-lg transition-all shadow-sm ${
              isMyTimer
                ? "bg-red-500/10 text-red-500 border border-red-500/20 hover:bg-red-500 hover:text-white"
                : "bg-accent-blue/10 text-accent-blue border border-accent-blue/20 hover:bg-accent-blue hover:text-white disabled:opacity-30 disabled:hover:bg-accent-blue/10"
            }`}
          >
            {isMyTimer ? "Stop" : "Start"}
          </button>
        </div>

        {/* Manual entry form */}
        {showManual && (
          <form onSubmit={saveManual} className="p-4 bg-accent-blue/5 rounded-xl border border-accent-blue/20 space-y-4 animate-in fade-in slide-in-from-top-2 duration-200">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              <div>
                <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1.5 block">Minutes</label>
                <input
                  type="number"
                  min="1"
                  required
                  value={manualMins}
                  onChange={(e) => setManualMins(e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-card border border-border rounded-lg focus:outline-none focus:ring-1 focus:ring-accent-blue/50 focus:border-accent-blue text-foreground"
                  placeholder="60"
                />
              </div>
              <div>
                <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1.5 block">Date</label>
                <input
                  type="date"
                  value={manualDate}
                  onChange={(e) => setManualDate(e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-card border border-border rounded-lg focus:outline-none focus:ring-1 focus:ring-accent-blue/50 focus:border-accent-blue text-foreground"
                />
              </div>
              <div className="col-span-2">
                <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1.5 block">Notes</label>
                <input
                  value={manualNotes}
                  onChange={(e) => setManualNotes(e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-card border border-border rounded-lg focus:outline-none focus:ring-1 focus:ring-accent-blue/50 focus:border-accent-blue text-foreground"
                  placeholder="Optional notes…"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <button type="button" onClick={() => setShowManual(false)} className="px-4 py-2 text-xs font-bold uppercase tracking-wider text-muted-foreground hover:text-foreground transition-all">
                Cancel
              </button>
              <button type="submit" disabled={saving} className="px-6 py-2 text-xs font-bold uppercase tracking-wider text-white bg-[#1a2b6b] hover:bg-[#152359] rounded-lg transition-all">
                {saving ? "Saving…" : "Save Entry"}
              </button>
            </div>
          </form>
        )}

        {/* Entries list */}
        {entries.length > 0 && (
          <div className="space-y-1 divide-y divide-gray-100">
            {entries.map((e) => (
              <div key={e.id} className="flex items-center justify-between py-3 px-2 group hover:bg-gray-50 rounded-lg transition-all">
                <div className="flex flex-col">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-foreground text-sm">{e.user.displayName}</span>
                    <span className="text-accent-blue font-bold text-sm">{e.durationMins ? `${(e.durationMins / 60).toFixed(1)}h` : "Running…"}</span>
                  </div>
                  {e.notes && <span className="text-muted-foreground text-xs mt-0.5 line-clamp-1 italic">{e.notes}</span>}
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-xs text-muted-foreground font-medium uppercase tracking-tighter">{format(new Date(e.date), "MMM d")}</span>
                  {e.user.id === currentUserId && (
                    <button 
                      onClick={() => deleteEntry(e.id)} 
                      className="text-muted-foreground hover:text-red-400 p-1 opacity-0 group-hover:opacity-100 transition-all active:scale-95"
                      title="Delete entry"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-4v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
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
