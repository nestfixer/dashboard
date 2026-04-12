import { prisma } from "./prisma"

export async function exportBackup() {
  const [
    users,
    customers,
    workOrders,
    materials,
    workOrderImages,
    comments,
    timeEntries,
    invoices,
    invoiceLines,
    calendarEditRequests,
  ] = await Promise.all([
    prisma.user.findMany(),
    prisma.customer.findMany(),
    prisma.workOrder.findMany(),
    prisma.material.findMany(),
    prisma.workOrderImage.findMany(),
    prisma.comment.findMany(),
    prisma.timeEntry.findMany(),
    prisma.invoice.findMany(),
    prisma.invoiceLine.findMany(),
    prisma.calendarEditRequest.findMany(),
  ])

  return {
    version: "1.0",
    exportedAt: new Date().toISOString(),
    data: {
      users,
      customers,
      workOrders,
      materials,
      workOrderImages,
      comments,
      timeEntries,
      invoices,
      invoiceLines,
      calendarEditRequests,
    },
  }
}

export async function importBackup(backup: ReturnType<typeof exportBackup> extends Promise<infer T> ? T : never) {
  const { data } = backup

  await prisma.$transaction(async (tx) => {
    // Delete in reverse FK order
    await tx.calendarEditRequest.deleteMany()
    await tx.invoiceLine.deleteMany()
    await tx.invoice.deleteMany()
    await tx.timeEntry.deleteMany()
    await tx.comment.deleteMany()
    await tx.workOrderImage.deleteMany()
    await tx.material.deleteMany()
    await tx.workOrder.deleteMany()
    await tx.customer.deleteMany()
    await tx.user.deleteMany()

    // Re-insert in FK order
    if (data.users.length) await tx.user.createMany({ data: data.users })
    if (data.customers.length) await tx.customer.createMany({ data: data.customers })
    if (data.workOrders.length) await tx.workOrder.createMany({ data: data.workOrders })
    if (data.materials.length) await tx.material.createMany({ data: data.materials })
    if (data.workOrderImages.length) await tx.workOrderImage.createMany({ data: data.workOrderImages })
    if (data.comments.length) await tx.comment.createMany({ data: data.comments })
    if (data.timeEntries.length) await tx.timeEntry.createMany({ data: data.timeEntries })
    if (data.invoices.length) await tx.invoice.createMany({ data: data.invoices })
    if (data.invoiceLines.length) await tx.invoiceLine.createMany({ data: data.invoiceLines })
    if (data.calendarEditRequests.length) await tx.calendarEditRequest.createMany({ data: data.calendarEditRequests })
  })
}
