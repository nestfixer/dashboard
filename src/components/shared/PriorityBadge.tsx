import { WorkOrderPriority } from "@/types"

const colors: Record<WorkOrderPriority, string> = {
  Low: "bg-gray-100 text-gray-600 border border-gray-200",
  Medium: "bg-blue-50 text-blue-700 border border-blue-200",
  High: "bg-orange-100 text-orange-700 border border-orange-200",
  Urgent: "bg-red-100 text-red-700 border border-red-200",
}

export function PriorityBadge({ priority }: { priority: WorkOrderPriority }) {
  return (
    <span className={`inline-flex items-center text-xs px-2.5 py-1 rounded-full font-medium ${colors[priority]}`}>
      {priority}
    </span>
  )
}
