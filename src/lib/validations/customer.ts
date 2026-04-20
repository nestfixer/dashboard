import { z } from "zod"

export const CreateCustomerSchema = z.object({
  name: z.string().min(1, "Name is required").max(255),
  phone: z.string().optional().nullable(),
  email: z.string().email().optional().nullable().or(z.literal("")),
  address: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
  isPropertyManagement: z.boolean().optional().default(false),
})

export const UpdateCustomerSchema = CreateCustomerSchema.partial()

export type CreateCustomerInput = z.infer<typeof CreateCustomerSchema>
export type UpdateCustomerInput = z.infer<typeof UpdateCustomerSchema>
