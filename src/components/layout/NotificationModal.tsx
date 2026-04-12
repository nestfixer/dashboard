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
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">
            Due Date Alerts
          </h2>
          <button onClick={dismiss} className="text-gray-400 hover:text-gray-600">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <p className="text-sm text-gray-500 mb-4">
          You have {notifications.length} work order{notifications.length !== 1 ? "s" : ""} due soon or overdue:
        </p>

        <div className="space-y-2 max-h-60 overflow-y-auto">
          {notifications.map((wo) => {
            const status = getDueDateStatus(wo.dueDate)
            return (
              <Link
                key={wo.id}
                href={`/work-orders/${wo.id}`}
                onClick={dismiss}
                className="flex items-center justify-between p-3 rounded-lg border border-gray-100 hover:bg-gray-50 transition-colors"
              >
                <div>
                  <p className="text-sm font-medium text-gray-900">{wo.title}</p>
                  <p className="text-xs text-gray-500">
                    {wo.dueDate ? format(new Date(wo.dueDate), "MMM d, yyyy") : "No due date"}
                  </p>
                </div>
                <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                  status === "overdue" ? "bg-red-100 text-red-700" :
                  status === "today" ? "bg-orange-100 text-orange-700" :
                  "bg-yellow-100 text-yellow-700"
                }`}>
                  {status === "overdue" ? "Overdue" : status === "today" ? "Due today" : "Due soon"}
                </span>
              </Link>
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
