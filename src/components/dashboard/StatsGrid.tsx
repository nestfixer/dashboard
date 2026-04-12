import React from "react"
import { StatCard } from "@/components/shared/StatCard"

interface StatsGridProps {
  totalWOs: number
  pendingWOs: number
  acceptedWOs: number
  completedWOs: number
  myWOs: number
}

export function StatsGrid({
  totalWOs,
  pendingWOs,
  acceptedWOs,
  completedWOs,
  myWOs,
}: StatsGridProps) {
  const stats = [
    { label: "Total WOs", value: totalWOs, color: "bg-indigo-50 text-indigo-700 border-indigo-200" },
    { label: "Pending", value: pendingWOs, color: "bg-yellow-50 text-yellow-700 border-yellow-200" },
    { label: "In Progress", value: acceptedWOs, color: "bg-blue-50 text-blue-700 border-blue-200" },
    { label: "Completed", value: completedWOs, color: "bg-green-50 text-green-700 border-green-200" },
    { label: "My Open WOs", value: myWOs, color: "bg-purple-50 text-purple-700 border-purple-200" },
  ]

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
      {stats.map((s) => (
        <StatCard key={s.label} {...s} />
      ))}
    </div>
  )
}
