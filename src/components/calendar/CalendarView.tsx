"use client"

import { useRef, useState, useCallback, useEffect } from "react"
import FullCalendar from "@fullcalendar/react"
import dayGridPlugin from "@fullcalendar/daygrid"
import timeGridPlugin from "@fullcalendar/timegrid"
import interactionPlugin, { Draggable } from "@fullcalendar/interaction"
import type { EventInput, DatesSetArg, EventClickArg } from "@fullcalendar/core"
import type { DateClickArg, EventReceiveArg, EventDropArg } from "@fullcalendar/interaction"
import { format } from "date-fns"
import { useRouter } from "next/navigation"
import { StatusBadge } from "@/components/shared/StatusBadge"
import { PriorityBadge } from "@/components/shared/PriorityBadge"

export function CalendarView({ compact = false }: { compact?: boolean }) {
  const router = useRouter()
  const calRef = useRef<FullCalendar>(null)
  const [isDayView, setIsDayView] = useState(compact)
  const [dayLabel, setDayLabel] = useState(compact ? format(new Date(), "EEEE, MMMM d, yyyy") : "")
  const [events, setEvents] = useState<EventInput[]>([])
  const [loading, setLoading] = useState(false)
  const [unscheduledWOs, setUnscheduledWOs] = useState<any[]>([])
  const [loadingUnscheduled, setLoadingUnscheduled] = useState(false)

  const fetchEvents = useCallback(async (startStr: string, endStr: string) => {
    setLoading(true)
    try {
      const res = await fetch(`/api/calendar/events?start=${startStr}&end=${endStr}`)
      const data = await res.json()
      setEvents(Array.isArray(data) ? data : [])
    } finally {
      setLoading(false)
    }
  }, [])

  const fetchUnscheduledWOs = useCallback(async () => {
    setLoadingUnscheduled(true)
    try {
      const res = await fetch("/api/work-orders?scheduled=false")
      const data = await res.json()
      setUnscheduledWOs(Array.isArray(data) ? data : [])
    } finally {
      setLoadingUnscheduled(false)
    }
  }, [])

  useEffect(() => {
    fetchUnscheduledWOs()
  }, [fetchUnscheduledWOs])

  useEffect(() => {
    const draggableEl = document.getElementById("external-events")
    if (draggableEl) {
      new Draggable(draggableEl, {
        itemSelector: ".fc-event-external",
        eventData: function (eventEl) {
          return {
            title: eventEl.getAttribute("data-title"),
            id: eventEl.getAttribute("data-id"),
            duration: "01:00", // Default to 1 hour if dropped into timegrid
            extendedProps: {
              type: "workorder",
              woId: parseInt(eventEl.getAttribute("data-id") || "0"),
              customer: eventEl.getAttribute("data-customer"),
              status: eventEl.getAttribute("data-status"),
            },
          }
        },
      })
    }
  }, [unscheduledWOs])

  const updateWODueDate = async (woId: number, date: Date | null) => {
    try {
      const res = await fetch(`/api/work-orders/${woId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ dueDate: date?.toISOString() }),
      })
      if (!res.ok) throw new Error("Failed to update work order")
      
      // Refresh both
      const calendarApi = calRef.current?.getApi()
      if (calendarApi) {
        fetchEvents(calendarApi.view.activeStart.toISOString(), calendarApi.view.activeEnd.toISOString())
      }
      fetchUnscheduledWOs()
    } catch (error) {
      console.error("Error updating work order:", error)
      alert("Failed to update work order schedule")
    }
  }

  const handleDatesSet = useCallback((info: DatesSetArg) => {
    const isDay = info.view.type === "timeGridDay"
    setIsDayView(isDay)
    if (isDay) {
      setDayLabel(format(info.start, "EEEE, MMMM d, yyyy"))
    }
    fetchEvents(info.startStr, info.endStr)
  }, [fetchEvents])

  function handleDateClick(info: DateClickArg) {
    calRef.current?.getApi().changeView("timeGridDay", info.dateStr)
  }

  function handleEventClick(info: EventClickArg) {
    const woId = info.event.extendedProps?.woId
    if (woId) router.push(`/work-orders/${woId}`)
  }

  function handleEventReceive(info: EventReceiveArg) {
    const woId = info.event.extendedProps?.woId
    const date = info.event.start
    if (woId) updateWODueDate(woId, date)
  }

  function handleEventDrop(info: EventDropArg) {
    const type = info.event.extendedProps?.type
    if (type === "workorder") {
      const woId = info.event.extendedProps?.woId
      const date = info.event.start
      if (woId) updateWODueDate(woId, date)
    } else {
      info.revert()
      alert("Only work orders can be rescheduled via drag and drop.")
    }
  }

  function goToMonth() {
    calRef.current?.getApi().changeView("dayGridMonth")
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-3">
          {isDayView ? (
            <>
              <button
                onClick={goToMonth}
                className="flex items-center gap-1.5 text-sm text-accent-blue hover:text-accent-blue/80 font-medium transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                Month View
              </button>
              <span className="text-border">|</span>
              <span className="text-base font-semibold text-foreground">{dayLabel}</span>
            </>
          ) : (
            <h2 className="text-xl font-semibold text-foreground">Calendar</h2>
          )}
        </div>
        <div className="flex items-center gap-3">
          {loading && (
            <span className="text-xs text-muted-foreground animate-pulse">Loading…</span>
          )}
          <div className="flex items-center gap-4 text-[10px] uppercase tracking-wider font-bold text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-accent-blue shadow-[0_0_8px_rgba(74,144,226,0.4)]" />
              Work Order
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-accent-blue/30 border border-accent-blue/50" />
              Time Entry
            </span>
          </div>
        </div>
      </div>

      {/* Layout */}
      <div className="flex flex-col lg:flex-row gap-6">
        {/* Unscheduled Sidebar */}
        {!compact && (
          <div className="w-full lg:w-72 flex-shrink-0">
            <div className="bg-card rounded-xl border border-border p-4 h-full min-h-[400px] shadow-sm">
              <div className="flex items-center justify-between mb-4 pb-3 border-b border-border/50">
                <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                  <svg className="w-4 h-4 text-accent-blue" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                  </svg>
                  Unscheduled WOs
                </h3>
                {unscheduledWOs.length > 0 && (
                  <span className="bg-accent-blue/10 text-accent-blue text-[10px] font-bold px-2 py-0.5 rounded-full border border-accent-blue/20">
                    {unscheduledWOs.length}
                  </span>
                )}
              </div>

              <div id="external-events" className="space-y-2 max-h-[600px] overflow-y-auto pr-1 custom-scrollbar">
                {loadingUnscheduled ? (
                  <div className="py-8 text-center text-xs text-muted-foreground">Loading work orders...</div>
                ) : unscheduledWOs.length === 0 ? (
                  <div className="py-12 border-2 border-dashed border-white/5 rounded-lg text-center">
                    <p className="text-xs text-muted-foreground">No unscheduled work orders</p>
                  </div>
                ) : (
                  unscheduledWOs.map((wo) => (
                    <div
                      key={wo.id}
                      data-id={wo.id}
                      data-title={wo.title}
                      data-customer={wo.customer?.name}
                      data-status={wo.status}
                      className="fc-event-external p-3 rounded-lg border border-border bg-white/[0.02] hover:border-accent-blue/40 hover:bg-white/[0.04] cursor-move transition-all active:scale-95 group shadow-sm"
                    >
                      <div className="font-medium text-xs text-foreground group-hover:text-accent-blue truncate mb-1.5 transition-colors">
                        {wo.title}
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] text-muted-foreground truncate max-w-[100px]">
                          {wo.customer?.name || "No Customer"}
                        </span>
                        <div className="scale-75 origin-right">
                          <PriorityBadge priority={wo.priority} />
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
              <p className="mt-4 text-[10px] text-muted-foreground text-center italic">
                Drag and drop to schedule
              </p>
            </div>
          </div>
        )}

        {/* Calendar */}
        <div className="flex-grow bg-card rounded-xl border border-border p-4 fc-wrapper shadow-sm">
          <FullCalendar
            ref={calRef}
            plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
            initialView={compact ? "timeGridDay" : "dayGridMonth"}
            headerToolbar={{
              left: "prev,next today",
              center: "title",
              right: "dayGridMonth,timeGridWeek,timeGridDay",
            }}
            height="auto"
            datesSet={handleDatesSet}
            dateClick={handleDateClick}
            eventClick={handleEventClick}
            eventReceive={handleEventReceive}
            eventDrop={handleEventDrop}
            events={events}
            editable={true}
            droppable={true}
            slotMinTime="06:00:00"
            slotMaxTime="21:00:00"
            slotDuration="00:30:00"
            allDaySlot={true}
            nowIndicator={true}
            dayMaxEvents={4}
            eventTimeFormat={{ hour: "numeric", minute: "2-digit", meridiem: "short" }}
            eventDisplay="block"
            eventMouseEnter={(info) => {
              info.el.style.cursor = "pointer"
            }}
            eventContent={(arg) => {
            const type = arg.event.extendedProps?.type
            const isWO = type === "workorder"
            const status = arg.event.extendedProps?.status
            const customer = arg.event.extendedProps?.customer
            const assignedTo = arg.event.extendedProps?.assignedTo

            if (arg.view.type === "dayGridMonth") {
              return (
                <div className="px-1.5 py-0.5 truncate text-[10px] font-bold w-full uppercase">
                  {arg.event.title}
                </div>
              )
            }

            // Day view — richer content
            if (isWO) {
              return (
                <div className="p-1.5 text-xs overflow-hidden h-full flex flex-col justify-center">
                  <div className="font-bold truncate text-white">{arg.event.title}</div>
                  {customer && <div className="opacity-80 truncate text-[10px] mt-0.5">{customer}</div>}
                  {assignedTo && <div className="opacity-60 truncate text-[9px]">{assignedTo}</div>}
                </div>
              )
            }

            return (
              <div className="p-1.5 text-xs overflow-hidden h-full">
                <div className="font-medium truncate">{arg.event.title}</div>
                {!arg.event.allDay && arg.timeText && (
                  <div className="opacity-70 text-[10px]">{arg.timeText}</div>
                )}
              </div>
            )
          }}
        />
        </div>
      </div>

      <style>{`
        .fc-wrapper { --fc-border-color: rgba(255, 255, 255, 0.08); --fc-page-bg-color: transparent; }
        .fc-wrapper .fc-toolbar-title { font-size: 1rem; font-weight: 700; color: rgba(255, 255, 255, 0.9); letter-spacing: -0.01em; }
        .fc-wrapper .fc-button { background: rgba(255, 255, 255, 0.05); border-color: rgba(255, 255, 255, 0.1); font-size: 0.75rem; padding: 0.4rem 0.8rem; border-radius: 0.5rem; color: rgba(255, 255, 255, 0.8); font-weight: 600; text-transform: capitalize; transition: all 0.2s; }
        .fc-wrapper .fc-button:hover { background: rgba(255, 255, 255, 0.1); border-color: rgba(255, 255, 255, 0.2); color: #fff; }
        .fc-wrapper .fc-button-active, .fc-wrapper .fc-button:focus { background: #4a90e2 !important; border-color: #4a90e2 !important; color: #fff !important; box-shadow: 0 0 15px rgba(74, 144, 226, 0.3) !important; }
        .fc-wrapper .fc-button:disabled { background: rgba(255, 255, 255, 0.03); opacity: 0.5; color: rgba(255, 255, 255, 0.4); }
        
        .fc-wrapper .fc-daygrid-day:hover { background: rgba(255, 255, 255, 0.02); cursor: pointer; }
        .fc-wrapper .fc-col-header-cell { background: rgba(0, 0, 0, 0.2) !important; font-size: 0.7rem; font-weight: 800; color: rgba(255, 255, 255, 0.4); text-transform: uppercase; letter-spacing: 0.1em; padding: 12px 0 !important; border-bottom: 2px solid rgba(255, 255, 255, 0.05) !important; }
        
        .fc-wrapper .fc-timegrid-slot { height: 3.5rem; border-bottom: 1px solid rgba(255, 255, 255, 0.03); }
        .fc-wrapper .fc-timegrid-slot-label { font-size: 0.7rem; color: rgba(255, 255, 255, 0.3); font-weight: 500; }
        .fc-wrapper .fc-timegrid-axis-cbox { border-color: var(--fc-border-color); }
        
        .fc-wrapper .fc-daygrid-day-number { font-size: 0.75rem; color: rgba(255, 255, 255, 0.5); padding: 8px 12px; font-weight: 500; }
        .fc-wrapper .fc-day-today { background: rgba(74, 144, 226, 0.05) !important; }
        .fc-wrapper .fc-day-today .fc-daygrid-day-number { color: #4a90e2; font-weight: 800; text-shadow: 0 0 10px rgba(74, 144, 226, 0.4); }
        
        .fc-wrapper .fc-now-indicator-line { border-color: #ff4d4d; border-width: 2px; }
        .fc-wrapper .fc-now-indicator-arrow { border-top-color: #ff4d4d; border-bottom-color: #ff4d4d; }
        
        .fc-wrapper .fc-event { border: none; background: #4a90e2; box-shadow: 0 2px 4px rgba(0,0,0,0.2); transition: transform 0.1s; }
        .fc-wrapper .fc-event:hover { transform: translateY(-1px); filter: brightness(1.1); }
        .fc-wrapper .fc-v-event { background: #4a90e2; border: 1px solid rgba(255, 255, 255, 0.1); }
        .fc-wrapper .fc-event-main { color: #fff; }
        
        .fc-wrapper .fc-scrollgrid { border: none; }
        .fc-wrapper .fc-theme-standard td, .fc-wrapper .fc-theme-standard th { border-color: rgba(255, 255, 255, 0.06); }
        
        .fc-wrapper .fc-more-link { font-size: 0.65rem; color: #4a90e2; font-weight: 700; text-transform: uppercase; padding: 2px 4px; }
        
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255, 255, 255, 0.1); border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(255, 255, 255, 0.2); }
        
        .fc-event-external:active { cursor: grabbing; z-index: 9999; }
      `}</style>
    </div>
  )
}
