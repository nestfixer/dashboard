import { TimeEntry } from "@/types"
import { format } from "date-fns"

export function timesheetToCSV(entries: TimeEntry[]): string {
  const headers = ["Date", "Work Order", "Type", "Duration (hrs)", "Notes"]
  const rows = entries.map((e) => {
    const date = format(new Date(e.date), "yyyy-MM-dd")
    const duration = e.durationMins ? (e.durationMins / 60).toFixed(2) : "0"
    return [
      date,
      `WO #${e.workOrderId}`,
      e.entryType,
      duration,
      e.notes ?? "",
    ]
  })
  const csv = [headers, ...rows]
    .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(","))
    .join("\n")
  return csv
}

export function downloadCSV(content: string, filename: string) {
  const blob = new Blob([content], { type: "text/csv;charset=utf-8;" })
  const url = URL.createObjectURL(blob)
  const link = document.createElement("a")
  link.href = url
  link.download = filename
  link.click()
  URL.revokeObjectURL(url)
}
