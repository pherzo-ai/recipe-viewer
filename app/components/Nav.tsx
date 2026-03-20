'use client'

import Link from 'next/link'

export default function Nav() {
  return (
    <nav
      style={{
        backgroundColor: 'var(--gunmetal)',
        color: 'var(--bright-snow)',
        padding: '0 1.5rem',
        height: '60px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        position: 'sticky',
        top: 0,
        zIndex: 100,
        boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
      }}
    >
      <Link
        href="/"
        style={{
          fontSize: '1.2rem',
          fontWeight: 700,
          color: 'var(--bright-snow)',
          letterSpacing: '-0.01em',
          textDecoration: 'none',
        }}
      >
        Recipe Viewer
      </Link>
      <Link
        href="/saved"
        style={{
          fontSize: '0.95rem',
          color: 'var(--pale-slate)',
          textDecoration: 'none',
          padding: '0.4rem 0.9rem',
          borderRadius: '6px',
          border: '1px solid var(--iron-grey)',
          transition: 'color 0.15s, border-color 0.15s',
        }}
        onMouseEnter={(e) => {
          const el = e.currentTarget
          el.style.color = 'var(--bright-snow)'
          el.style.borderColor = 'var(--pale-slate)'
        }}
        onMouseLeave={(e) => {
          const el = e.currentTarget
          el.style.color = 'var(--pale-slate)'
          el.style.borderColor = 'var(--iron-grey)'
        }}
      >
        Saved Recipes
      </Link>
    </nav>
  )
}
