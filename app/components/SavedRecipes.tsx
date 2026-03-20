'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import type { RecipeData } from './RecipeView'

export default function SavedRecipes() {
  const [recipes, setRecipes] = useState<RecipeData[]>([])
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    try {
      const stored = localStorage.getItem('savedRecipes')
      if (stored) {
        setRecipes(JSON.parse(stored))
      }
    } catch {
      // ignore
    }
    setLoaded(true)
  }, [])

  function handleDelete(index: number) {
    const updated = recipes.filter((_, i) => i !== index)
    setRecipes(updated)
    try {
      localStorage.setItem('savedRecipes', JSON.stringify(updated))
    } catch {
      // ignore
    }
  }

  if (!loaded) {
    return (
      <div style={{ padding: '3rem 1.5rem', textAlign: 'center', color: 'var(--slate-grey)' }}>
        Loading...
      </div>
    )
  }

  if (recipes.length === 0) {
    return (
      <div
        style={{
          padding: '4rem 1.5rem',
          textAlign: 'center',
        }}
      >
        <p
          style={{
            fontSize: '1.1rem',
            color: 'var(--slate-grey)',
            marginBottom: '1.5rem',
          }}
        >
          No saved recipes yet.
        </p>
        <Link
          href="/"
          style={{
            display: 'inline-block',
            padding: '0.65rem 1.4rem',
            backgroundColor: 'var(--gunmetal)',
            color: 'var(--bright-snow)',
            borderRadius: '8px',
            fontWeight: 600,
            fontSize: '0.95rem',
            textDecoration: 'none',
          }}
        >
          Find a Recipe
        </Link>
      </div>
    )
  }

  return (
    <div
      style={{
        maxWidth: '720px',
        margin: '0 auto',
        padding: '2rem 1.5rem 4rem',
      }}
    >
      <h1
        style={{
          fontSize: 'clamp(1.4rem, 4vw, 2rem)',
          fontWeight: 800,
          color: 'var(--carbon-black)',
          marginBottom: '0.5rem',
        }}
      >
        Saved Recipes
      </h1>
      <p
        style={{
          color: 'var(--slate-grey)',
          marginBottom: '2rem',
          fontSize: '0.95rem',
        }}
      >
        {recipes.length} recipe{recipes.length !== 1 ? 's' : ''} saved
      </p>

      <ul
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '1rem',
        }}
      >
        {recipes.map((recipe, i) => (
          <li
            key={i}
            style={{
              backgroundColor: '#fff',
              border: '1px solid var(--alabaster-grey)',
              borderRadius: '10px',
              padding: '1rem 1.25rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '1rem',
            }}
          >
            <div style={{ flex: 1, minWidth: 0 }}>
              <h2
                style={{
                  fontSize: '1rem',
                  fontWeight: 700,
                  color: 'var(--carbon-black)',
                  marginBottom: '0.25rem',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}
              >
                {recipe.title}
              </h2>
              {recipe.savedAt && (
                <p
                  style={{
                    fontSize: '0.78rem',
                    color: 'var(--slate-grey)',
                    marginBottom: '0.5rem',
                  }}
                >
                  Saved {new Date(recipe.savedAt).toLocaleDateString()}
                </p>
              )}
              {recipe.sourceUrl && (
                <Link
                  href={`/recipe?url=${encodeURIComponent(recipe.sourceUrl)}`}
                  style={{
                    fontSize: '0.85rem',
                    color: 'var(--slate-grey)',
                    textDecoration: 'underline',
                    textDecorationColor: 'var(--pale-slate)',
                  }}
                >
                  View Recipe
                </Link>
              )}
            </div>

            <button
              onClick={() => handleDelete(i)}
              title="Remove from saved"
              style={{
                flexShrink: 0,
                width: '32px',
                height: '32px',
                borderRadius: '6px',
                border: '1px solid var(--alabaster-grey)',
                backgroundColor: 'transparent',
                color: 'var(--slate-grey)',
                cursor: 'pointer',
                fontSize: '1rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'background-color 0.15s, color 0.15s',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#fdecea'
                e.currentTarget.style.color = '#c0392b'
                e.currentTarget.style.borderColor = '#f5c6cb'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent'
                e.currentTarget.style.color = 'var(--slate-grey)'
                e.currentTarget.style.borderColor = 'var(--alabaster-grey)'
              }}
            >
              ×
            </button>
          </li>
        ))}
      </ul>
    </div>
  )
}
