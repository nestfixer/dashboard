import { NextRequest, NextResponse } from "next/server"
import { requireApiKey } from "./auth"
import { rateLimit } from "./rate-limit"
import { apiError } from "./response"
import { ApiError } from "./errors"
import { parsePagination } from "./pagination"

type Permission = "read" | "write" | "webhooks"

export interface V1Context {
  apiKey: Awaited<ReturnType<typeof requireApiKey>>["apiKey"]
  userId: number
  pagination: ReturnType<typeof parsePagination>
}

type V1Handler = (ctx: V1Context, request: NextRequest) => Promise<NextResponse>

export function withApiV1(handler: V1Handler, options: { permission: Permission }) {
  return async (request: NextRequest): Promise<NextResponse> => {
    try {
      const { apiKey, userId } = await requireApiKey(request)

      const hasPermission =
        apiKey.permissions.includes(options.permission) ||
        apiKey.permissions.includes("write")

      if (!hasPermission) {
        return apiError("FORBIDDEN", "Insufficient permissions for this operation", 403)
      }

      const { limited, remaining, resetAt } = rateLimit(String(apiKey.id))

      if (limited) {
        const retryAfter = Math.ceil((resetAt - Date.now()) / 1000)
        return new NextResponse(
          JSON.stringify({
            data: null,
            error: { code: "RATE_LIMITED", message: "Rate limit exceeded", details: null },
          }),
          {
            status: 429,
            headers: {
              "Content-Type": "application/json",
              "X-RateLimit-Limit": "100",
              "X-RateLimit-Remaining": "0",
              "Retry-After": String(retryAfter),
            },
          }
        )
      }

      const pagination = parsePagination(request)
      const response = await handler({ apiKey, userId, pagination }, request)

      response.headers.set("X-RateLimit-Limit", "100")
      response.headers.set("X-RateLimit-Remaining", String(remaining))

      return response
    } catch (err) {
      if (err instanceof ApiError) {
        return apiError(err.code, err.message, err.status, err.details)
      }
      console.error("[API v1]", err)
      return apiError("INTERNAL_ERROR", "An unexpected error occurred", 500)
    }
  }
}
