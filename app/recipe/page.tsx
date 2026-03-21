import Link from 'next/link'
import { scrapeRecipe } from '../lib/scrape'
import RecipeView from '../components/RecipeView'

export default async function RecipePage({
  searchParams,
}: {
  searchParams: Promise<{ url?: string }>
}) {
  const { url } = await searchParams

  if (!url) {
    return <ErrorScreen message="No URL provided." />
  }

  const result = await scrapeRecipe(url)

  if (!result.ok) {
    return <ErrorScreen message={result.error} />
  }

  return <RecipeView recipe={{ ...result.recipe, sourceUrl: url }} />
}

function ErrorScreen({ message }: { message: string }) {
  return (
    <div
      style={{
        minHeight: 'calc(100vh - 60px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '2rem 1.5rem',
        textAlign: 'center',
        flexDirection: 'column',
        gap: '1.5rem',
      }}
    >
      <p
        style={{
          fontSize: '1.05rem',
          color: 'var(--iron-grey)',
          maxWidth: '480px',
        }}
      >
        {message}
      </p>
      <Link
        href="/"
        style={{
          padding: '0.65rem 1.4rem',
          backgroundColor: 'var(--gunmetal)',
          color: 'var(--bright-snow)',
          borderRadius: '8px',
          fontWeight: 600,
          fontSize: '0.95rem',
          textDecoration: 'none',
        }}
      >
        Try Another URL
      </Link>
    </div>
  )
}
