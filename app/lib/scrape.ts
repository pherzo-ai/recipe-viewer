import * as cheerio from 'cheerio'

export interface RecipeData {
  title: string
  ingredients: string[]
  instructions: string[]
  servings?: string
  prepTime?: string
  cookTime?: string
  imageUrl?: string
  sourceUrl?: string
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

function extractHeuristic(html: string): RecipeData {
  const $ = cheerio.load(html)

  const title =
    $('h1').first().text().trim() ||
    $('title').text().replace(/[\-|–].*/u, '').trim() ||
    'Recipe'

  const imageUrl =
    $('meta[property="og:image"]').attr('content') ||
    $('meta[name="twitter:image"]').attr('content') ||
    undefined

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

export type ScrapeResult =
  | { ok: true; recipe: RecipeData }
  | { ok: false; error: string }

export async function scrapeRecipe(url: string): Promise<ScrapeResult> {
  let parsedUrl: URL
  try {
    parsedUrl = new URL(url)
  } catch {
    return { ok: false, error: 'Invalid URL.' }
  }

  if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
    return { ok: false, error: 'Only http and https URLs are supported.' }
  }

  let html: string
  try {
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), 20000)
    let response: Response
    try {
      response = await fetch(url, {
        headers: {
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
          Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.9',
          'Cache-Control': 'no-cache',
          'Upgrade-Insecure-Requests': '1',
        },
        redirect: 'follow',
        signal: controller.signal,
      })
    } finally {
      clearTimeout(timer)
    }

    if (!response.ok) {
      return { ok: false, error: `Could not fetch the page (HTTP ${response.status}).` }
    }

    html = await response.text()
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    return { ok: false, error: `Failed to fetch the URL: ${msg}` }
  }

  let recipe
  try {
    recipe = extractFromJsonLd(html) ?? extractHeuristic(html)
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    return { ok: false, error: `Failed to parse the page: ${msg}` }
  }

  if (recipe.ingredients.length === 0 && recipe.instructions.length === 0) {
    return {
      ok: false,
      error: "We couldn't find recipe content on this page. Make sure it's a recipe URL.",
    }
  }

  return { ok: true, recipe }
}
