import { WorkOrderPriority } from "@/types"

const colors: Record<WorkOrderPriority, string> = {
  Low: "bg-white/8 text-gray-300 border border-white/15",
  Medium: "bg-accent-blue/15 text-accent-blue border border-accent-blue/25",
  High: "bg-accent-yellow/15 text-accent-yellow border border-accent-yellow/25",
  Urgent: "bg-accent-red/15 text-accent-red border border-accent-red/25",
}

export function PriorityBadge({ priority }: { priority: WorkOrderPriority }) {
  return (
    <span className={`inline-flex items-center text-xs px-2.5 py-1 rounded-full font-medium ${colors[priority]}`}>
      {priority}
    </span>
  )
}
