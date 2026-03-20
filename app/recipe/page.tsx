'use client'

import { useEffect, useState, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import RecipeView, { RecipeData } from '../components/RecipeView'

function RecipePageContent() {
  const searchParams = useSearchParams()
  const url = searchParams.get('url') ?? ''

  const [recipe, setRecipe] = useState<RecipeData | null>(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!url) {
      setError('No URL provided.')
      return
    }

    setLoading(true)
    setError('')
    setRecipe(null)

    fetch(`/api/scrape?url=${encodeURIComponent(url)}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.error) {
          setError(data.error)
        } else {
          setRecipe({ ...data, sourceUrl: url })
        }
      })
      .catch(() => {
        setError('Failed to fetch the recipe. Please check the URL and try again.')
      })
      .finally(() => setLoading(false))
  }, [url])

  if (loading) {
    return (
      <div
        style={{
          minHeight: 'calc(100vh - 60px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexDirection: 'column',
          gap: '1rem',
          color: 'var(--slate-grey)',
        }}
      >
        <div
          style={{
            width: '40px',
            height: '40px',
            border: '3px solid var(--alabaster-grey)',
            borderTopColor: 'var(--gunmetal)',
            borderRadius: '50%',
            animation: 'spin 0.8s linear infinite',
          }}
        />
        <p style={{ fontSize: '1rem' }}>Loading recipe...</p>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    )
  }

  if (error) {
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
          {error}
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

  if (!recipe) return null

  return <RecipeView recipe={recipe} />
}

const LoadingFallback = (
  <div
    style={{
      minHeight: 'calc(100vh - 60px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      color: 'var(--slate-grey)',
    }}
  >
    Loading...
  </div>
)

export default function RecipePage() {
  return <Suspense fallback={LoadingFallback}><RecipePageContent /></Suspense>
}
