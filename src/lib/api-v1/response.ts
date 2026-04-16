import { NextResponse } from "next/server"

export interface PaginationMeta {
  page: number
  perPage: number
  total: number
}

export function apiSuccess<T>(data: T, meta?: PaginationMeta | null): NextResponse {
  return NextResponse.json({ data, meta: meta ?? null, error: null })
}

export function apiError(
  code: string,
  message: string,
  status: number,
  details?: unknown
): NextResponse {
  return NextResponse.json(
    { data: null, error: { code, message, details: details ?? null } },
    { status }
  )
}
