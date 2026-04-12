import { z } from "zod"

export const InvoiceStatusSchema = z.enum(["Draft", "Sent", "Paid"])

export const CreateInvoiceSchema = z.object({
  workOrderId: z.number().int().positive(),
  bufferPct: z.number().min(0).max(100).default(0),
  laborRate: z.number().min(0).default(0),
  laborHours: z.number().min(0).default(0),
  notes: z.string().optional().nullable(),
})

export const UpdateInvoiceSchema = z.object({
  status: InvoiceStatusSchema.optional(),
  paidAt: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
})

export type CreateInvoiceInput = z.infer<typeof CreateInvoiceSchema>
export type UpdateInvoiceInput = z.infer<typeof UpdateInvoiceSchema>
