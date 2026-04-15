import { prisma } from "@/lib/prisma"
import { requireAuth } from "@/lib/auth-helpers"
import Link from "next/link"
import { format } from "date-fns"
import { PageHeader } from "@/components/layout/PageHeader"

export default async function CustomersPage({
  searchParams,
}: {
  searchParams: { search?: string }
}) {
  await requireAuth()
  const search = searchParams.search ?? ""

  const customers = await prisma.customer.findMany({
    where: search
      ? {
          OR: [
            { name: { contains: search, mode: "insensitive" } },
            { phone: { contains: search, mode: "insensitive" } },
            { email: { contains: search, mode: "insensitive" } },
          ],
        }
      : undefined,
    orderBy: { name: "asc" },
    include: { _count: { select: { workOrders: true } } },
  })

  return (
    <div>
      <PageHeader
        title="Customers"
        action={
          <Link
            href="/customers/new"
            className="px-4 py-2 bg-accent-blue hover:bg-accent-blue/90 text-white text-sm font-medium rounded-lg transition-colors"
          >
            + New Customer
          </Link>
        }
      />

      <form className="mb-4">
        <input
          name="search"
          defaultValue={search}
          placeholder="Search by name, phone, or email…"
          className="w-full max-w-sm rounded-lg border border-border bg-card text-foreground px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent-blue placeholder:text-muted-foreground"
        />
      </form>

      <div className="bg-card rounded-xl border border-border overflow-hidden">
        <div className="overflow-x-auto">
        {customers.length === 0 ? (
          <div className="py-16 text-center flex flex-col items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center">
              <svg className="w-6 h-6 text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            <div>
              <p className="text-sm font-medium text-foreground">{search ? "No customers match your search" : "No customers yet"}</p>
              <p className="text-xs text-slate-400 mt-0.5">{search ? "Try a different name, phone, or email" : "Add your first customer to get started"}</p>
            </div>
            {!search && (
              <Link href="/customers/new" className="mt-1 px-4 py-2 bg-accent-blue hover:bg-accent-blue/90 text-white text-sm font-medium rounded-lg transition-colors">
                + New Customer
              </Link>
            )}
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-background border-b border-border">
              <tr>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wide">Name</th>
                <th className="hidden sm:table-cell text-left px-4 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wide">Phone</th>
                <th className="hidden sm:table-cell text-left px-4 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wide">Email</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wide">Work Orders</th>
                <th className="hidden sm:table-cell text-left px-4 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wide">Added</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {customers.map((c) => (
                <tr key={c.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3">
                    <Link href={`/customers/${c.id}`} className="font-medium text-foreground hover:text-accent-blue transition-colors">
                      {c.name}
                    </Link>
                    {c.address && (
                      <p className="text-xs text-slate-400 truncate max-w-xs mt-0.5">{c.address}</p>
                    )}
                  </td>
                  <td className="hidden sm:table-cell px-4 py-3 text-slate-500">{c.phone ?? <span className="text-slate-400">—</span>}</td>
                  <td className="hidden sm:table-cell px-4 py-3 text-slate-500">{c.email ?? <span className="text-slate-400">—</span>}</td>
                  <td className="px-4 py-3">
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-accent-blue/10 text-accent-blue">
                      {c._count.workOrders}
                    </span>
                  </td>
                  <td className="hidden sm:table-cell px-4 py-3 text-slate-400 text-xs">
                    {format(new Date(c.createdAt), "MMM d, yyyy")}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        </div>
      </div>
    </div>
  )
}
