'use client'

import SaveButton from './SaveButton'

export interface RecipeData {
  title: string
  ingredients: string[]
  instructions: string[]
  servings?: string
  prepTime?: string
  cookTime?: string
  imageUrl?: string
  sourceUrl?: string
  savedAt?: string
}

interface RecipeViewProps {
  recipe: RecipeData
}

export default function RecipeView({ recipe }: RecipeViewProps) {
  const { title, ingredients, instructions, servings, prepTime, cookTime, imageUrl } = recipe

  const hasMeta = servings || prepTime || cookTime

  return (
    <article
      style={{
        maxWidth: '760px',
        margin: '0 auto',
        padding: '2rem 1.5rem 4rem',
      }}
    >
      {/* Header */}
      <header style={{ marginBottom: '1.5rem' }}>
        <h1
          style={{
            fontSize: 'clamp(1.6rem, 4vw, 2.4rem)',
            fontWeight: 800,
            color: 'var(--carbon-black)',
            lineHeight: 1.2,
            marginBottom: '1rem',
          }}
        >
          {title}
        </h1>

        {hasMeta && (
          <div
            style={{
              display: 'flex',
              gap: '1.5rem',
              flexWrap: 'wrap',
              marginBottom: '1rem',
            }}
          >
            {servings && (
              <MetaItem label="Servings" value={servings} />
            )}
            {prepTime && (
              <MetaItem label="Prep Time" value={prepTime} />
            )}
            {cookTime && (
              <MetaItem label="Cook Time" value={cookTime} />
            )}
          </div>
        )}

        <SaveButton recipe={recipe} />
      </header>

      {/* Image */}
      {imageUrl && (
        <div
          style={{
            borderRadius: '12px',
            overflow: 'hidden',
            marginBottom: '2rem',
            maxHeight: '420px',
            backgroundColor: 'var(--platinum)',
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={imageUrl}
            alt={title}
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
            }}
          />
        </div>
      )}

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: '2rem',
          alignItems: 'start',
        }}
      >
        {/* Ingredients */}
        {ingredients.length > 0 && (
          <section>
            <SectionHeading>Ingredients</SectionHeading>
            <ul
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '0.5rem',
              }}
            >
              {ingredients.map((ingredient, i) => (
                <li
                  key={i}
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '0.6rem',
                    padding: '0.5rem 0',
                    borderBottom: '1px solid var(--alabaster-grey)',
                    fontSize: '0.97rem',
                    lineHeight: 1.5,
                    color: 'var(--iron-grey)',
                  }}
                >
                  <span
                    style={{
                      width: '6px',
                      height: '6px',
                      borderRadius: '50%',
                      backgroundColor: 'var(--slate-grey)',
                      marginTop: '0.5rem',
                      flexShrink: 0,
                    }}
                  />
                  {ingredient}
                </li>
              ))}
            </ul>
          </section>
        )}

        {/* Instructions */}
        {instructions.length > 0 && (
          <section>
            <SectionHeading>Instructions</SectionHeading>
            <ol
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '1rem',
              }}
            >
              {instructions.map((step, i) => (
                <li
                  key={i}
                  style={{
                    display: 'flex',
                    gap: '1rem',
                    alignItems: 'flex-start',
                  }}
                >
                  <span
                    style={{
                      flexShrink: 0,
                      width: '28px',
                      height: '28px',
                      borderRadius: '50%',
                      backgroundColor: 'var(--gunmetal)',
                      color: 'var(--bright-snow)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '0.8rem',
                      fontWeight: 700,
                      marginTop: '0.1rem',
                    }}
                  >
                    {i + 1}
                  </span>
                  <p
                    style={{
                      fontSize: '0.97rem',
                      lineHeight: 1.7,
                      color: 'var(--iron-grey)',
                      margin: 0,
                    }}
                  >
                    {step}
                  </p>
                </li>
              ))}
            </ol>
          </section>
        )}
      </div>
    </article>
  )
}

function SectionHeading({ children }: { children: React.ReactNode }) {
  return (
    <h2
      style={{
        fontSize: '1.15rem',
        fontWeight: 700,
        color: 'var(--gunmetal)',
        marginBottom: '1rem',
        paddingBottom: '0.5rem',
        borderBottom: '2px solid var(--gunmetal)',
        textTransform: 'uppercase',
        letterSpacing: '0.05em',
      }}
    >
      {children}
    </h2>
  )
}

function MetaItem({ label, value }: { label: string; value: string }) {
  return (
    <div
      style={{
        backgroundColor: 'var(--platinum)',
        borderRadius: '8px',
        padding: '0.5rem 0.9rem',
        display: 'flex',
        flexDirection: 'column',
        gap: '0.1rem',
      }}
    >
      <span
        style={{
          fontSize: '0.7rem',
          fontWeight: 700,
          textTransform: 'uppercase',
          letterSpacing: '0.08em',
          color: 'var(--slate-grey)',
        }}
      >
        {label}
      </span>
      <span
        style={{
          fontSize: '0.95rem',
          fontWeight: 600,
          color: 'var(--carbon-black)',
        }}
      >
        {value}
      </span>
    </div>
  )
}
