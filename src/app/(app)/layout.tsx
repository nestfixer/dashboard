"use client"

import { useState } from "react"
import { Sidebar } from "@/components/layout/Sidebar"
import { TopNav } from "@/components/layout/TopNav"
import { NotificationModal } from "@/components/layout/NotificationModal"

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <TopNav onMenuClick={() => setSidebarOpen(true)} />
      <NotificationModal />
      <main className="md:ml-56 pt-14 min-h-screen">
        <div className="p-3 sm:p-4 md:p-6">{children}</div>
      </main>
    </div>
  )
}
