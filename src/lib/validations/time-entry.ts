import { z } from "zod"

export const TimeEntryTypeSchema = z.enum(["timer", "manual"])

export const CreateTimeEntrySchema = z.object({
  entryType: TimeEntryTypeSchema.default("manual"),
  startTime: z.string().optional().nullable(),
  durationMins: z.number().int().min(1).optional().nullable(),
  date: z.string().optional(),
  notes: z.string().optional().nullable(),
})

export const UpdateTimeEntrySchema = z.object({
  endTime: z.string().optional().nullable(),
  durationMins: z.number().int().min(0).optional().nullable(),
  notes: z.string().optional().nullable(),
})

export type CreateTimeEntryInput = z.infer<typeof CreateTimeEntrySchema>
export type UpdateTimeEntryInput = z.infer<typeof UpdateTimeEntrySchema>
