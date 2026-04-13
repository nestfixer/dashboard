import React from "react"

interface StatCardProps {
  label: string
  value: number | string
  color: string
}

export function StatCard({ label, value, color }: StatCardProps) {
  // Extract accent color if present (e.g. "accent-blue" -> "border-l-accent-blue")
  const accentClass = color.split(" ").find(c => c.startsWith("accent-"))?.replace("accent-", "border-l-") || "border-l-transparent";
  
  return (
    <div className={`rounded-xl border border-border p-4 transition-all hover:translate-y-[-2px] bg-card ${accentClass} border-l-4`}>
      <div className="text-2xl font-bold text-white tabular-nums tracking-tight">{value}</div>
      <div className="text-[10px] font-bold text-muted uppercase tracking-wider mt-1.5">{label}</div>
    </div>
  )
}
