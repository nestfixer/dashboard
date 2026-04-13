import { WorkOrderStatus } from "@/types"

const colors: Record<WorkOrderStatus, string> = {
  Pending: "bg-accent-yellow/10 text-accent-yellow border border-accent-yellow/20",
  Accepted: "bg-accent-blue/10 text-accent-blue border border-accent-blue/20",
  Completed: "bg-accent-green/10 text-accent-green border border-accent-green/20",
}

export function StatusBadge({ status }: { status: WorkOrderStatus }) {
  return (
    <span className={`inline-flex items-center text-xs px-2.5 py-1 rounded-full font-medium ${colors[status]}`}>
      {status}
    </span>
  )
}
