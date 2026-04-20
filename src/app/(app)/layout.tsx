"use client"

import { useState } from "react"
import { Sidebar } from "@/components/layout/Sidebar"
import { TopNav } from "@/components/layout/TopNav"
import { NotificationModal } from "@/components/layout/NotificationModal"

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Sidebar
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        collapsed={sidebarCollapsed}
        onToggleCollapse={() => setSidebarCollapsed((prev) => !prev)}
      />
      <TopNav onMenuClick={() => setSidebarOpen(true)} sidebarCollapsed={sidebarCollapsed} />
      <NotificationModal />
      <main className={`pt-14 min-h-screen transition-all duration-300 ${sidebarCollapsed ? "md:ml-16" : "md:ml-56"}`}>
        <div className="p-3 sm:p-4 md:p-6">{children}</div>
      </main>
    </div>
  )
}
