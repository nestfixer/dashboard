"use client"

import { useRouter, useSearchParams } from "next/navigation"
import { useCallback, useState, useEffect } from "react"

interface User { id: number; displayName: string }

export function WorkOrderFilters({ users }: { users: User[] }) {
  const router = useRouter()
  const params = useSearchParams()
  const [searchValue, setSearchValue] = useState(params.get("search") ?? "")

  const update = useCallback((key: string, value: string) => {
    const sp = new URLSearchParams(params.toString())
    if (value) sp.set(key, value)
    else sp.delete(key)
    router.push(`/work-orders?${sp.toString()}`)
  }, [params, router])

  useEffect(() => {
    const timer = setTimeout(() => {
      update("search", searchValue)
    }, 300)
    return () => clearTimeout(timer)
  }, [searchValue, update])

  const currentStatus = params.get("status") ?? ""
  const statuses = [
    { value: "", label: "All" },
    { value: "Pending", label: "Pending" },
    { value: "Accepted", label: "Accepted" },
    { value: "Completed", label: "Completed" },
  ]

  return (
    <div className="flex flex-wrap items-center gap-3 mb-6">
      <div className="relative group">
        <input
          type="search"
          placeholder="Search work orders…"
          value={searchValue}
          onChange={(e) => setSearchValue(e.target.value)}
          className="pl-9 pr-3 py-2 text-sm bg-card border border-border rounded-lg focus:outline-none focus:ring-1 focus:ring-accent-blue/50 focus:border-accent-blue w-64 transition-all text-foreground placeholder:text-muted-foreground"
        />
        <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none text-muted-foreground group-focus-within:text-accent-blue transition-colors">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
      </div>

      {/* Status — segmented pill control */}
      <div className="flex gap-1 bg-gray-50 rounded-lg p-1 border border-border/50">
        {statuses.map(({ value, label }) => (
          <button
            key={value}
            onClick={() => update("status", value)}
            className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${
              currentStatus === value
                ? "bg-[#1a2b6b] text-white"
                : "text-slate-400 hover:text-[#1a2b6b] hover:bg-gray-50"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* User filter — styled select */}
      <div className="relative group">
        <select
          defaultValue={params.get("assignedTo") ?? ""}
          onChange={(e) => update("assignedTo", e.target.value)}
          className="appearance-none pl-3 pr-9 py-2 text-sm bg-card border border-border rounded-lg focus:outline-none focus:ring-1 focus:ring-accent-blue/50 focus:border-accent-blue text-foreground cursor-pointer transition-all hover:border-border/80"
        >
          <option value="">All Users</option>
          {users.map((u) => (
            <option key={u.id} value={u.id}>{u.displayName}</option>
          ))}
        </select>
        <div className="pointer-events-none absolute inset-y-0 right-2 flex items-center">
          <svg className="w-3.5 h-3.5 text-muted-foreground group-hover:text-accent-blue transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </div>

      {/* Sort — styled select */}
      <div className="relative group">
        <select
          defaultValue={`${params.get("sort") ?? "createdAt"}:${params.get("order") ?? "desc"}`}
          onChange={(e) => {
            const [s, o] = e.target.value.split(":")
            const sp = new URLSearchParams(params.toString())
            sp.set("sort", s)
            sp.set("order", o)
            router.push(`/work-orders?${sp.toString()}`)
          }}
          className="appearance-none pl-3 pr-9 py-2 text-sm bg-card border border-border rounded-lg focus:outline-none focus:ring-1 focus:ring-accent-blue/50 focus:border-accent-blue text-foreground cursor-pointer transition-all hover:border-border/80"
        >
          <option value="createdAt:desc">Newest First</option>
          <option value="createdAt:asc">Oldest First</option>
          <option value="dueDate:asc">Due Date (Soonest)</option>
          <option value="dueDate:desc">Due Date (Latest)</option>
          <option value="priority:desc">Priority (High First)</option>
        </select>
        <div className="pointer-events-none absolute inset-y-0 right-2 flex items-center">
          <svg className="w-3.5 h-3.5 text-muted-foreground group-hover:text-accent-blue transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </div>
    </div>
  )
}
