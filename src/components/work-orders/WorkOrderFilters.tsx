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
    <div className="flex flex-wrap items-center gap-3 mb-4">
      <input
        type="search"
        placeholder="Search work orders…"
        value={searchValue}
        onChange={(e) => setSearchValue(e.target.value)}
        className="px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 w-56"
      />

      {/* Status — segmented pill control */}
      <div className="flex gap-1 bg-gray-100 rounded-lg p-1">
        {statuses.map(({ value, label }) => (
          <button
            key={value}
            onClick={() => update("status", value)}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
              currentStatus === value
                ? "bg-white text-gray-900 shadow-sm"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* User filter — styled select */}
      <div className="relative">
        <select
          defaultValue={params.get("assignedTo") ?? ""}
          onChange={(e) => update("assignedTo", e.target.value)}
          className="appearance-none pl-3 pr-8 py-2 text-sm bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-gray-700 cursor-pointer"
        >
          <option value="">All Users</option>
          {users.map((u) => (
            <option key={u.id} value={u.id}>{u.displayName}</option>
          ))}
        </select>
        <div className="pointer-events-none absolute inset-y-0 right-2 flex items-center">
          <svg className="w-3.5 h-3.5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </div>

      {/* Sort — styled select */}
      <div className="relative">
        <select
          defaultValue={`${params.get("sort") ?? "createdAt"}:${params.get("order") ?? "desc"}`}
          onChange={(e) => {
            const [s, o] = e.target.value.split(":")
            const sp = new URLSearchParams(params.toString())
            sp.set("sort", s)
            sp.set("order", o)
            router.push(`/work-orders?${sp.toString()}`)
          }}
          className="appearance-none pl-3 pr-8 py-2 text-sm bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-gray-700 cursor-pointer"
        >
          <option value="createdAt:desc">Newest First</option>
          <option value="createdAt:asc">Oldest First</option>
          <option value="dueDate:asc">Due Date (Soonest)</option>
          <option value="dueDate:desc">Due Date (Latest)</option>
          <option value="priority:desc">Priority (High First)</option>
        </select>
        <div className="pointer-events-none absolute inset-y-0 right-2 flex items-center">
          <svg className="w-3.5 h-3.5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </div>
    </div>
  )
}
