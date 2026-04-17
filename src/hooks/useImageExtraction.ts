import { useState } from "react"

interface UseImageExtractionProps {
  setTitle: (t: string) => void
  setDescription: (d: string) => void
  setPriority: (p: string) => void
  setRemarks: (r: string) => void
  setNewCustomerMode: (m: boolean) => void
  setNewCustomerName: (n: string) => void
  setNewCustomerPhone: (p: string) => void
  setNewCustomerAddress: (a: string) => void
}

export function useImageExtraction({
  setTitle,
  setDescription,
  setPriority,
  setRemarks,
  setNewCustomerMode,
  setNewCustomerName,
  setNewCustomerPhone,
  setNewCustomerAddress
}: UseImageExtractionProps) {
  const [extracting, setExtracting] = useState(false)
  const [extractError, setExtractError] = useState("")
  const [extractedFrom, setExtractedFrom] = useState<string | null>(null)
  const [dragOver, setDragOver] = useState(false)

  async function extractFromImage(file: File) {
    setExtracting(true)
    setExtractError("")
    setExtractedFrom(null)
    try {
      const fd = new FormData()
      fd.append("image", file)
      const res = await fetch("/api/work-orders/extract-from-image", { method: "POST", body: fd })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? "Extraction failed")
      if (data.title) setTitle(data.title)
      if (data.description) setDescription(data.description)
      if (data.priority) setPriority(data.priority)
      if (data.remarks) setRemarks(data.remarks)
      if (data.customerName || data.customerPhone || data.customerAddress) {
        setNewCustomerMode(true)
        if (data.customerName) setNewCustomerName(data.customerName)
        if (data.customerPhone) setNewCustomerPhone(data.customerPhone)
        if (data.customerAddress) setNewCustomerAddress(data.customerAddress)
      }
      setExtractedFrom(file.name)
    } catch (err) {
      const error = err as Error
      setExtractError(error.message ?? "Could not extract from image")
    } finally {
      setExtracting(false)
    }
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (file) extractFromImage(file)
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault()
    setDragOver(false)
    const file = e.dataTransfer.files?.[0]
    if (file && file.type.startsWith("image/")) extractFromImage(file)
  }

  function handleDragOver(e: React.DragEvent) {
    e.preventDefault()
    setDragOver(true)
  }

  function handleDragLeave() {
    setDragOver(false)
  }

  return {
    extracting,
    extractError,
    extractedFrom,
    dragOver,
    handleFileChange,
    handleDrop,
    handleDragOver,
    handleDragLeave
  }
}
