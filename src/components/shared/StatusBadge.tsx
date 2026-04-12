import { WorkOrderStatus } from "@/types"

const colors: Record<WorkOrderStatus, string> = {
  Pending: "bg-yellow-100 text-yellow-800 border border-yellow-200",
  Accepted: "bg-blue-100 text-blue-800 border border-blue-200",
  Completed: "bg-green-100 text-green-800 border border-green-200",
}

export function StatusBadge({ status }: { status: WorkOrderStatus }) {
  return (
    <span className={`inline-flex items-center text-xs px-2.5 py-1 rounded-full font-medium ${colors[status]}`}>
      {status}
    </span>
  )
}
