"use client"

import dynamic from "next/dynamic"

const CalendarView = dynamic(
  () => import("@/components/calendar/CalendarView").then((m) => m.CalendarView),
  {
    ssr: false,
    loading: () => (
      <div className="flex items-center justify-center h-64 bg-card rounded-xl border border-border">
        <p className="text-sm text-muted-foreground animate-pulse">Loading calendar…</p>
      </div>
    ),
  }
)

export function DashboardCalendar() {
  return <CalendarView compact />
}
