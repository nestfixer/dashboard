"use client"

import { useSession } from "next-auth/react"
import { useEffect, useState } from "react"
import { usePathname } from "next/navigation"
import Link from "next/link"

function getPageTitle(pathname: string): string {
  if (pathname === "/dashboard") return "Dashboard"
  if (pathname === "/work-orders/new") return "New Work Order"
  if (pathname.startsWith("/work-orders/") && pathname.endsWith("/edit")) return "Edit Work Order"
  if (pathname.match(/^\/work-orders\/\d+/)) return "Work Order"
  if (pathname === "/work-orders") return "Work Orders"
  if (pathname === "/calendar") return "Calendar"
  if (pathname === "/customers/new") return "New Customer"
  if (pathname.match(/^\/customers\/\d+/)) return "Customer"
  if (pathname === "/customers") return "Customers"
  if (pathname === "/invoices") return "Invoices"
  if (pathname.match(/^\/invoices\/\d+/)) return "Invoice"
  if (pathname === "/timesheets") return "Timesheets"
  if (pathname === "/settings") return "Settings"
  return "Field Dashboard"
}

interface TopNavProps {
  onMenuClick: () => void
}

export function TopNav({ onMenuClick }: TopNavProps) {
  const { data: session } = useSession()
  const pathname = usePathname()
  const [pendingRequests, setPendingRequests] = useState(0)

  useEffect(() => {
    const fetchRequests = () => {
      fetch("/api/calendar/edit-requests?status=Pending")
        .then((r) => r.json())
        .then((data) => Array.isArray(data) && setPendingRequests(data.length))
        .catch(() => {})
    }
    fetchRequests()
    const interval = setInterval(fetchRequests, 30 * 1000)
    return () => clearInterval(interval)
  }, [])

  return (
    <header className="fixed top-0 left-0 right-0 md:left-56 h-14 bg-white border-b border-gray-200 flex items-center justify-between px-3 sm:px-4 md:px-6 z-20">
      <div className="flex items-center gap-2">
        <button
          onClick={onMenuClick}
          className="md:hidden p-2 -ml-1 rounded-md text-gray-500 hover:text-gray-700 hover:bg-gray-100"
          aria-label="Open menu"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
        <h1 className="text-base font-semibold text-gray-900">{getPageTitle(pathname)}</h1>
      </div>
      <div className="flex items-center gap-4">
        {pendingRequests > 0 && (
          <Link href="/calendar" className="flex items-center gap-1.5 text-sm text-amber-600 hover:text-amber-700">
            <span className="inline-flex items-center justify-center w-5 h-5 bg-amber-100 text-amber-700 rounded-full text-xs font-bold">
              {pendingRequests}
            </span>
            <span className="hidden sm:inline">Edit Requests</span>
          </Link>
        )}
        <div className="flex items-center gap-2">
          <div
            className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold"
            style={{ backgroundColor: session?.user?.color ?? "#6366f1" }}
          >
            {session?.user?.name?.[0]?.toUpperCase() ?? "?"}
          </div>
          <span className="hidden sm:inline text-sm text-gray-700">{session?.user?.name}</span>
        </div>
      </div>
    </header>
  )
}
