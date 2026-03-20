import { NextRequest, NextResponse } from 'next/server'
import * as cheerio from 'cheerio'

interface RecipeData {
  title: string
  ingredients: string[]
  instructions: string[]
  servings?: string
  prepTime?: string
  cookTime?: string
  imageUrl?: string
}

function formatDuration(iso: string): string {
  const match = iso.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/)
  if (!match) return iso
  const h = match[1] ? `${match[1]}h ` : ''
  const m = match[2] ? `${match[2]}m` : ''
  const s = match[3] && !h && !m ? `${match[3]}s` : ''
  return (h + m + s).trim() || iso
}

function extractFromJsonLd(html: string): RecipeData | null {
  const $ = cheerio.load(html)
  let recipe: RecipeData | null = null

  $('script[type="application/ld+json"]').each((_, el) => {
    if (recipe) return
    try {
      const raw = $(el).html() ?? ''
      const json = JSON.parse(raw)

      const candidates = Array.isArray(json)
        ? json
        : json['@graph']
        ? json['@graph']
        : [json]

      for (const item of candidates) {
        const type = item['@type']
        const isRecipe =
          type === 'Recipe' ||
          (Array.isArray(type) && type.includes('Recipe'))
        if (!isRecipe) continue

        const ingredients: string[] = (item.recipeIngredient ?? []).map(
          (s: string) => s.trim()
        )

        const instructionRaw = item.recipeInstructions ?? []
        const instructions: string[] = []
        for (const step of instructionRaw) {
          if (typeof step === 'string') {
            instructions.push(step.trim())
          } else if (step['@type'] === 'HowToSection') {
            for (const sub of step.itemListElement ?? []) {
              if (sub.text) instructions.push(sub.text.trim())
              else if (sub.name) instructions.push(sub.name.trim())
            }
          } else {
            const text = step.text ?? step.name ?? ''
            if (text) instructions.push(text.trim())
          }
        }

        const imageVal = item.image
        let imageUrl: string | undefined
        if (typeof imageVal === 'string') {
          imageUrl = imageVal
        } else if (Array.isArray(imageVal)) {
          const first = imageVal[0]
          imageUrl = typeof first === 'string' ? first : first?.url
        } else if (imageVal?.url) {
          imageUrl = imageVal.url
        }

        const servings =
          item.recipeYield
            ? Array.isArray(item.recipeYield)
              ? item.recipeYield[0]
              : String(item.recipeYield)
            : undefined

        recipe = {
          title: item.name ?? 'Recipe',
          ingredients,
          instructions,
          prepTime: item.prepTime ? formatDuration(item.prepTime) : undefined,
          cookTime: item.cookTime ? formatDuration(item.cookTime) : undefined,
          servings,
          imageUrl,
        }
        break
      }
    } catch {
      // malformed JSON-LD, skip
    }
  })

  return recipe
}

function extractHeuristic(html: string, url: string): RecipeData {
  const $ = cheerio.load(html)

  // Title
  const title =
    $('h1').first().text().trim() ||
    $('title').text().replace(/[\-|–].*/u, '').trim() ||
    'Recipe'

  // Image: og:image or first large img
  const imageUrl =
    $('meta[property="og:image"]').attr('content') ||
    $('meta[name="twitter:image"]').attr('content') ||
    undefined

  // Ingredients heuristic: look for lists near elements with "ingredient" in class/id
  const ingredients: string[] = []
  const ingSelectors = [
    '[class*="ingredient"] li',
    '[id*="ingredient"] li',
    '[class*="Ingredient"] li',
    '.wprm-recipe-ingredient',
    '.tasty-recipe-ingredients li',
    '.recipe-ingredients li',
  ]
  for (const sel of ingSelectors) {
    $(sel).each((_, el) => {
      const text = $(el).text().trim()
      if (text) ingredients.push(text)
    })
    if (ingredients.length > 0) break
  }

  // Instructions heuristic
  const instructions: string[] = []
  const instSelectors = [
    '[class*="instruction"] li',
    '[id*="instruction"] li',
    '[class*="direction"] li',
    '[id*="direction"] li',
    '[class*="step"] li',
    '.wprm-recipe-instruction-text',
    '.tasty-recipe-instructions li',
    '.recipe-directions li',
  ]
  for (const sel of instSelectors) {
    $(sel).each((_, el) => {
      const text = $(el).text().trim()
      if (text) instructions.push(text)
    })
    if (instructions.length > 0) break
  }

  return { title, ingredients, instructions, imageUrl }
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const url = searchParams.get('url')

  if (!url) {
    return NextResponse.json({ error: 'Missing url parameter.' }, { status: 400 })
  }

  let parsedUrl: URL
  try {
    parsedUrl = new URL(url)
  } catch {
    return NextResponse.json({ error: 'Invalid URL.' }, { status: 400 })
  }

  if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
    return NextResponse.json({ error: 'Only http and https URLs are supported.' }, { status: 400 })
  }

  let html: string
  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
      },
      signal: AbortSignal.timeout(15000),
    })

    if (!response.ok) {
      return NextResponse.json(
        { error: `Could not fetch the page (HTTP ${response.status}).` },
        { status: 502 }
      )
    }

    html = await response.text()
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    return NextResponse.json(
      { error: `Failed to fetch the URL: ${msg}` },
      { status: 502 }
    )
  }

  const jsonLdResult = extractFromJsonLd(html)
  const recipe = jsonLdResult ?? extractHeuristic(html, url)

  if (recipe.ingredients.length === 0 && recipe.instructions.length === 0) {
    return NextResponse.json(
      {
        error:
          "We couldn't find recipe content on this page. Make sure it's a recipe URL.",
      },
      { status: 422 }
    )
  }

  return NextResponse.json(recipe)
}
