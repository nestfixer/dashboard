import dynamic from "next/dynamic"

const CalendarView = dynamic(
  () => import("@/components/calendar/CalendarView").then((m) => m.CalendarView),
  {
    ssr: false,
    loading: () => (
      <div className="flex items-center justify-center h-96">
        <div className="text-sm text-gray-400">Loading calendar…</div>
      </div>
    ),
  }
)

export default function CalendarPage() {
  return <CalendarView />
}
