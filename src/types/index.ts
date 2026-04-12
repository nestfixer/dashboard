export type WorkOrderStatus = "Pending" | "Accepted" | "Completed"
export type WorkOrderPriority = "Low" | "Medium" | "High" | "Urgent"
export type InvoiceStatus = "Draft" | "Sent" | "Paid"
export type TimeEntryType = "timer" | "manual"
export type EditRequestStatus = "Pending" | "Approved" | "Denied"
export type LineType = "material" | "labor" | "buffer" | "other"

export interface User {
  id: number
  username: string
  displayName: string
  color: string
  createdAt: string
}

export interface Customer {
  id: number
  name: string
  phone?: string | null
  email?: string | null
  address?: string | null
  notes?: string | null
  createdAt: string
  updatedAt: string
}

export interface Material {
  id: number
  workOrderId: number
  name: string
  quantity: number
  unitCost: number
  createdAt: string
}

export interface WorkOrderImage {
  id: number
  workOrderId: number
  filename: string
  originalName: string
  url: string
  uploadedAt: string
}

export interface Comment {
  id: number
  workOrderId: number
  authorId: number
  author: User
  body: string
  createdAt: string
  editedAt?: string | null
}

export interface TimeEntry {
  id: number
  workOrderId: number
  userId: number
  user: User
  entryType: TimeEntryType
  startTime?: string | null
  endTime?: string | null
  durationMins?: number | null
  date: string
  notes?: string | null
}

export interface WorkOrder {
  id: number
  title: string
  description?: string | null
  status: WorkOrderStatus
  priority: WorkOrderPriority
  dueDate?: string | null
  remarks?: string | null
  createdAt: string
  updatedAt: string
  acceptedAt?: string | null
  customerId?: number | null
  customer?: Customer | null
  createdById: number
  createdBy: User
  assignedToId?: number | null
  assignedTo?: User | null
  materials?: Material[]
  images?: WorkOrderImage[]
  comments?: Comment[]
  timeEntries?: TimeEntry[]
}

export interface InvoiceLine {
  id: number
  invoiceId: number
  description: string
  quantity: number
  unitCost: number
  lineTotal: number
  lineType: LineType
}

export interface Invoice {
  id: number
  workOrderId: number
  workOrder?: WorkOrder
  invoiceNumber: string
  status: InvoiceStatus
  bufferPct: number
  laborRate: number
  laborHours: number
  materialTotal: number
  laborTotal: number
  bufferAmount: number
  grandTotal: number
  notes?: string | null
  issuedAt: string
  paidAt?: string | null
  lines?: InvoiceLine[]
}

export interface CalendarEditRequest {
  id: number
  workOrderId: number
  workOrder?: WorkOrder
  requestedById: number
  requestedBy: User
  requestedToId: number
  requestedTo: User
  newDueDate: string
  reason?: string | null
  status: EditRequestStatus
  createdAt: string
  resolvedAt?: string | null
}

export interface DueDateStatus {
  status: "overdue" | "today" | "soon" | "normal" | null
  className: string
}
