"use client"

import { useState, useRef } from "react"

interface WOImage {
  id: number
  url: string
  originalName: string
}

interface Props {
  workOrderId: number
  initialImages: WOImage[]
}

export function ImageUploader({ workOrderId, initialImages }: Props) {
  const [images, setImages] = useState(initialImages)
  const [uploading, setUploading] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  async function handleFiles(files: FileList | null) {
    if (!files?.length) return
    setUploading(true)
    for (const file of Array.from(files)) {
      if (file.size > 10 * 1024 * 1024) { alert(`${file.name} is too large (max 10MB)`); continue }
      const fd = new FormData()
      fd.append("file", file)
      const res = await fetch(`/api/work-orders/${workOrderId}/images`, { method: "POST", body: fd })
      if (res.ok) {
        const img = await res.json()
        setImages((prev) => [...prev, img])
      }
    }
    setUploading(false)
    if (inputRef.current) inputRef.current.value = ""
  }

  const removeImage = (index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index))
  }

  return (
    <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
      <div className="px-6 py-4 border-b border-border bg-gray-50 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
          <svg className="w-4 h-4 text-accent-blue" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          Photos & Documentation
        </h3>
        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-gray-100 text-muted border border-border uppercase tracking-widest">
          {images.length} Files
        </span>
      </div>

      <div className="p-6">
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 mb-6">
          {images.map((img, i) => (
            <div key={i} className="group relative aspect-square bg-gray-50 border border-border rounded-xl overflow-hidden hover:border-gray-300 transition-all shadow-md">
              <img src={img.url} alt={img.originalName} className="w-full h-full object-cover grayscale-[20%] group-hover:grayscale-0 transition-all duration-500 scale-100 group-hover:scale-105" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              <button
                onClick={() => removeImage(i)}
                className="absolute top-2 right-2 p-1.5 bg-black/60 backdrop-blur-md text-white/80 hover:text-white hover:bg-accent-red rounded-lg opacity-0 group-hover:opacity-100 transition-all transform translate-y-[-10px] group-hover:translate-y-0"
                title="Remove photo"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          ))}
          
          <div className="relative aspect-square">
            <input
              type="file"
              onChange={(e) => handleFiles(e.target.files)}
              accept="image/*"
              className="absolute inset-0 opacity-0 cursor-pointer z-10"
              disabled={uploading}
              multiple
            />
            <div className="h-full border-2 border-dashed border-gray-200 rounded-xl flex flex-col items-center justify-center bg-gray-50 hover:bg-gray-100 hover:border-accent-blue/30 transition-all group overflow-hidden">
              <div className="relative">
                <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mb-2 group-hover:scale-110 group-hover:bg-accent-blue/10 transition-all duration-300">
                  {uploading ? (
                    <div className="w-6 h-6 border-2 border-accent-blue border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <svg className="w-6 h-6 text-muted group-hover:text-accent-blue transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4v16m8-8H4" />
                    </svg>
                  )}
                </div>
              </div>
              <span className="text-[10px] font-black uppercase tracking-widest text-muted group-hover:text-foreground transition-colors">
                {uploading ? 'Processing...' : 'Add Photo'}
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-center p-8 border border-gray-200 rounded-xl bg-gray-50 border-dashed">
          <div className="text-center">
            <div className="flex -space-x-2 justify-center mb-4 opacity-50">
              {[1, 2, 3].map(i => (
                <div key={i} className="w-8 h-8 rounded-lg bg-card border border-border flex items-center justify-center">
                  <svg className="w-4 h-4 text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
              ))}
            </div>
            <p className="text-sm text-muted mb-6">Drag and drop site photos here, or use your camera</p>
            <button
              onClick={() => {
                const input = document.createElement('input');
                input.type = 'file';
                input.accept = 'image/*';
                input.capture = 'environment';
                input.onchange = (e: any) => handleFiles(e.target.files);
                input.click();
              }}
              className="px-8 py-3 bg-[#1a2b6b] hover:bg-[#152359] text-white text-[11px] font-black uppercase tracking-[0.15em] rounded-xl transition-all active:scale-95 flex items-center gap-3 mx-auto"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              Open Site Camera
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
