import { WorkOrderStatus } from "@/types"

const colors: Record<WorkOrderStatus, string> = {
  Pending: "bg-accent-yellow/15 text-accent-yellow border border-accent-yellow/25",
  Accepted: "bg-accent-blue/15 text-accent-blue border border-accent-blue/25",
  Completed: "bg-accent-green/15 text-accent-green border border-accent-green/25",
}

export function StatusBadge({ status }: { status: WorkOrderStatus }) {
  return (
    <span className={`inline-flex items-center text-xs px-2.5 py-1 rounded-full font-medium ${colors[status]}`}>
      {status}
    </span>
  )
}
