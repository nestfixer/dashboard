"use client"

import { useNotifications } from "@/hooks/useNotifications"
import { getDueDateStatus } from "@/lib/due-date"
import Link from "next/link"
import { format } from "date-fns"

export function NotificationModal() {
  const { notifications, shown, dismiss } = useNotifications()

  if (shown || notifications.length === 0) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md mx-4 p-6">
      <div className="absolute right-0 top-full mt-3 w-96 bg-card border border-border rounded-xl shadow-[0_20px_50px_rgba(0,0,0,0.5)] overflow-hidden z-[100] transform transition-all animate-in fade-in slide-in-from-top-2 duration-200">
        <div className="px-5 py-4 border-b border-white/5 bg-white/[0.01] flex items-center justify-between">
          <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-accent-blue animate-pulse" />
            Due Date Alerts
            )
          })}
        </div>

        <button
          onClick={dismiss}
          className="mt-4 w-full py-2 px-4 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-lg transition-colors"
        >
          Dismiss
        </button>
      </div>
    </div>
  )
}
