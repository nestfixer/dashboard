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
    <div className="bg-card border border-border rounded-xl px-4 py-3 flex items-center divide-x divide-border">
      {stats.map((s) => (
        <div key={s.label} className="flex items-center gap-2.5 px-4 first:pl-0 last:pr-0">
          <span className="text-xl font-bold text-[#1a2b6b] tabular-nums">{s.value}</span>
          <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider leading-tight">{s.label}</span>
        </div>
      ))}
    </div>
  )
}
