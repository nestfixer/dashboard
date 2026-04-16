import { NextRequest } from "next/server"
import type { PaginationMeta } from "./response"

export function parsePagination(request: NextRequest) {
  const params = request.nextUrl.searchParams
  const page = Math.max(1, parseInt(params.get("page") ?? "1") || 1)
  const perPage = Math.min(100, Math.max(1, parseInt(params.get("perPage") ?? "50") || 50))
  const skip = (page - 1) * perPage
  const take = perPage

  function buildMeta(total: number): PaginationMeta {
    return { page, perPage, total }
  }

  return { skip, take, buildMeta }
}
