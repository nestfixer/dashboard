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

  return (
    <div className="bg-white rounded-xl border border-gray-200">
      <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
        <h3 className="text-sm font-semibold text-gray-900">Photos ({images.length})</h3>
        <button
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          className="text-xs px-2 py-1 bg-indigo-50 text-indigo-600 hover:bg-indigo-100 disabled:bg-gray-100 rounded-lg transition-colors"
        >
          {uploading ? "Uploading…" : "+ Upload"}
        </button>
        <input
          ref={inputRef}
          type="file"
          multiple
          accept="image/*"
          className="hidden"
          onChange={(e) => handleFiles(e.target.files)}
        />
      </div>
      <div className="p-5">
        {images.length === 0 ? (
          <div
            onClick={() => inputRef.current?.click()}
            className="border-2 border-dashed border-gray-200 rounded-lg p-8 text-center cursor-pointer hover:border-indigo-300 transition-colors"
          >
            <p className="text-sm text-gray-500">Click to upload photos</p>
            <p className="text-xs text-gray-400 mt-1">JPG, PNG, HEIC up to 10MB each</p>
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-3">
            {images.map((img) => (
              <a key={img.id} href={img.url} target="_blank" rel="noopener noreferrer">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={img.url}
                  alt={img.originalName}
                  className="w-full h-28 object-cover rounded-lg border border-gray-200 hover:opacity-90 transition-opacity"
                />
              </a>
            ))}
            <button
              onClick={() => inputRef.current?.click()}
              className="h-28 border-2 border-dashed border-gray-200 rounded-lg flex items-center justify-center text-gray-400 hover:border-indigo-300 hover:text-indigo-400 transition-colors text-2xl"
            >
              +
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
