export interface InvoiceCalcInput {
  materials: { quantity: number; unitCost: number }[]
  bufferPct: number
  laborRate: number
  laborHours: number
}

export interface InvoiceCalcResult {
  materialTotal: number
  bufferAmount: number
  laborTotal: number
  grandTotal: number
}

export function calculateInvoice(input: InvoiceCalcInput): InvoiceCalcResult {
  const materialTotal = input.materials.reduce(
    (sum, m) => sum + m.quantity * m.unitCost,
    0
  )
  const bufferAmount = materialTotal * (input.bufferPct / 100)
  const laborTotal = input.laborRate * input.laborHours
  const grandTotal = materialTotal + bufferAmount + laborTotal
  return { materialTotal, bufferAmount, laborTotal, grandTotal }
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(amount)
}
