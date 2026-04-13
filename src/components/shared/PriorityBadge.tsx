import { WorkOrderPriority } from "@/types"

const colors: Record<WorkOrderPriority, string> = {
  Low: "bg-white/5 text-muted-foreground border border-white/10",
  Medium: "bg-accent-blue/10 text-accent-blue border border-accent-blue/20",
  High: "bg-accent-yellow/10 text-accent-yellow border border-accent-yellow/20",
  Urgent: "bg-accent-red/10 text-accent-red border border-accent-red/20",
}

export function PriorityBadge({ priority }: { priority: WorkOrderPriority }) {
  return (
    <span className={`inline-flex items-center text-xs px-2.5 py-1 rounded-full font-medium ${colors[priority]}`}>
      {priority}
    </span>
  )
}
