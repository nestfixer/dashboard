import React from "react"
import Link from "next/link"
import { StatusBadge } from "@/components/shared/StatusBadge"
import { DueDateBadge } from "@/components/shared/DueDateBadge"
import { UserAvatar } from "@/components/shared/UserAvatar"

import { User, WorkOrder } from "@/types"

interface PartnerWorkProps {
  user: User
  workOrders: Partial<WorkOrder>[]
}

export function PartnerWork({ user, workOrders }: PartnerWorkProps) {
  return (
    <div className="bg-card rounded-xl border border-border overflow-hidden">
      <div className="flex items-center gap-2.5 px-5 py-4 border-b border-border bg-gray-50">
        <UserAvatar user={user} size="sm" />
        <h3 className="text-sm font-semibold text-foreground">{user.displayName}&apos;s Work</h3>
      </div>
      {workOrders.length === 0 ? (
        <p className="text-sm text-slate-400 px-5 py-4">No work orders due in the next 3 days.</p>
      ) : (
        <div className="divide-y divide-gray-100">
          {workOrders.map((wo) => (
            <Link
              key={wo.id}
              href={`/work-orders/${wo.id}`}
              className="flex items-center justify-between px-5 py-3 hover:bg-gray-50 transition-colors group"
            >
              <span className="text-sm text-foreground group-hover:text-accent-blue transition-colors truncate">{wo.title}</span>
              <div className="flex items-center gap-2 flex-shrink-0 ml-4">
                <DueDateBadge dueDate={wo.dueDate} />
                <StatusBadge status={wo.status} />
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
