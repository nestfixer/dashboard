"use client"

import { useState, useEffect, useRef, useCallback } from "react"

const STORAGE_KEY = "active_timer"

interface TimerState {
  timeEntryId: number
  startTime: string
  workOrderId: number
}

export function useTimer() {
  const [active, setActive] = useState<TimerState | null>(null)
  const [elapsed, setElapsed] = useState(0)
  const intervalRef = useRef<NodeJS.Timeout | null>(null)

  // Load from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) {
      const state: TimerState = JSON.parse(stored)
      setActive(state)
      setElapsed(Math.floor((Date.now() - new Date(state.startTime).getTime()) / 1000))
    }
  }, [])

  // Tick
  useEffect(() => {
    if (active) {
      intervalRef.current = setInterval(() => {
        setElapsed(Math.floor((Date.now() - new Date(active.startTime).getTime()) / 1000))
      }, 1000)
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current)
      setElapsed(0)
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [active])

  const startTimer = useCallback(async (workOrderId: number) => {
    const res = await fetch(`/api/work-orders/${workOrderId}/time-entries`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ entryType: "timer", startTime: new Date().toISOString() }),
    })
    const entry = await res.json()
    const state: TimerState = {
      timeEntryId: entry.id,
      startTime: entry.startTime,
      workOrderId,
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
    setActive(state)
  }, [])

  const stopTimer = useCallback(async () => {
    if (!active) return null
    const endTime = new Date().toISOString()
    const durationMins = Math.round(elapsed / 60)
    const res = await fetch(`/api/time-entries/${active.timeEntryId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ endTime, durationMins }),
    })
    const entry = await res.json()
    localStorage.removeItem(STORAGE_KEY)
    setActive(null)
    return entry
  }, [active, elapsed])

  const formatElapsed = (secs: number) => {
    const h = Math.floor(secs / 3600)
    const m = Math.floor((secs % 3600) / 60)
    const s = secs % 60
    return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`
  }

  return {
    active,
    elapsed,
    displayTime: formatElapsed(elapsed),
    isRunning: !!active,
    isRunningFor: active?.workOrderId,
    startTimer,
    stopTimer,
  }
}
