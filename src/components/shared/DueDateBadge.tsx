import { getDueDateStatus, dueDateClasses } from "@/lib/due-date"
import { format } from "date-fns"

export function DueDateBadge({ dueDate }: { dueDate: string | Date | null | undefined }) {
  if (!dueDate) return <span className="text-xs text-muted">No due date</span>

  const status = getDueDateStatus(dueDate)
  const label = status === "overdue" ? "Overdue" : status === "today" ? "Today" : format(new Date(dueDate), "MMM d, yyyy")
  const cls = status ? dueDateClasses[status] : "bg-gray-100 text-slate-400 border border-border"

  return (
    <span className={`inline-flex items-center text-xs px-2 py-0.5 rounded-full font-medium ${cls}`}>
      {label}
    </span>
  )
}
