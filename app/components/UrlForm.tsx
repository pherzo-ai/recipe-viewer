'use client'

import { useState, FormEvent } from 'react'
import { useRouter } from 'next/navigation'

export default function UrlForm() {
  const [url, setUrl] = useState('')
  const [error, setError] = useState('')
  const router = useRouter()

  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError('')

    const trimmed = url.trim()
    if (!trimmed) {
      setError('Please enter a recipe URL.')
      return
    }

    try {
      new URL(trimmed)
    } catch {
      setError('Please enter a valid URL (e.g. https://example.com/recipe).')
      return
    }

    router.push(`/recipe?url=${encodeURIComponent(trimmed)}`)
  }

  return (
    <form onSubmit={handleSubmit} style={{ width: '100%', maxWidth: '560px' }}>
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '0.75rem',
        }}
      >
        <div
          style={{
            display: 'flex',
            gap: '0.5rem',
            flexWrap: 'wrap',
          }}
        >
          <input
            type="text"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="Paste recipe URL here..."
            style={{
              flex: '1 1 300px',
              padding: '0.75rem 1rem',
              fontSize: '1rem',
              border: '2px solid var(--alabaster-grey)',
              borderRadius: '8px',
              backgroundColor: '#fff',
              color: 'var(--carbon-black)',
              outline: 'none',
              transition: 'border-color 0.15s',
            }}
            onFocus={(e) => {
              e.currentTarget.style.borderColor = 'var(--slate-grey)'
            }}
            onBlur={(e) => {
              e.currentTarget.style.borderColor = 'var(--alabaster-grey)'
            }}
          />
          <button
            type="submit"
            style={{
              padding: '0.75rem 1.5rem',
              fontSize: '1rem',
              fontWeight: 600,
              backgroundColor: 'var(--gunmetal)',
              color: 'var(--bright-snow)',
              borderRadius: '8px',
              border: '2px solid var(--gunmetal)',
              cursor: 'pointer',
              transition: 'background-color 0.15s, color 0.15s',
              whiteSpace: 'nowrap',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'var(--carbon-black)'
              e.currentTarget.style.borderColor = 'var(--carbon-black)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'var(--gunmetal)'
              e.currentTarget.style.borderColor = 'var(--gunmetal)'
            }}
          >
            View Recipe
          </button>
        </div>
        {error && (
          <p
            style={{
              color: '#c0392b',
              fontSize: '0.875rem',
              paddingLeft: '0.25rem',
            }}
          >
            {error}
          </p>
        )}
      </div>
    </form>
  )
}
