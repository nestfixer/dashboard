import NextAuth from "next-auth"
import { authConfig } from "@/auth.config"

export default NextAuth(authConfig).auth

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/work-orders/:path*",
    "/calendar/:path*",
    "/customers/:path*",
    "/invoices/:path*",
    "/timesheets/:path*",
    "/settings/:path*",
    "/api/work-orders/:path*",
    "/api/customers/:path*",
    "/api/invoices/:path*",
    "/api/time-entries/:path*",
    "/api/calendar/:path*",
    "/api/notifications",
    "/api/backup",
  ],
}
