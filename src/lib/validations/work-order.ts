import { z } from "zod"

export const WorkOrderStatusSchema = z.enum(["Pending", "Accepted", "Completed"])
export const WorkOrderPrioritySchema = z.enum(["Low", "Medium", "High", "Urgent"])

export const CreateWorkOrderSchema = z.object({
  title: z.string().min(1, "Title is required").max(255),
  description: z.string().optional(),
  priority: WorkOrderPrioritySchema.default("Medium"),
  dueDate: z.string().optional().nullable(),
  remarks: z.string().optional().nullable(),
  customerId: z.number().int().positive().optional().nullable(),
})

export const UpdateWorkOrderSchema = CreateWorkOrderSchema.partial().extend({
  status: WorkOrderStatusSchema.optional(),
})

export const ReassignSchema = z.object({
  assignedToId: z.number().int().positive(),
})

export type CreateWorkOrderInput = z.infer<typeof CreateWorkOrderSchema>
export type UpdateWorkOrderInput = z.infer<typeof UpdateWorkOrderSchema>
