"use client"

import { useState, useRef } from "react"
import { formatDistanceToNow } from "date-fns"
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
  const [newComment, setNewComment] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  async function handleSend() {
    if (!newComment.trim()) return
    setSubmitting(true)
    const res = await fetch(`/api/work-orders/${workOrderId}/comments`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ body: newComment }),
    })
    if (res.ok) {
      const c = await res.json()
      setComments([...comments, c])
      setNewComment("")
    }
    setSubmitting(false)
  }

  return (
    <div className="bg-card rounded-xl border border-border shadow-sm flex flex-col h-[600px] overflow-hidden">
      <div className="px-6 py-4 border-b border-white/15 bg-white/[0.05] flex items-center justify-between">
        <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
          <svg className="w-4 h-4 text-accent-blue" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
          </svg>
          Activity & Comments
        </h3>
        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-white/8 text-gray-300 border border-white/15 uppercase tracking-widest">
          {comments.length} Messages
        </span>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {comments.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center opacity-50">
            <div className="w-12 h-12 bg-white/5 rounded-full flex items-center justify-center mb-4 border border-border">
              <svg className="w-6 h-6 text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
            </div>
            <p className="text-sm text-gray-400 italic">Start the conversation...<br/>Log important updates here.</p>
          </div>
        ) : (
          comments.map((comment) => (
            <div key={comment.id} className="group relative">
              <div className="flex items-start gap-4">
                <UserAvatar user={comment.author} size="sm" className="mt-1 shadow-lg shadow-black/20 shrink-0 ring-1 ring-white/10" />
                <div className="flex-1 space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-white">{comment.author.displayName}</span>
                    <span className="text-[10px] font-medium text-gray-400 tabular-nums">
                      {formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true })}
                    </span>
                  </div>
                  <div className="relative group/msg">
                    <div className="p-3.5 bg-white/[0.06] border border-white/12 rounded-2xl rounded-tl-none text-sm text-white leading-relaxed shadow-sm group-hover:bg-white/[0.08] group-hover:border-white/15 transition-all">
                      {comment.body}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="p-4 bg-white/[0.02] border-t border-border">
        <form
          onSubmit={(e) => {
            e.preventDefault()
            handleSend()
          }}
          className="relative"
        >
          <textarea
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault()
                handleSend()
              }
            }}
            placeholder="Write a comment..."
            className="w-full bg-card border border-border rounded-xl px-4 py-3 pr-24 text-sm focus:outline-none focus:ring-1 focus:ring-accent-blue/50 focus:border-accent-blue transition-all resize-none text-foreground placeholder-muted h-[100px]"
          />
          <div className="absolute bottom-3 right-3 flex items-center gap-2">
            <button
              type="submit"
              disabled={!newComment.trim() || submitting}
              className="px-4 py-1.5 bg-accent-blue hover:bg-accent-blue/80 disabled:opacity-30 text-white text-[10px] font-black uppercase tracking-widest rounded-lg transition-all shadow-[0_4px_12px_rgba(74,144,226,0.3)] disabled:shadow-none active:scale-95"
            >
              {submitting ? "..." : "Post Message"}
            </button>
          </div>
        </form>
        <p className="mt-2 text-[10px] text-gray-400 text-center flex items-center justify-center gap-1 opacity-75">
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          Press Enter to send
        </p>
      </div>
    </div>
  )
}
