"use client"

interface Props {
  open: boolean
  title: string
  message: string
  confirmLabel?: string
  destructive?: boolean
  onConfirm: () => void
  onCancel: () => void
}

export function ConfirmDialog({ open, title, message, confirmLabel = "Confirm", destructive, onConfirm, onCancel }: Props) {
  if (!open) return null
  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
      <div 
        className="absolute inset-0 bg-black/80 backdrop-blur-sm animate-in fade-in duration-300" 
        onClick={onCancel} 
      />
      <div className="relative w-full max-w-sm bg-card border border-border rounded-2xl shadow-[0_25px_60px_rgba(0,0,0,0.8)] overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="p-8 text-center">
          <div className="w-16 h-16 bg-accent-red/10 rounded-full flex items-center justify-center mx-auto mb-6 border border-accent-red/20">
            <svg className="w-8 h-8 text-accent-red" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h3 className="text-xl font-black text-foreground mb-3 tracking-tight">{title}</h3>
          <p className="text-sm text-muted leading-relaxed">
            {message}
          </p>
        </div>
        <div className="flex border-t border-white/5">
          <button
            onClick={onCancel}
            className="flex-1 px-6 py-4 text-xs font-black uppercase tracking-[0.2em] text-muted hover:text-foreground hover:bg-white/5 transition-all border-r border-white/5"
          >
            Go Back
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 px-6 py-4 text-xs font-black uppercase tracking-[0.2em] text-accent-red hover:bg-accent-red/10 transition-all font-bold"
          >
            Confirm
          </button>
        </div>
      </div>
    </div>
  )
}
