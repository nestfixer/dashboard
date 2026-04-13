import React from "react"
import Link from "next/link"
import { StatusBadge } from "@/components/shared/StatusBadge"
import { DueDateBadge } from "@/components/shared/DueDateBadge"
import { UserAvatar } from "@/components/shared/UserAvatar"

import { WorkOrder } from "@/types"

interface RecentWorkOrdersProps {
  workOrders: WorkOrder[]
}

export function RecentWorkOrders({ workOrders }: RecentWorkOrdersProps) {
  return (
    <div className="bg-card rounded-xl border border-border overflow-hidden">
      <div className="flex items-center justify-between px-5 py-4 border-b border-border bg-white/[0.02]">
        <h3 className="text-sm font-semibold text-foreground">Recent Work Orders</h3>
        <Link href="/work-orders" className="text-xs text-accent-blue hover:text-accent-blue/80 font-medium transition-colors">
          View all
        </Link>
      </div>
      <div className="divide-y divide-white/5">
        {workOrders.length === 0 && (
          <p className="text-sm text-gray-400 px-5 py-6 text-center">No work orders yet.</p>
        )}
        {workOrders.map((wo) => (
          <Link
            key={wo.id}
            href={`/work-orders/${wo.id}`}
            className="flex items-center gap-4 px-5 py-3 hover:bg-white/[0.02] transition-colors group"
          >
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium text-foreground truncate group-hover:text-accent-blue transition-colors">{wo.title}</div>
              <div className="text-xs text-gray-400">{wo.customer?.name ?? "No customer"}</div>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <DueDateBadge dueDate={wo.dueDate} />
              <StatusBadge status={wo.status} />
              {wo.assignedTo && <UserAvatar user={wo.assignedTo} size="sm" />}
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}
