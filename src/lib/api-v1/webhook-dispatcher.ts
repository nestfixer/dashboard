import { createHmac } from "crypto"
import { prisma } from "@/lib/prisma"

async function deliver(
  webhookId: number,
  url: string,
  secret: string,
  event: string,
  payload: object,
  attempt: number
): Promise<void> {
  const body = JSON.stringify({ event, data: payload, timestamp: new Date().toISOString() })
  const signature = createHmac("sha256", secret).update(body).digest("hex")

  let statusCode: number | null = null
  let lastError: string | null = null

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Webhook-Signature": `sha256=${signature}`,
        "X-Webhook-Event": event,
      },
      body,
      signal: AbortSignal.timeout(10_000),
    })
    statusCode = res.status
    if (!res.ok) lastError = `HTTP ${res.status}`
  } catch (err) {
    lastError = err instanceof Error ? err.message : String(err)
  }

  await prisma.webhookDelivery.create({
    data: {
      webhookId,
      event,
      payload: payload as object,
      statusCode,
      attempts: attempt,
      lastError,
      deliveredAt: statusCode && statusCode < 300 ? new Date() : null,
    },
  })

  if (statusCode && statusCode < 300) return

  const delays = [2_000, 10_000, 30_000]
  if (attempt < delays.length) {
    await new Promise((r) => setTimeout(r, delays[attempt - 1]))
    await deliver(webhookId, url, secret, event, payload, attempt + 1)
  }
}

export function dispatchWebhook(event: string, payload: object, apiKeyId: number): void {
  prisma.webhook
    .findMany({ where: { apiKeyId, active: true, events: { has: event } } })
    .then((webhooks) => {
      for (const wh of webhooks) {
        deliver(wh.id, wh.url, wh.secret, event, payload, 1).catch(() => {})
      }
    })
    .catch(() => {})
}
