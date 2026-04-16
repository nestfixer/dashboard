"use client"

import { useState, useRef, useCallback } from "react"

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
  const [images, setImages] = useState<WOImage[]>(initialImages)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [dragOver, setDragOver] = useState(false)

  // One hidden input for library (no capture), one for camera
  const libraryInputRef = useRef<HTMLInputElement>(null)
  const cameraInputRef = useRef<HTMLInputElement>(null)

  async function uploadFiles(files: FileList | File[]) {
    const fileArr = Array.from(files)
    if (!fileArr.length) return
    setUploading(true)
    setError(null)

    for (const file of fileArr) {
      if (!file.type.startsWith("image/")) {
        setError(`${file.name} is not an image`)
        continue
      }
      if (file.size > 10 * 1024 * 1024) {
        setError(`${file.name} is too large (max 10 MB)`)
        continue
      }
      const fd = new FormData()
      fd.append("file", file)
      try {
        const res = await fetch(`/api/work-orders/${workOrderId}/images`, {
          method: "POST",
          body: fd,
        })
        if (res.ok) {
          const img: WOImage = await res.json()
          setImages((prev) => [...prev, img])
        } else {
          const data = await res.json().catch(() => ({}))
          setError(data.error ?? `Upload failed for ${file.name}`)
        }
      } catch {
        setError(`Network error uploading ${file.name}`)
      }
    }

    setUploading(false)
    // Reset both inputs so the same file can be re-selected if needed
    if (libraryInputRef.current) libraryInputRef.current.value = ""
    if (cameraInputRef.current) cameraInputRef.current.value = ""
  }

  async function removeImage(img: WOImage) {
    // Optimistically remove from UI
    setImages((prev) => prev.filter((i) => i.id !== img.id))
    // Delete from DB
    await fetch(`/api/work-orders/${workOrderId}/images/${img.id}`, {
      method: "DELETE",
    }).catch(() => {
      // Re-add if delete failed
      setImages((prev) => [...prev, img])
    })
  }

  // Drag-and-drop handlers
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(true)
  }, [])

  const handleDragLeave = useCallback(() => {
    setDragOver(false)
  }, [])

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      setDragOver(false)
      const files = e.dataTransfer.files
      if (files.length) uploadFiles(files)
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [workOrderId]
  )

  return (
    <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 border-b border-border bg-gray-50 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
          <svg className="w-4 h-4 text-accent-blue" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          Photos &amp; Documentation
        </h3>
        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-gray-100 text-muted border border-border uppercase tracking-widest">
          {images.length} {images.length === 1 ? "File" : "Files"}
        </span>
      </div>

      {/* Hidden file inputs — these MUST be outside any clickable overlay */}
      <input
        ref={libraryInputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        title="Upload from library"
        aria-label="Upload from library"
        onChange={(e) => uploadFiles(e.target.files ?? [])}
      />
      {/* eslint-disable-next-line */}
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        title="Take photo"
        aria-label="Take photo"
        onChange={(e) => uploadFiles(e.target.files ?? [])}
      />

      <div className="p-6 space-y-4">
        {/* Error banner */}
        {error && (
          <div className="flex items-center justify-between gap-3 px-4 py-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-xs">
            <span>{error}</span>
            <button onClick={() => setError(null)} className="shrink-0 hover:text-red-300" title="Dismiss error" aria-label="Dismiss error">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        )}

        {/* Image grid */}
        {images.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {images.map((img) => (
              <div
                key={img.id}
                className="group relative aspect-square bg-gray-50 border border-border rounded-xl overflow-hidden hover:border-gray-300 transition-all shadow-md"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={img.url}
                  alt={img.originalName}
                  className="w-full h-full object-cover grayscale-[20%] group-hover:grayscale-0 transition-all duration-500 scale-100 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                <button
                  onClick={() => removeImage(img)}
                  className="absolute top-2 right-2 p-1.5 bg-black/60 backdrop-blur-md text-white/80 hover:text-white hover:bg-red-500 rounded-lg opacity-0 group-hover:opacity-100 transition-all transform translate-y-[-10px] group-hover:translate-y-0"
                  title="Remove photo"
                  aria-label="Remove photo"
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
                {/* Filename tooltip on hover */}
                <div className="absolute bottom-0 inset-x-0 px-2 py-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                  <p className="text-[10px] text-white/80 truncate">{img.originalName}</p>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Drop zone */}
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={`flex flex-col items-center justify-center p-8 border-2 border-dashed rounded-xl transition-all ${
            dragOver
              ? "border-accent-blue bg-accent-blue/5 scale-[1.01]"
              : "border-gray-200 bg-gray-50"
          }`}
        >
          {/* Icon */}
          <div className={`w-14 h-14 rounded-full flex items-center justify-center mb-3 transition-all ${
            dragOver ? "bg-accent-blue/10" : "bg-gray-100"
          }`}>
            {uploading ? (
              <div className="w-6 h-6 border-2 border-accent-blue border-t-transparent rounded-full animate-spin" />
            ) : (
              <svg className={`w-7 h-7 transition-colors ${dragOver ? "text-accent-blue" : "text-muted"}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            )}
          </div>

          <p className="text-sm text-muted mb-1 font-medium">
            {uploading ? "Uploading…" : dragOver ? "Drop to upload" : "Drag & drop photos here"}
          </p>
          <p className="text-xs text-muted/60 mb-5">JPG, PNG, HEIC — max 10 MB each</p>

          {/* Action buttons */}
          <div className="flex flex-wrap items-center justify-center gap-3">
            {/* From Library — triggers libraryInputRef (no capture, opens photo picker) */}
            <button
              type="button"
              disabled={uploading}
              onClick={() => libraryInputRef.current?.click()}
              className="px-5 py-2.5 bg-accent-blue hover:bg-accent-blue/90 disabled:opacity-50 text-white text-[11px] font-black uppercase tracking-[0.12em] rounded-xl transition-all active:scale-95 flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              From Library
            </button>

            {/* Take Photo — triggers cameraInputRef (capture="environment") */}
            <button
              type="button"
              disabled={uploading}
              onClick={() => cameraInputRef.current?.click()}
              className="px-5 py-2.5 bg-[#1a2b6b] hover:bg-[#152359] disabled:opacity-50 text-white text-[11px] font-black uppercase tracking-[0.12em] rounded-xl transition-all active:scale-95 flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              Take Photo
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
