import React from "react"
import Link from "next/link"
import { format } from "date-fns"
import { StatusBadge } from "@/components/shared/StatusBadge"
import { DueDateBadge } from "@/components/shared/DueDateBadge"
import { UserAvatar } from "@/components/shared/UserAvatar"

import { WorkOrder } from "@/types"

interface TodayScheduleProps {
  jobs: WorkOrder[]
}

export function TodaySchedule({ jobs }: TodayScheduleProps) {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-gray-900">
          Today — {format(new Date(), "MMM d")}
        </h3>
        <span className="text-xs text-gray-400">
          {jobs.length} job{jobs.length !== 1 ? "s" : ""}
        </span>
      </div>

      {jobs.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 py-10 text-center">
          <p className="text-sm text-gray-400">Nothing scheduled today</p>
        </div>
      ) : (
        <div className="space-y-2">
          {jobs.map((wo) => {
            const completedSubs = wo.subTasks?.filter((s: any) => s.completed).length ?? 0
            const totalSubs = wo.subTasks?.length ?? 0
            
            return (
              <Link
                key={wo.id}
                href={`/work-orders/${wo.id}`}
                className="block bg-white rounded-xl border border-gray-200 p-3.5 hover:border-indigo-300 hover:shadow-sm transition-all"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{wo.title}</p>
                    {wo.customer && (
                      <p className="text-xs text-gray-500 truncate mt-0.5">{wo.customer.name}</p>
                    )}
                  </div>
                  {wo.assignedTo && <UserAvatar user={wo.assignedTo} size="sm" />}
                </div>

                <div className="flex items-center gap-2 mt-2 flex-wrap">
                  <StatusBadge status={wo.status} />
                  <DueDateBadge dueDate={wo.dueDate} />

                  {totalSubs > 0 && (
                    <span className="text-xs text-gray-500 flex items-center gap-1">
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                      </svg>
                      {completedSubs}/{totalSubs}
                    </span>
                  )}
                </div>

                {totalSubs > 0 && (
                  <div className="mt-2 h-1 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-indigo-400 rounded-full transition-all"
                      style={{ width: `${Math.round((completedSubs / totalSubs) * 100)}%` }}
                    />
                  </div>
                )}
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
