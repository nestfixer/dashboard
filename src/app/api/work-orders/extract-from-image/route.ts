import { NextRequest, NextResponse } from "next/server"
import Groq from "groq-sdk"

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY })

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData()
    const file = formData.get("image") as File | null
    if (!file) return NextResponse.json({ error: "No image provided" }, { status: 400 })

    const buffer = await file.arrayBuffer()
    const base64 = Buffer.from(buffer).toString("base64")
    const mimeType = file.type || "image/jpeg"

    const completion = await groq.chat.completions.create({
      model: "meta-llama/llama-4-scout-17b-16e-instruct",
      messages: [
        {
          role: "user",
          content: [
            {
              type: "image_url",
              image_url: { url: `data:${mimeType};base64,${base64}` },
            },
            {
              type: "text",
              text: `You are extracting work order details from a screenshot of a property maintenance or field service app.

Extract the following fields and return ONLY valid JSON (no markdown, no explanation):
{
  "title": "concise job title, max 80 chars",
  "description": "full description of the issue/work needed, preserving all important details",
  "priority": "Low | Medium | High | Urgent",
  "remarks": "any notes, troubleshooting steps, or additional context not in the description",
  "customerName": "resident or tenant full name if visible, else null",
  "customerPhone": "phone number if visible, else null",
  "customerAddress": "property address or unit address if visible, else null"
}

Priority rules:
- Urgent: safety hazard, flooding, no heat/AC, structural risk
- High: significant damage, affects habitability
- Medium: cosmetic or maintenance issues
- Low: minor cosmetic, non-urgent requests

If a field has no clear value, use null. Always return valid JSON.`,
            },
          ],
        },
      ],
      max_tokens: 1024,
    })

    const raw = completion.choices[0]?.message?.content ?? ""
    const jsonMatch = raw.match(/\{[\s\S]*\}/)
    if (!jsonMatch) return NextResponse.json({ error: "Could not parse response" }, { status: 500 })

    const extracted = JSON.parse(jsonMatch[0])
    return NextResponse.json(extracted)
  } catch (err) {
    console.error("extract-from-image error:", err)
    return NextResponse.json({ error: "Extraction failed" }, { status: 500 })
  }
}
