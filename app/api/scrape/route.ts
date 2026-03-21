import { NextRequest, NextResponse } from 'next/server'
import { scrapeRecipe } from '../../lib/scrape'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const url = searchParams.get('url')

  if (!url) {
    return NextResponse.json({ error: 'Missing url parameter.' }, { status: 400 })
  }

  const result = await scrapeRecipe(url)

  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 502 })
  }

  return NextResponse.json(result.recipe)
}
