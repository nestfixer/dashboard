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
                className="flex items-center gap-1.5 text-sm text-indigo-600 hover:text-indigo-800 font-medium transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                Month View
              </button>
              <span className="text-gray-300">|</span>
              <span className="text-base font-semibold text-gray-900">{dayLabel}</span>
            </>
          ) : (
            <h2 className="text-xl font-semibold text-gray-900">Calendar</h2>
          )}
        </div>
        <div className="flex items-center gap-3">
          {loading && (
            <span className="text-xs text-gray-400">Loading…</span>
          )}
          <div className="flex items-center gap-3 text-xs text-gray-500">
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-sm bg-indigo-500 inline-block" />
              Work Order
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-sm bg-indigo-200 border border-indigo-400 inline-block" />
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
            <div className="bg-white rounded-xl border border-gray-200 p-4 h-full min-h-[400px]">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                  <svg className="w-4 h-4 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                  </svg>
                  Unscheduled WOs
                </h3>
                {unscheduledWOs.length > 0 && (
                  <span className="bg-indigo-50 text-indigo-600 text-[10px] font-bold px-2 py-0.5 rounded-full">
                    {unscheduledWOs.length}
                  </span>
                )}
              </div>

              <div id="external-events" className="space-y-2 max-h-[600px] overflow-y-auto pr-1 custom-scrollbar">
                {loadingUnscheduled ? (
                  <div className="py-8 text-center text-xs text-gray-400">Loading work orders...</div>
                ) : unscheduledWOs.length === 0 ? (
                  <div className="py-12 border-2 border-dashed border-gray-100 rounded-lg text-center">
                    <p className="text-xs text-gray-400">No unscheduled work orders</p>
                  </div>
                ) : (
                  unscheduledWOs.map((wo) => (
                    <div
                      key={wo.id}
                      data-id={wo.id}
                      data-title={wo.title}
                      data-customer={wo.customer?.name}
                      data-status={wo.status}
                      className="fc-event-external p-3 rounded-lg border border-gray-100 bg-white hover:border-indigo-300 hover:shadow-sm cursor-move transition-all active:scale-95 group"
                    >
                      <div className="font-medium text-xs text-gray-900 group-hover:text-indigo-600 truncate mb-1.5">
                        {wo.title}
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] text-gray-500 truncate max-w-[100px]">
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
              <p className="mt-4 text-[10px] text-gray-400 text-center">
                Drag and drop to schedule
              </p>
            </div>
          </div>
        )}

        {/* Calendar */}
        <div className="flex-grow bg-white rounded-xl border border-gray-200 p-4 fc-wrapper">
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
                <div className="px-1.5 py-0.5 truncate text-xs font-medium w-full">
                  {arg.event.title}
                </div>
              )
            }

            // Day view — richer content
            if (isWO) {
              return (
                <div className="p-1.5 text-xs overflow-hidden h-full">
                  <div className="font-semibold truncate">{arg.event.title}</div>
                  {customer && <div className="opacity-80 truncate">{customer}</div>}
                  {assignedTo && <div className="opacity-70 truncate">{assignedTo}</div>}
                  {status && (
                    <div className={`mt-0.5 inline-block px-1 py-0.5 rounded text-xs font-medium ${
                      status === "Completed" ? "bg-white/30" :
                      status === "Accepted" ? "bg-white/30" : "bg-white/20"
                    }`}>{status}</div>
                  )}
                </div>
              )
            }

            return (
              <div className="p-1.5 text-xs overflow-hidden h-full">
                <div className="font-medium truncate">{arg.event.title}</div>
                {!arg.event.allDay && arg.timeText && (
                  <div className="opacity-70">{arg.timeText}</div>
                )}
              </div>
            )
          }}
        />
        </div>
      </div>

      <style>{`
        .fc-wrapper .fc-toolbar-title { font-size: 1rem; font-weight: 600; color: #111827; }
        .fc-wrapper .fc-button { background: #6366f1; border-color: #6366f1; font-size: 0.75rem; padding: 0.35rem 0.75rem; border-radius: 0.5rem; }
        .fc-wrapper .fc-button:hover { background: #4f46e5; border-color: #4f46e5; }
        .fc-wrapper .fc-button-active, .fc-wrapper .fc-button:focus { background: #4338ca !important; border-color: #4338ca !important; box-shadow: none !important; }
        .fc-wrapper .fc-daygrid-day:hover { background: #f5f3ff; cursor: pointer; }
        .fc-wrapper .fc-col-header-cell { background: #f9fafb; font-size: 0.75rem; font-weight: 600; color: #6b7280; text-transform: uppercase; letter-spacing: 0.05em; }
        .fc-wrapper .fc-timegrid-slot { height: 3rem; }
        .fc-wrapper .fc-timegrid-slot-label { font-size: 0.7rem; color: #9ca3af; }
        .fc-wrapper .fc-daygrid-day-number { font-size: 0.8rem; color: #374151; padding: 4px 8px; }
        .fc-wrapper .fc-day-today { background: #eff6ff !important; }
        .fc-wrapper .fc-day-today .fc-daygrid-day-number { color: #6366f1; font-weight: 700; }
        .fc-wrapper .fc-now-indicator-line { border-color: #ef4444; }
        .fc-wrapper .fc-now-indicator-arrow { border-top-color: #ef4444; }
        .fc-wrapper .fc-scrollgrid { border-radius: 0.5rem; overflow: hidden; }
        .fc-wrapper .fc-event { border-radius: 0.375rem; }
        .fc-wrapper .fc-more-link { font-size: 0.7rem; color: #6366f1; font-weight: 600; }
        
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #e5e7eb; border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #d1d5db; }
        
        .fc-event-external:active { cursor: grabbing; }
      `}</style>
    </div>
  )
}
