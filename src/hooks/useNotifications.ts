"use client"

import { useState, useEffect, useCallback } from "react"
import { WorkOrder } from "@/types"

const DISMISSED_KEY = "dismissedNotificationIds"
const CHECK_INTERVAL = 10 * 60 * 1000

function getDismissedIds(): number[] {
  try {
    const raw = sessionStorage.getItem(DISMISSED_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

export function useNotifications() {
  const [notifications, setNotifications] = useState<WorkOrder[]>([])
  const [shown, setShown] = useState(true)

  const fetchAndShow = useCallback(() => {
    fetch("/api/notifications")
      .then((r) => r.json())
      .then((data: WorkOrder[]) => {
        if (!Array.isArray(data)) return
        const dismissed = getDismissedIds()
        const fresh = data.filter((wo) => !dismissed.includes(wo.id))
        if (fresh.length > 0) {
          setNotifications(fresh)
          setShown(false)
        }
      })
      .catch(() => {})
  }, [])

  useEffect(() => {
    fetchAndShow()
    const interval = setInterval(fetchAndShow, CHECK_INTERVAL)
    return () => clearInterval(interval)
  }, [fetchAndShow])

  const dismiss = () => {
    setShown(true)
    try {
      const existing = getDismissedIds()
      const merged = Array.from(new Set([...existing, ...notifications.map((wo) => wo.id)]))
      sessionStorage.setItem(DISMISSED_KEY, JSON.stringify(merged))
    } catch {}
  }

  return { notifications, shown, dismiss }
}
