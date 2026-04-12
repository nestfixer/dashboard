import { isPast, isToday, differenceInCalendarDays } from "date-fns"

export type DueDateStatusType = "overdue" | "today" | "soon" | "normal" | null

export function getDueDateStatus(dueDate: string | Date | null | undefined): DueDateStatusType {
  if (!dueDate) return null
  const date = typeof dueDate === "string" ? new Date(dueDate) : dueDate
  if (isToday(date)) return "today"
  if (isPast(date)) return "overdue"
  if (differenceInCalendarDays(date, new Date()) <= 3) return "soon"
  return "normal"
}

export const dueDateClasses: Record<NonNullable<DueDateStatusType>, string> = {
  overdue: "bg-red-100 text-red-800 border border-red-300",
  today: "bg-orange-100 text-orange-800 border border-orange-300",
  soon: "bg-yellow-100 text-yellow-800 border border-yellow-300",
  normal: "bg-gray-100 text-gray-700 border border-gray-200",
}

export const dueDateRowClasses: Record<NonNullable<DueDateStatusType>, string> = {
  overdue: "bg-red-50",
  today: "bg-orange-50",
  soon: "bg-yellow-50",
  normal: "",
}
