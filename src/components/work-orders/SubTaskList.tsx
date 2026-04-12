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
    <div className="bg-white rounded-xl border border-gray-200 p-5">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-gray-900">Subtasks</h3>
        {tasks.length > 0 && (
          <span className="text-xs text-gray-500">{completed}/{tasks.length} done</span>
        )}
      </div>

      {tasks.length > 0 && (
        <div className="mb-4">
          <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-indigo-500 rounded-full transition-all duration-300"
              style={{ width: `${pct}%` }}
            />
          </div>
        </div>
      )}

      <div className="space-y-1 mb-3">
        {tasks.map((task) => (
          <div key={task.id} className="group flex items-center gap-2.5 py-1.5 rounded-lg px-1 hover:bg-gray-50">
            <button
              onClick={() => toggleTask(task)}
              className={`w-4 h-4 rounded border flex-shrink-0 flex items-center justify-center transition-colors ${
                task.completed
                  ? "bg-indigo-600 border-indigo-600"
                  : "border-gray-300 hover:border-indigo-400"
              }`}
            >
              {task.completed && (
                <svg className="w-2.5 h-2.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                </svg>
              )}
            </button>
            <span
              contentEditable
              suppressContentEditableWarning
              onBlur={(e) => renameTask(task, e.currentTarget.textContent ?? "")}
              onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); e.currentTarget.blur() } }}
              className={`flex-1 text-sm outline-none cursor-text rounded px-1 -mx-1 focus:bg-indigo-50 ${
                task.completed ? "line-through text-gray-400" : "text-gray-800"
              }`}
            >
              {task.title}
            </span>
            <button
              onClick={() => deleteTask(task.id)}
              className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-500 transition-all flex-shrink-0"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        ))}
      </div>

      <form onSubmit={addTask} className="flex items-center gap-2">
        <input
          ref={inputRef}
          value={newTitle}
          onChange={(e) => setNewTitle(e.target.value)}
          placeholder="Add a subtask…"
          className="flex-1 text-sm px-2 py-1.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
        />
        <button
          type="submit"
          disabled={adding || !newTitle.trim()}
          className="px-3 py-1.5 text-xs font-medium bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg disabled:opacity-50 transition-colors"
        >
          Add
        </button>
      </form>
    </div>
  )
}
