"use client"

import { useState } from "react"
import { format } from "date-fns"
import { UserAvatar } from "@/components/shared/UserAvatar"

interface Comment {
  id: number
  body: string
  createdAt: string
  author: { id: number; displayName: string; color: string }
}

interface Props {
  workOrderId: number
  initialComments: Comment[]
  currentUserId: number
}

export function CommentThread({ workOrderId, initialComments, currentUserId }: Props) {
  const [comments, setComments] = useState(initialComments)
  const [body, setBody] = useState("")
  const [submitting, setSubmitting] = useState(false)

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!body.trim()) return
    setSubmitting(true)
    const res = await fetch(`/api/work-orders/${workOrderId}/comments`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ body }),
    })
    if (res.ok) {
      const c = await res.json()
      setComments([...comments, c])
      setBody("")
    }
    setSubmitting(false)
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200">
      <div className="px-5 py-4 border-b border-gray-100">
        <h3 className="text-sm font-semibold text-gray-900">Comments ({comments.length})</h3>
      </div>
      <div className="p-5 space-y-4">
        {comments.length === 0 && (
          <p className="text-sm text-gray-500 text-center py-2">No comments yet. Be the first!</p>
        )}
        {comments.map((c) => (
          <div key={c.id} className="flex gap-3">
            <UserAvatar user={c.author} size="md" className="mt-0.5" />
            <div className="flex-1 bg-gray-50 rounded-lg px-3 py-2">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs font-semibold text-gray-900">{c.author.displayName}</span>
                <span className="text-xs text-gray-400">{format(new Date(c.createdAt), "MMM d, h:mm a")}</span>
              </div>
              <p className="text-sm text-gray-700 whitespace-pre-wrap">{c.body}</p>
            </div>
          </div>
        ))}

        <form onSubmit={submit} className="flex gap-3 pt-2">
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            rows={2}
            placeholder="Add a comment…"
            className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
          />
          <button
            type="submit"
            disabled={submitting || !body.trim()}
            className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 rounded-lg transition-colors self-end"
          >
            {submitting ? "…" : "Post"}
          </button>
        </form>
      </div>
    </div>
  )
}
