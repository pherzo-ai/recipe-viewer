'use client'

import { useState, useEffect } from 'react'
import type { RecipeData } from './RecipeView'

interface SaveButtonProps {
  recipe: RecipeData
}

export default function SaveButton({ recipe }: SaveButtonProps) {
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    try {
      const stored = localStorage.getItem('savedRecipes')
      if (stored) {
        const recipes: RecipeData[] = JSON.parse(stored)
        const alreadySaved = recipes.some(
          (r) => r.sourceUrl === recipe.sourceUrl && r.title === recipe.title
        )
        setSaved(alreadySaved)
      }
    } catch {
      // ignore
    }
  }, [recipe.sourceUrl, recipe.title])

  function handleSave() {
    try {
      const stored = localStorage.getItem('savedRecipes')
      const recipes: RecipeData[] = stored ? JSON.parse(stored) : []

      if (saved) {
        // Remove it
        const updated = recipes.filter(
          (r) => !(r.sourceUrl === recipe.sourceUrl && r.title === recipe.title)
        )
        localStorage.setItem('savedRecipes', JSON.stringify(updated))
        setSaved(false)
      } else {
        // Add it
        const withTimestamp = { ...recipe, savedAt: new Date().toISOString() }
        recipes.unshift(withTimestamp)
        localStorage.setItem('savedRecipes', JSON.stringify(recipes))
        setSaved(true)
      }
    } catch {
      // ignore storage errors
    }
  }

  return (
    <button
      onClick={handleSave}
      style={{
        padding: '0.65rem 1.4rem',
        fontSize: '0.95rem',
        fontWeight: 600,
        backgroundColor: saved ? 'var(--slate-grey)' : 'var(--gunmetal)',
        color: 'var(--bright-snow)',
        borderRadius: '8px',
        border: '2px solid transparent',
        cursor: 'pointer',
        transition: 'background-color 0.15s',
        display: 'inline-flex',
        alignItems: 'center',
        gap: '0.4rem',
      }}
      onMouseEnter={(e) => {
        if (!saved) {
          e.currentTarget.style.backgroundColor = 'var(--carbon-black)'
        } else {
          e.currentTarget.style.backgroundColor = 'var(--iron-grey)'
        }
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.backgroundColor = saved
          ? 'var(--slate-grey)'
          : 'var(--gunmetal)'
      }}
    >
      {saved ? '✓ Saved' : '+ Save Recipe'}
    </button>
  )
}
