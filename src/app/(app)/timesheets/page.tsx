"use client"

import { useState, useEffect, useCallback, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { format, startOfWeek, endOfWeek, startOfMonth, endOfMonth } from "date-fns"
import { timesheetToCSV, downloadCSV } from "@/lib/csv-export"
import Link from "next/link"
import { UserAvatar } from "@/components/shared/UserAvatar"
import { User } from "@/types"

interface TimeEntry {
  id: number
  userId: number
  date: string
  durationMins: number | null
  description: string | null
  user: User
  workOrder?: { id: number; title: string } | null
  isBilled: boolean
}

function TimesheetsPage() {
  const [entries, setEntries] = useState<TimeEntry[]>([])
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)

  const searchParams = useSearchParams()
  const router = useRouter()

  const range = searchParams.get("range") ?? "week"
  const userFilter = searchParams.get("userId") ?? ""
  const startDate = searchParams.get("startDate") ?? format(startOfWeek(new Date(), { weekStartsOn: 1 }), "yyyy-MM-dd")
  const endDate = searchParams.get("endDate") ?? format(endOfWeek(new Date(), { weekStartsOn: 1 }), "yyyy-MM-dd")

  function updateParams(updates: Record<string, string>) {
    const sp = new URLSearchParams(searchParams.toString())
    Object.entries(updates).forEach(([k, v]) => {
      if (v) sp.set(k, v); else sp.delete(k)
    })
    router.push(`/timesheets?${sp.toString()}`)
  }

  useEffect(() => {
    fetch("/api/users").then((r) => r.json()).then(setUsers).catch(() => {})
  }, [])

  const fetchEntries = useCallback(async () => {
    setLoading(true)
    const params = new URLSearchParams()
    if (userFilter) params.set("userId", userFilter)
    if (startDate) params.set("startDate", startDate)
    if (endDate) params.set("endDate", endDate)
    const res = await fetch(`/api/time-entries?${params}`)
    const data = await res.json()
    setEntries(Array.isArray(data) ? data : [])
    setLoading(false)
  }, [userFilter, startDate, endDate]) // Removed searchParams to fix lint warning

  useEffect(() => { fetchEntries() }, [fetchEntries])

  const byDate = entries.reduce<Record<string, TimeEntry[]>>((acc, e) => {
    const day = format(new Date(e.date), "yyyy-MM-dd")
    ;(acc[day] ??= []).push(e)
    return acc
  }, {})
  const sortedDays = Object.keys(byDate).sort()

  const grandTotal = entries.reduce((s, e) => s + (e.durationMins ?? 0), 0)

  function handleExport() {
    const csv = timesheetToCSV(entries, new Date(startDate))
    downloadCSV(csv, `timesheet-${startDate}-to-${endDate}.csv`)
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-gray-900">Timesheets</h2>
        <button
          onClick={handleExport}
          disabled={entries.length === 0}
          className="flex items-center gap-2 px-3 py-1.5 text-sm text-indigo-600 border border-indigo-200 hover:bg-indigo-50 rounded-lg transition-colors disabled:opacity-50"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
          </svg>
          Export CSV
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-5">
        <div className="flex gap-1 bg-gray-100 rounded-lg p-1">
          {[["week", "This Week"], ["month", "This Month"], ["custom", "Custom"]].map(([val, label]) => (
            <button
              key={val}
              onClick={() => {
                if (val === "week") {
                  updateParams({ range: "week", startDate: format(startOfWeek(new Date(), { weekStartsOn: 1 }), "yyyy-MM-dd"), endDate: format(endOfWeek(new Date(), { weekStartsOn: 1 }), "yyyy-MM-dd") })
                } else if (val === "month") {
                  updateParams({ range: "month", startDate: format(startOfMonth(new Date()), "yyyy-MM-dd"), endDate: format(endOfMonth(new Date()), "yyyy-MM-dd") })
                } else {
                  updateParams({ range: "custom" })
                }
              }}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                range === val ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
        {range === "custom" && (
          <div className="flex items-center gap-2">
            <input type="date" value={startDate} onChange={(e) => updateParams({ range: "custom", startDate: e.target.value, endDate })}
              className="rounded-lg border border-gray-300 px-2 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500" />
            <span className="text-slate-400 text-xs">to</span>
            <input type="date" value={endDate} onChange={(e) => updateParams({ range: "custom", startDate, endDate: e.target.value })}
              className="rounded-lg border border-gray-300 px-2 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500" />
          </div>
        )}
        <select
          value={userFilter}
          onChange={(e) => updateParams({ userId: e.target.value })}
          className="rounded-lg border border-gray-300 px-3 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
        >
          <option value="">All Users</option>
          {users.map((u) => (
            <option key={u.id} value={u.id}>{u.displayName}</option>
          ))}
        </select>
      </div>

      {/* Per-user totals */}
      <div className="grid grid-cols-2 gap-4 mb-5">
        {users.map((u) => {
          const mins = entries.filter((e) => e.userId === u.id).reduce((s, e) => s + (e.durationMins ?? 0), 0)
          return (
            <div key={u.id} className="bg-white rounded-xl border border-gray-200 p-4 flex items-center gap-3">
              <UserAvatar user={u} size="md" />
              <div>
                <p className="text-xs text-gray-500">{u.displayName}</p>
                <p className="text-xl font-bold text-gray-900">{(mins / 60).toFixed(1)}<span className="text-sm font-normal text-gray-500 ml-1">hrs</span></p>
              </div>
            </div>
          )
        })}
        <div className="bg-indigo-50 rounded-xl border border-indigo-100 p-4 flex items-center gap-3 col-span-2">
          <div className="w-9 h-9 rounded-full bg-indigo-600 flex items-center justify-center flex-shrink-0">
            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div>
            <p className="text-xs text-indigo-600 font-medium">Combined Total</p>
            <p className="text-xl font-bold text-indigo-900">{(grandTotal / 60).toFixed(1)}<span className="text-sm font-normal text-indigo-500 ml-1">hrs</span></p>
          </div>
        </div>
      </div>

      {/* Entries by day */}
      {loading ? (
        <div className="text-center py-16 text-sm text-slate-400">Loading…</div>
      ) : sortedDays.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 py-16 text-center">
          <p className="text-sm text-slate-400">No time entries for this period.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {sortedDays.map((day) => {
            const dayEntries = byDate[day]
            const dayMins = dayEntries.reduce((s, e) => s + (e.durationMins ?? 0), 0)
            return (
              <div key={day} className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                <div className="flex items-center justify-between px-4 py-3 bg-gray-50 border-b border-gray-200">
                  <span className="text-sm font-semibold text-gray-900">
                    {format(new Date(day + "T12:00:00"), "EEEE, MMMM d")}
                  </span>
                  <span className="text-xs font-medium text-gray-500 bg-white border border-gray-200 px-2 py-0.5 rounded-full">
                    {(dayMins / 60).toFixed(1)}h
                  </span>
                </div>
                <table className="w-full text-sm">
                  <tbody className="divide-y divide-gray-50">
                    {dayEntries.map((e) => (
                      <tr key={e.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-4 py-3 w-36">
                          <div className="flex items-center gap-2">
                            <UserAvatar user={e.user} size="sm" />
                            <span className="text-xs text-gray-600">{e.user.displayName}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <Link href={`/work-orders/${e.workOrder.id}`} className="font-medium text-gray-900 hover:text-indigo-600 transition-colors">
                            {e.workOrder.title}
                          </Link>
                        </td>
                        <td className="px-4 py-3 w-24">
                          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                            e.entryType === "timer" ? "bg-blue-50 text-blue-700" : "bg-gray-100 text-gray-600"
                          }`}>
                            {e.entryType}
                          </span>
                        </td>
                        <td className="px-4 py-3 w-20 font-semibold text-gray-900">
                          {e.durationMins ? `${(e.durationMins / 60).toFixed(1)}h` : <span className="text-slate-400 font-normal">—</span>}
                        </td>
                        <td className="px-4 py-3 text-gray-500 text-xs max-w-xs truncate">
                          {e.notes ?? ""}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

export default function TimesheetsPageWrapper() {
  return (
    <Suspense fallback={<div className="p-6 text-sm text-gray-400">Loading...</div>}>
      <TimesheetsPage />
    </Suspense>
  )
}
