"use client"

import { useState, useRef } from "react"

interface SubTask {
  id: number
  title: string
  completed: boolean
  position: number
}

interface Props {
  workOrderId: number
  initialSubTasks: SubTask[]
}

export function SubTaskList({ workOrderId, initialSubTasks }: Props) {
  const [tasks, setTasks] = useState<SubTask[]>(initialSubTasks)
  const [newTitle, setNewTitle] = useState("")
  const [adding, setAdding] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const completed = tasks.filter((t) => t.completed).length
  const pct = tasks.length > 0 ? Math.round((completed / tasks.length) * 100) : 0

  async function addTask(e: React.FormEvent) {
    e.preventDefault()
    if (!newTitle.trim()) return
    setAdding(true)
    const res = await fetch(`/api/work-orders/${workOrderId}/subtasks`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: newTitle.trim() }),
    })
    if (res.ok) {
      const task = await res.json()
      setTasks((prev) => [...prev, task])
      setNewTitle("")
      inputRef.current?.focus()
    }
    setAdding(false)
  }

  async function toggleTask(task: SubTask) {
    const updated = { ...task, completed: !task.completed }
    setTasks((prev) => prev.map((t) => (t.id === task.id ? updated : t)))
    await fetch(`/api/work-orders/${workOrderId}/subtasks/${task.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ completed: updated.completed }),
    })
  }

  async function deleteTask(id: number) {
    setTasks((prev) => prev.filter((t) => t.id !== id))
    await fetch(`/api/work-orders/${workOrderId}/subtasks/${id}`, { method: "DELETE" })
  }

  async function renameTask(task: SubTask, title: string) {
    if (!title.trim() || title === task.title) return
    setTasks((prev) => prev.map((t) => (t.id === task.id ? { ...t, title } : t)))
    await fetch(`/api/work-orders/${workOrderId}/subtasks/${task.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: title.trim() }),
    })
  }

  return (
    <div className="bg-card rounded-xl border border-border p-5 shadow-sm">
      <div className="flex items-center justify-between mb-4 pb-2 border-b border-gray-100">
        <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
          <svg className="w-4 h-4 text-accent-blue" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
          </svg>
          Subtasks
        </h3>
        {tasks.length > 0 && (
          <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">{completed} / {tasks.length} completed</span>
        )}
      </div>

      {tasks.length > 0 && (
        <div className="mb-6">
          <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-accent-blue rounded-full transition-all duration-500"
              style={{ width: `${pct}%` }}
            />
          </div>
        </div>
      )}

      <div className="space-y-1 mb-4">
        {tasks.map((task) => (
          <div key={task.id} className="group flex items-center gap-3 py-2 rounded-lg px-2 hover:bg-gray-50 transition-all">
            <button
              onClick={() => toggleTask(task)}
              className={`w-5 h-5 rounded-md border flex-shrink-0 flex items-center justify-center transition-all ${
                task.completed
                  ? "bg-accent-blue border-accent-blue"
                  : "border-gray-300 hover:border-accent-blue/50 bg-gray-50"
              }`}
            >
              {task.completed && (
                <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                </svg>
              )}
            </button>
            <span
              contentEditable
              suppressContentEditableWarning
              onBlur={(e) => renameTask(task, e.currentTarget.textContent ?? "")}
              onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); e.currentTarget.blur() } }}
              className={`flex-1 text-sm outline-none cursor-text rounded-md px-2 py-0.5 -mx-2 transition-colors focus:bg-gray-100 ${
                task.completed ? "line-through text-muted-foreground" : "text-foreground"
              }`}
            >
              {task.title}
            </span>
            <button
              onClick={() => deleteTask(task.id)}
              className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-red-400 p-1 transition-all active:scale-90"
              title="Delete task"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        ))}
      </div>

      <form onSubmit={addTask} className="flex items-center gap-2">
        <div className="relative flex-1 group">
          <input
            ref={inputRef}
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            placeholder="Add a new subtask…"
            className="w-full text-sm pl-3 pr-3 py-2 bg-card border border-border rounded-lg focus:outline-none focus:ring-1 focus:ring-accent-blue/50 focus:border-accent-blue transition-all"
          />
        </div>
        <button
          type="submit"
          disabled={adding || !newTitle.trim()}
          className="px-4 py-2 text-xs font-bold uppercase tracking-wider bg-[#1a2b6b] hover:bg-[#152359] text-white rounded-lg disabled:opacity-30 transition-all"
        >
          {adding ? "…" : "Add"}
        </button>
      </form>
    </div>
  )
}
