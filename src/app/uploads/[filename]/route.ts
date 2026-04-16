import { NextResponse } from 'next/server'
import { readFile } from 'fs/promises'
import path from 'path'

export async function GET(req: Request, { params }: { params: { filename: string } }) {
  try {
    const filename = params.filename
    const filePath = path.join(process.cwd(), "public", "uploads", filename)
    
    const buffer = await readFile(filePath)
    
    let contentType = 'image/jpeg'
    if (filename.endsWith('.png')) contentType = 'image/png'
    else if (filename.endsWith('.gif')) contentType = 'image/gif'
    else if (filename.endsWith('.webp')) contentType = 'image/webp'
    else if (filename.endsWith('.svg')) contentType = 'image/svg+xml'
    
    return new NextResponse(buffer, {
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    })
  } catch (error) {
    return new NextResponse('File not found', { status: 404 })
  }
}
