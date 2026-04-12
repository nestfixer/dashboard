"use client"

import dynamic from "next/dynamic"

const CalendarView = dynamic(
  () => import("@/components/calendar/CalendarView").then((m) => m.CalendarView),
  {
    ssr: false,
    loading: () => (
      <div className="flex items-center justify-center h-64 bg-white rounded-xl border border-gray-200">
        <p className="text-sm text-gray-400">Loading calendar…</p>
      </div>
    ),
  }
)

export function DashboardCalendar() {
  return <CalendarView compact />
}
