import UrlForm from './components/UrlForm'

export default function Home() {
  return (
    <div
      style={{
        minHeight: 'calc(100vh - 60px)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '2rem 1.5rem',
        textAlign: 'center',
      }}
    >
      <div style={{ maxWidth: '560px', width: '100%' }}>
        <h1
          style={{
            fontSize: 'clamp(2rem, 6vw, 3.2rem)',
            fontWeight: 800,
            color: 'var(--carbon-black)',
            lineHeight: 1.15,
            marginBottom: '0.75rem',
            letterSpacing: '-0.02em',
          }}
        >
          Recipe Viewer
        </h1>
        <p
          style={{
            fontSize: 'clamp(1rem, 2.5vw, 1.15rem)',
            color: 'var(--slate-grey)',
            marginBottom: '2.5rem',
            lineHeight: 1.6,
          }}
        >
          Paste a recipe URL to get a clean, distraction-free view — just the
          ingredients and instructions, nothing else.
        </p>
        <div style={{ display: 'flex', justifyContent: 'center' }}>
          <UrlForm />
        </div>
      </div>
    </div>
  )
}
