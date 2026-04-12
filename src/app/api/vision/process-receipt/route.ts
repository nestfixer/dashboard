import { GoogleGenerativeAI } from "@google/generative-ai"
import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"

// Initialize Gemini with API Key from environment
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY || "")

export async function POST(req: NextRequest) {
  // 1. Authenticate user
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const { imageBase64 } = await req.json()
    if (!imageBase64) {
      return NextResponse.json({ error: "Image data is required" }, { status: 400 })
    }

    // 2. Setup Gemini Model
    const model = genAI.getGenerativeModel({ 
      model: "gemini-1.5-flash",
      generationConfig: {
        responseMimeType: "application/json",
      }
    })

    const prompt = `
      You are a specialized parser for hardware and construction material receipts. 
      Identify and extract material line items from this image. 
      For each item, provide:
      - name: A specific, clear name for the material (e.g., "Steel Tote Bracket", "27gal Storage Tote")
      - quantity: The numerical amount purchased (default to 1 if unclear)
      - unitCost: The cost for a single unit of this item
      
      Rules:
      1. Ignore sales tax, discounts, and total line items.
      2. Return a JSON array of objects.
      3. Use the keys: "name", "quantity", "unitCost".
    `

    // 3. Generate Content
    const result = await model.generateContent([
      {
        inlineData: {
          data: imageBase64,
          mimeType: "image/jpeg",
        },
      },
      prompt,
    ])

    const response = await result.response
    const text = response.text()
    
    // 4. Parse JSON - Gemini with responseMimeType should return clean JSON
    try {
      const items = JSON.parse(text)
      return NextResponse.json(items)
    } catch (parseError) {
      console.error("JSON Parse Error:", text)
      // Fallback: try to find JSON block if it failed
      const jsonMatch = text.match(/\[.*\]/s)
      if (jsonMatch) {
        return NextResponse.json(JSON.parse(jsonMatch[0]))
      }
      throw new Error("Invalid response format from AI")
    }

  } catch (error) {
    console.error("Error processing receipt:", error)
    return NextResponse.json({ 
      error: "Failed to process image", 
      details: error instanceof Error ? error.message : "Unknown error" 
    }, { status: 500 })
  }
}
