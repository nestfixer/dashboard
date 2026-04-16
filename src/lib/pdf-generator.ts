import jsPDF from "jspdf"
import autoTable from "jspdf-autotable"
import { Invoice } from "@/types"
import { formatCurrency } from "./invoice-calc"
import { format } from "date-fns"

export function generateInvoicePDF(invoice: Invoice): void {
  const doc = new jsPDF()

  // Header
  doc.setFontSize(24)
  doc.setTextColor(99, 102, 241)
  doc.text("INVOICE", 14, 22)

  doc.setFontSize(10)
  doc.setTextColor(100)
  doc.text(`Invoice #: ${invoice.invoiceNumber}`, 140, 16)
  doc.text(`Date: ${format(new Date(invoice.issuedAt), "MMM d, yyyy")}`, 140, 22)
  doc.text(`Status: ${invoice.status}`, 140, 28)

  // Customer info
  if (invoice.workOrder?.customer) {
    doc.setFontSize(11)
    doc.setTextColor(0)
    doc.text("Bill To:", 14, 40)
    doc.setFontSize(10)
    doc.setTextColor(50)
    const c = invoice.workOrder.customer
    doc.text(c.name, 14, 47)
    if (c.phone) doc.text(c.phone, 14, 53)
    if (c.address) doc.text(c.address, 14, 59)
  }

  // WO reference
  doc.setFontSize(10)
  doc.setTextColor(100)
  doc.text(`Work Order: ${invoice.workOrder?.title ?? `#${invoice.workOrderId}`}`, 14, 72)

  // Line items table
  const rows = (invoice.lines ?? []).map((line) => [
    line.description,
    line.lineType,
    line.quantity.toString(),
    formatCurrency(line.unitCost),
    formatCurrency(line.lineTotal),
  ])

  autoTable(doc, {
    startY: 80,
    head: [["Description", "Type", "Qty", "Unit Cost", "Total"]],
    body: rows,
    styles: { fontSize: 9 },
    headStyles: { fillColor: [99, 102, 241] },
    columnStyles: {
      0: { cellWidth: 70 },
      2: { halign: "center" },
      3: { halign: "right" },
      4: { halign: "right" },
    },
  })

  // Totals
  const finalY = ((doc as unknown) as { lastAutoTable?: { finalY?: number } }).lastAutoTable?.finalY 
    ? ((doc as unknown) as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 10 
    : 100
  const col1 = 130
  const col2 = 180

  doc.setFontSize(10)
  doc.setTextColor(0)
  doc.text("Materials Subtotal:", col1, finalY)
  doc.text(formatCurrency(invoice.materialTotal), col2, finalY, { align: "right" })

  doc.text(`Buffer (${invoice.bufferPct}%):`, col1, finalY + 7)
  doc.text(formatCurrency(invoice.bufferAmount), col2, finalY + 7, { align: "right" })

  doc.text(`Labor (${invoice.laborHours}h @ ${formatCurrency(invoice.laborRate)}/h):`, col1, finalY + 14)
  doc.text(formatCurrency(invoice.laborTotal), col2, finalY + 14, { align: "right" })

  doc.setFontSize(12)
  doc.setFont("helvetica", "bold")
  doc.text("Grand Total:", col1, finalY + 24)
  doc.text(formatCurrency(invoice.grandTotal), col2, finalY + 24, { align: "right" })

  if (invoice.notes) {
    doc.setFont("helvetica", "normal")
    doc.setFontSize(9)
    doc.setTextColor(100)
    doc.text("Notes:", 14, finalY + 35)
    doc.text(invoice.notes, 14, finalY + 42)
  }

  doc.save(`${invoice.invoiceNumber}.pdf`)
}
