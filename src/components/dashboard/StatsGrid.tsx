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
    { label: "Total WOs", value: totalWOs, color: "bg-card border-border text-white accent-blue" },
    { label: "Pending", value: pendingWOs, color: "bg-card border-border text-white accent-yellow" },
    { label: "In Progress", value: acceptedWOs, color: "bg-card border-border text-white accent-blue" },
    { label: "Completed", value: completedWOs, color: "bg-card border-border text-white accent-green" },
    { label: "My Open WOs", value: myWOs, color: "bg-card border-border text-white accent-red" },
  ]

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
      {stats.map((s) => (
        <StatCard key={s.label} {...s} />
      ))}
    </div>
  )
}
