import React from "react"

interface StatsGridProps {
  totalWOs: number
  pendingWOs: number
  acceptedWOs: number
  completedWOs: number
  myWOs: number
}

export function StatsGrid({ totalWOs, pendingWOs, acceptedWOs, completedWOs, myWOs }: StatsGridProps) {
  const stats = [
    { label: "Total WOs", value: totalWOs },
    { label: "Pending", value: pendingWOs },
    { label: "In Progress", value: acceptedWOs },
    { label: "Completed", value: completedWOs },
    { label: "My Open WOs", value: myWOs },
  ]

  return (
    <div className="rounded-xl border border-border bg-card flex divide-x divide-border">
      {stats.map((s) => (
        <div key={s.label} className="flex-1 px-4 py-3 text-center">
          <div className="text-lg font-bold text-[#1a2b6b] tabular-nums">{s.value}</div>
          <div className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mt-0.5">{s.label}</div>
        </div>
      ))}
    </div>
  )
}
