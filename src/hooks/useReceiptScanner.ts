import { useState, RefObject } from "react"

interface Material {
  id: number
  name: string
  quantity: number
  unitCost: number
}

export function useReceiptScanner(
  workOrderId: number, 
  setMaterials: React.Dispatch<React.SetStateAction<Material[]>>,
  fileInputRef: RefObject<HTMLInputElement> | null = null
) {
  const [isScanning, setIsScanning] = useState(false)

  async function handleScanChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    setIsScanning(true)
    try {
      const reader = new FileReader()
      const base64Promise = new Promise<string>((resolve) => {
        reader.onloadend = () => {
          const base64 = reader.result?.toString().split(",")[1] || ""
          resolve(base64)
        }
      })
      reader.readAsDataURL(file)
      const imageBase64 = await base64Promise

      const res = await fetch("/api/vision/process-receipt", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageBase64 }),
      })
      
      if (!res.ok) throw new Error("AI processing failed")
      const items = await res.json()

      const newItems: Material[] = []
      for (const item of items) {
        const addRes = await fetch(`/api/work-orders/${workOrderId}/materials`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ 
            name: item.name, 
            quantity: item.quantity, 
            unitCost: item.unitCost 
          }),
        })
        if (addRes.ok) {
          const m = await addRes.json()
          newItems.push(m)
        }
      }
      
      setMaterials(prev => [...prev, ...newItems])
      alert(`Successfully added ${newItems.length} items from receipt.`)
    } catch (error) {
      console.error("Scan error:", error)
      alert("Failed to process receipt. Please try again.")
    } finally {
      setIsScanning(false)
      if (fileInputRef?.current) fileInputRef.current.value = ""
    }
  }

  return {
    isScanning,
    handleScanChange
  }
}
