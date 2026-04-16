"use client"

import { useNotifications } from "@/hooks/useNotifications"

import Link from "next/link"
import { format } from "date-fns"

export function NotificationModal() {
  const { notifications, shown, dismiss } = useNotifications()

  if (shown || notifications.length === 0) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-card rounded-xl shadow-xl w-full max-w-md mx-4 p-6 border border-border">
        <h3 className="text-sm font-bold text-foreground flex items-center gap-2 mb-4">
          <div className="w-1.5 h-1.5 rounded-full bg-accent-blue animate-pulse" />
          Due Date Alerts
        </h3>

        <div className="space-y-2 mb-4">
          {notifications.map((n) => {
            return (
              <Link
                key={n.id}
                href={`/work-orders/${n.id}`}
                className="flex items-center justify-between p-3 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors border border-border"
              >
                <span className="text-sm text-foreground truncate">{n.title}</span>
                {n.dueDate && (
                  <span className="text-xs text-muted ml-2 shrink-0">
                    {format(new Date(n.dueDate), "MMM d")}
                  </span>
                )}
              </Link>
            )
          })}
        </div>

        <button
          onClick={dismiss}
          className="mt-2 w-full py-2 px-4 bg-[#1a2b6b] hover:bg-[#152359] text-white text-sm font-medium rounded-lg transition-colors"
        >
          Dismiss
        </button>
      </div>
    </div>
  )
}
