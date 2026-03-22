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

function decodeHtmlEntities(str: string): string {
  return str
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, ' ')
    .replace(/&#(\d+);/g, (_, code) => String.fromCharCode(Number(code)))
}

function stripTags(str: string): string {
  return str.replace(/<[^>]+>/g, '').trim()
}

function extractFromJsonLd(html: string): RecipeData | null {
  const scriptRegex =
    /<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi
  let match: RegExpExecArray | null

  while ((match = scriptRegex.exec(html)) !== null) {
    try {
      const json = JSON.parse(match[1])

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
          (s: string) => decodeHtmlEntities(stripTags(s)).trim()
        )

        const instructionRaw = item.recipeInstructions ?? []
        const instructions: string[] = []
        for (const step of instructionRaw) {
          if (typeof step === 'string') {
            instructions.push(decodeHtmlEntities(stripTags(step)).trim())
          } else if (step['@type'] === 'HowToSection') {
            for (const sub of step.itemListElement ?? []) {
              const text = sub.text ?? sub.name ?? ''
              if (text) instructions.push(decodeHtmlEntities(stripTags(text)).trim())
            }
          } else {
            const text = step.text ?? step.name ?? ''
            if (text) instructions.push(decodeHtmlEntities(stripTags(text)).trim())
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

        const servings = item.recipeYield
          ? Array.isArray(item.recipeYield)
            ? String(item.recipeYield[0])
            : String(item.recipeYield)
          : undefined

        return {
          title: decodeHtmlEntities(item.name ?? 'Recipe'),
          ingredients,
          instructions,
          prepTime: item.prepTime ? formatDuration(item.prepTime) : undefined,
          cookTime: item.cookTime ? formatDuration(item.cookTime) : undefined,
          servings,
          imageUrl,
        }
      }
    } catch {
      // malformed JSON-LD, skip
    }
  }

  return null
}

function extractMeta(html: string, property: string): string | undefined {
  const m =
    html.match(new RegExp(`<meta[^>]+property=["']${property}["'][^>]+content=["']([^"']+)["']`, 'i')) ||
    html.match(new RegExp(`<meta[^>]+content=["']([^"']+)["'][^>]+property=["']${property}["']`, 'i'))
  return m ? decodeHtmlEntities(m[1]) : undefined
}

function extractHeuristic(html: string): RecipeData {
  // Title
  const h1 = html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i)
  const titleTag = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)
  const title =
    (h1 ? decodeHtmlEntities(stripTags(h1[1])).trim() : '') ||
    (titleTag ? decodeHtmlEntities(titleTag[1]).replace(/[\-|–].*/u, '').trim() : '') ||
    'Recipe'

  const imageUrl =
    extractMeta(html, 'og:image') ||
    extractMeta(html, 'twitter:image')

  // Heuristic: find lists inside elements with "ingredient" in class/id
  const ingredients: string[] = []
  const ingBlockRe =
    /<(?:ul|ol)[^>]*(?:class|id)=["'][^"']*ingredient[^"']*["'][^>]*>([\s\S]*?)<\/(?:ul|ol)>/gi
  let blk: RegExpExecArray | null
  while ((blk = ingBlockRe.exec(html)) !== null) {
    const liRe = /<li[^>]*>([\s\S]*?)<\/li>/gi
    let li: RegExpExecArray | null
    while ((li = liRe.exec(blk[1])) !== null) {
      const text = decodeHtmlEntities(stripTags(li[1])).trim()
      if (text) ingredients.push(text)
    }
    if (ingredients.length > 0) break
  }

  // Heuristic: find lists inside elements with "instruction"/"direction"/"step" in class/id
  const instructions: string[] = []
  const instBlockRe =
    /<(?:ul|ol)[^>]*(?:class|id)=["'][^"']*(?:instruction|direction|step)[^"']*["'][^>]*>([\s\S]*?)<\/(?:ul|ol)>/gi
  while ((blk = instBlockRe.exec(html)) !== null) {
    const liRe = /<li[^>]*>([\s\S]*?)<\/li>/gi
    let li: RegExpExecArray | null
    while ((li = liRe.exec(blk[1])) !== null) {
      const text = decodeHtmlEntities(stripTags(li[1])).trim()
      if (text) instructions.push(text)
    }
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
          'sec-ch-ua': '"Chromium";v="124", "Google Chrome";v="124", "Not-A.Brand";v="99"',
          'sec-ch-ua-mobile': '?0',
          'sec-ch-ua-platform': '"Windows"',
          'sec-fetch-dest': 'document',
          'sec-fetch-mode': 'navigate',
          'sec-fetch-site': 'none',
          'sec-fetch-user': '?1',
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

  let recipe: RecipeData
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
