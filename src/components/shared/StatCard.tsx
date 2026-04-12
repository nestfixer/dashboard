import React from "react"

interface StatCardProps {
  label: string
  value: number | string
  color: string
}

export function StatCard({ label, value, color }: StatCardProps) {
  return (
    <div className={`rounded-xl border p-4 transition-all hover:shadow-sm ${color}`}>
      <div className="text-2xl font-bold">{value}</div>
      <div className="text-xs font-medium mt-1 opacity-80">{label}</div>
    </div>
  )
}
