import { useState, useCallback, useEffect, useRef } from 'react'
import { RefreshCw, ExternalLink, Layers, Settings } from 'lucide-react'
import { UrlInput } from './components/UrlInput'
import { SummaryBar } from './components/SummaryBar'
import { ScreenReport } from './components/ScreenReport'
import { TokenSetup } from './components/TokenSetup'
import { TokenSettingsModal } from './components/TokenSettingsModal'
import { parseFigmaUrl, analyzeFigmaFile, fetchThumbnails } from './lib/figmaAnalyzer'
import { DEMO_SCREENS } from './lib/demoData'

const STATES = {
  IDLE:        'idle',
  LOADING:     'loading',
  RESULTS:     'results',
  ERROR:       'error',
  TOKEN_ERROR: 'token_error',
  NEEDS_TOKEN: 'needs_token',
}

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

export default function App() {
  const [appState, setAppState] = useState(STATES.IDLE)
  const [screens, setScreens] = useState([])
  const [error, setError] = useState(null)
  const [scannedUrl, setScannedUrl] = useState('')
  const [isDemo, setIsDemo] = useState(false)
  const [figmaCtx, setFigmaCtx] = useState(null)
  const [figmaToken, setFigmaToken] = useState(
    () => localStorage.getItem('figma_token') ?? ''
  )
  const [settingsOpen, setSettingsOpen] = useState(false)
  const pendingScanRef = useRef(null) // { url, parsed } stored when token is missing

  const handleTokenSave = useCallback((token) => {
    localStorage.setItem('figma_token', token)
    setFigmaToken(token)
    // pendingScanRef is consumed by the useEffect below once figmaToken updates
  }, [])

  const handleTokenClear = useCallback(() => {
    localStorage.removeItem('figma_token')
    setFigmaToken('')
    setAppState(STATES.IDLE)
    setScreens([])
    setError(null)
    setScannedUrl('')
    setIsDemo(false)
    setFigmaCtx(null)
  }, [])

  const handleUpdateToken = useCallback(() => {
    localStorage.removeItem('figma_token')
    setFigmaToken('')
    // Store the failed scan URL so it auto-resumes after token is saved
    if (scannedUrl) {
      const parsed = parseFigmaUrl(scannedUrl)
      pendingScanRef.current = { url: scannedUrl, parsed }
    }
    setError(null)
    setAppState(STATES.NEEDS_TOKEN)
  }, [scannedUrl])

  const handleScan = useCallback(async (url, parsed) => {
    // If no token and this isn't the demo, gate and store the pending scan
    if (url !== '__demo__' && !localStorage.getItem('figma_token')) {
      pendingScanRef.current = { url, parsed }
      setAppState(STATES.NEEDS_TOKEN)
      return
    }

    setError(null)
    setAppState(STATES.LOADING)
    setScannedUrl(url)

    if (url === '__demo__') {
      await delay(1400)
      setScreens(DEMO_SCREENS)
      setIsDemo(true)
      setFigmaCtx(null)
      setAppState(STATES.RESULTS)
      return
    }

    try {
      const token = localStorage.getItem('figma_token') ?? ''

      const res = await fetch(`https://api.figma.com/v1/files/${parsed.fileKey}`, {
        headers: { 'X-Figma-Token': token },
      })

      if (!res.ok) {
        if (res.status === 401 || res.status === 403) {
          setError('Your Figma token has expired or is invalid.')
          setAppState(STATES.TOKEN_ERROR)
          return
        }
        if (res.status === 404) throw new Error('File not found. Check the URL and ensure you have view access.')
        throw new Error(`Figma API error (${res.status}). Please try again.`)
      }

      const data = await res.json()
      const analyzed = analyzeFigmaFile(data)

      if (analyzed.length === 0) {
        throw new Error('No screens found. Make sure the file has top-level frames on at least one page.')
      }

      const nodeIds = analyzed.map((s) => s.id)
      const thumbMap = await fetchThumbnails(parsed.fileKey, nodeIds, token)
      const withThumbs = analyzed.map((s) => ({ ...s, thumbnail: thumbMap[s.id] ?? null }))

      setScreens(withThumbs)
      setIsDemo(false)
      setFigmaCtx({ fileKey: parsed.fileKey, token })
      setAppState(STATES.RESULTS)
    } catch (err) {
      setError(err.message || 'Something went wrong. Please try again.')
      setAppState(STATES.ERROR)
    }
  }, [])

  // After token is saved, auto-resume any pending scan
  useEffect(() => {
    if (!figmaToken || !pendingScanRef.current) return
    const { url, parsed } = pendingScanRef.current
    pendingScanRef.current = null
    handleScan(url, parsed)
  }, [figmaToken, handleScan])

  const handleReset = useCallback(() => {
    pendingScanRef.current = null
    setAppState(STATES.IDLE)
    setScreens([])
    setError(null)
    setScannedUrl('')
    setIsDemo(false)
    setFigmaCtx(null)
  }, [])

  return (
    <>
      <a href="#main-content" className="skip-link">
        Skip to main content
      </a>

      <TokenSettingsModal
        isOpen={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        onSave={handleTokenSave}
        onClear={handleTokenClear}
      />
      <div className="flex flex-col min-h-dvh bg-white">
        {/* Masthead — hidden on landing, shown on results/loading */}
        <header className="bg-white sticky top-0 z-40" hidden={appState === STATES.IDLE || appState === STATES.ERROR || appState === STATES.TOKEN_ERROR || appState === STATES.NEEDS_TOKEN}>
          {/* NYT-style red rule at the very top */}
          <div className="h-[3px] bg-[#9B7A2F]" aria-hidden="true" />

          <div className="border-b border-[#E2E2E2]">
            <div className="max-w-5xl mx-auto px-5 h-14 flex items-center justify-between">
              {/* Masthead brand */}
              <button
                onClick={handleReset}
                className="focus:outline-none focus:ring-2 focus:ring-[#9B7A2F] rounded"
                aria-label="Peekaboo — return to home"
              >
                <span style={{ fontFamily: "'Pacifico', cursive", fontSize: '1.4rem', lineHeight: 1, color: '#121212' }}>
                  Peekaboo
                </span>
              </button>

              {/* Right controls */}
              {appState === STATES.RESULTS && (
                <div className="flex items-center gap-3">
                  {isDemo && (
                    <span
                      className="text-xs px-2 py-0.5 rounded-sm border border-[#E2E2E2] bg-[#F5F4F1] text-[#767676] font-medium tracking-wide uppercase"
                      aria-label="Demo mode"
                    >
                      Demo
                    </span>
                  )}
                  <button
                    onClick={() => setSettingsOpen(true)}
                    className="flex items-center justify-center w-8 h-8 rounded border border-[#E2E2E2] text-[#9B9B9B] hover:text-[#444444] hover:border-[#9B9B9B] transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-[#9B7A2F]"
                    aria-label="Token settings"
                  >
                    <Settings size={13} aria-hidden="true" />
                  </button>
                  <button
                    onClick={handleReset}
                    className="flex items-center gap-1.5 text-xs text-[#767676] hover:text-[#121212] transition-colors duration-150 px-2.5 py-1.5 rounded border border-[#E2E2E2] hover:border-[#9B9B9B] focus:outline-none focus:ring-2 focus:ring-[#9B7A2F]"
                    aria-label="Start a new scan"
                  >
                    <RefreshCw size={11} aria-hidden="true" />
                    New scan
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Main */}
        <main id="main-content" className="flex-1 bg-white" tabIndex={-1}>
          {(appState === STATES.IDLE || appState === STATES.ERROR || appState === STATES.TOKEN_ERROR) && (
            <UrlInput
              onScan={handleScan}
              isLoading={false}
              error={appState === STATES.ERROR ? error : null}
              isTokenError={appState === STATES.TOKEN_ERROR}
              prefillUrl={appState === STATES.TOKEN_ERROR ? scannedUrl : ''}
              onUpdateToken={handleUpdateToken}
            />
          )}

          {appState === STATES.NEEDS_TOKEN && (
            <TokenSetup onTokenSave={handleTokenSave} />
          )}

          {appState === STATES.LOADING && <LoadingState url={scannedUrl} />}

          {appState === STATES.RESULTS && (
            <ResultsView
              screens={screens}
              scannedUrl={scannedUrl}
              isDemo={isDemo}
              figmaCtx={figmaCtx}
            />
          )}
        </main>

        {/* Footer */}
        <footer className="border-t border-[#E2E2E2] mt-auto bg-white" role="contentinfo">
          <div className="max-w-5xl mx-auto px-5 py-4 flex items-center justify-between flex-wrap gap-2">
            <p className="text-xs text-[#767676]">
              Automated accessibility checks for designers.
            </p>
            <p className="text-xs text-[#9B9B9B]">Made by Kerwin Chen with Claude</p>
          </div>
        </footer>
      </div>
    </>
  )
}

// ─── Loading State ─────────────────────────────────────────────────────────────

const ALL_FACTS = [
  { stat: '1 in 4',  body: 'adults in the US lives with a disability' },
  { stat: '#1',      body: 'Low contrast text is the most common WCAG failure on the web' },
  { stat: '8%',      body: 'of men worldwide have some form of color blindness' },
  { stat: '44pt',    body: "Apple's minimum recommended tap target size for iOS" },
  { stat: '4.5:1',   body: 'The minimum contrast ratio for normal text under WCAG 2.1 AA' },
  { stat: '71%',     body: 'of users with disabilities will leave a website that is hard to use' },
  { stat: '98%',     body: 'of the top 1 million websites have detectable WCAG failures' },
  { stat: '3:1',     body: 'The minimum contrast ratio for large text and UI components' },
  { stat: '$10M+',   body: 'estimated annual spend by Netflix on accessibility features' },
  { stat: '11pt',    body: "Apple's minimum recommended font size for mobile UI" },
  { stat: '2.5B',    body: 'people worldwide have some form of vision impairment' },
  { stat: '30%',     body: 'increase in audience reach when products are fully accessible' },
  { stat: '360°',    body: 'Accessibility benefits everyone — not just users with disabilities' },
  { stat: '2023',    body: 'The year the EU Accessibility Act becomes enforceable for digital products' },
  { stat: '15min',   body: 'Average time saved per screen when catching issues in design vs in code' },
]

const STEPS = [
  'Fetching Figma file…',
  'Extracting screens…',
  'Running contrast checks…',
  'Analyzing tap targets…',
  'Checking text sizes…',
  'Generating report…',
]

// Shuffle array (Fisher-Yates)
function shuffle(arr) {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

function LoadingState({ url }) {
  // Shuffled facts — stable for the lifetime of this loading session
  const factsRef = useRef(shuffle(ALL_FACTS))
  const [factIdx, setFactIdx]     = useState(0)
  const [phase, setPhase]         = useState('enter') // 'enter' | 'exit'
  const [activeStep, setActiveStep] = useState(0)
  const [showTip, setShowTip]     = useState(false)

  // Rotate facts every 3s
  useEffect(() => {
    const DISPLAY = 3000
    const EXIT_MS = 320

    const id = setInterval(() => {
      setPhase('exit')
      setTimeout(() => {
        setFactIdx((i) => (i + 1) % factsRef.current.length)
        setPhase('enter')
      }, EXIT_MS)
    }, DISPLAY)

    return () => clearInterval(id)
  }, [])

  // Advance steps over time
  useEffect(() => {
    const timers = STEPS.map((_, i) =>
      setTimeout(() => setActiveStep(i), i * 900)
    )
    return () => timers.forEach(clearTimeout)
  }, [])

  // Show slow-scan tip after 30s
  useEffect(() => {
    const t = setTimeout(() => setShowTip(true), 30000)
    return () => clearTimeout(t)
  }, [])

  const fact = factsRef.current[factIdx]

  return (
    <div
      className="min-h-[70vh] flex flex-col items-center justify-between px-4 py-16 animate-fade-in"
      role="status"
      aria-live="polite"
      aria-label="Scanning in progress, please wait"
    >
      {/* Fact card — center stage */}
      <div className="flex-1 flex items-center justify-center w-full">
        <div
          key={factIdx}
          className={`text-center max-w-sm ${phase === 'enter' ? 'fact-enter' : 'fact-exit'}`}
          aria-hidden="true"
        >
          {/* Rule above */}
          <div className="w-8 h-px bg-[#9B7A2F] mx-auto mb-8" />

          {/* Hero stat */}
          <p
            className="text-7xl md:text-8xl text-[#3a3a3a] leading-none mb-5"
            style={{ fontFamily: "'DM Serif Display', serif" }}
          >
            {fact.stat}
          </p>

          {/* Explanation */}
          <p className="text-[1.25rem] text-[#767676] leading-relaxed mx-auto" style={{ maxWidth: '480px' }}>
            {fact.body}
          </p>

          {/* Rule below */}
          <div className="w-8 h-px bg-[#E2E2E2] mx-auto mt-8" />
        </div>
      </div>

      {/* Steps strip — bottom */}
      <div className="w-full max-w-lg space-y-4" aria-hidden="true">
        {url !== '__demo__' && (
          <p className="text-[10px] text-[#C8C8C4] font-mono truncate text-center mb-4">{url}</p>
        )}
        <div className="flex items-center justify-center gap-0 flex-wrap">
          {STEPS.map((step, i) => {
            const isActive = i === activeStep
            const isDone   = i < activeStep
            return (
              <div key={step} className="flex items-center">
                <span
                  className="text-[11px] px-2 py-1 transition-colors duration-300"
                  style={{
                    color: isActive ? '#9B7A2F' : isDone ? '#C8C8C4' : '#D8D8D4',
                    fontWeight: isActive ? 600 : 400,
                  }}
                >
                  {step}
                </span>
                {i < STEPS.length - 1 && (
                  <span className="text-[#E2E2E2] text-[10px] select-none">·</span>
                )}
              </div>
            )
          })}
        </div>

        {/* Slow-scan tip — fades in after 30s */}
        {showTip && (
          <div className="px-4 py-3 bg-[#FDF8EE] border border-[#E8D5A0] rounded text-xs text-[#7A5E1A] leading-relaxed animate-fade-in">
            <span className="mr-1.5">💡</span>
            <span>
              <span className="font-medium">Taking a while?</span>{' '}
              Peekaboo scans every page and every screen in your Figma file. If you want faster results, try creating a new Figma file with only the screens you want to check.
            </span>
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Results View ──────────────────────────────────────────────────────────────

function ResultsView({ screens, scannedUrl, isDemo, figmaCtx }) {
  const pages = screens.reduce((acc, screen) => {
    if (!acc[screen.pageName]) acc[screen.pageName] = []
    acc[screen.pageName].push(screen)
    return acc
  }, {})
  const pageEntries = Object.entries(pages)
  const multiPage = pageEntries.length > 1

  return (
    <div className="max-w-5xl mx-auto px-5 py-10 space-y-10 animate-fade-in">
      {/* Scan header */}
      <div className="border-b border-[#E2E2E2] pb-6">
        <h1 className="font-display text-2xl font-bold text-[#121212] tracking-tight leading-tight mb-1">
          Accessibility Report
        </h1>
        <div className="flex items-start justify-between flex-wrap gap-3 mt-2">
          {isDemo ? (
            <p className="text-sm text-[#767676]">
              Demo mode — paste a real Figma URL to scan your design
            </p>
          ) : (
            <a
              href={scannedUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-[#767676] hover:text-[#9B7A2F] transition-colors flex items-center gap-1 group w-fit focus:outline-none focus:ring-2 focus:ring-[#9B7A2F] rounded"
            >
              <span className="truncate max-w-xs">{scannedUrl}</span>
              <ExternalLink size={10} className="flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" aria-hidden="true" />
              <span className="sr-only">(opens in new tab)</span>
            </a>
          )}
          <time
            className="text-xs text-[#9B9B9B] flex-shrink-0 tabular-nums"
            dateTime={new Date().toISOString()}
          >
            {new Date().toLocaleString('en-US', {
              month: 'long',
              day: 'numeric',
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
            })}
          </time>
        </div>
      </div>

      {/* Summary bar */}
      <SummaryBar screens={screens} />

      {/* Per-page groups */}
      {pageEntries.map(([pageName, pageScreens], pageIdx) => (
        <section key={pageName} aria-labelledby={`page-heading-${pageIdx}`}>
          {multiPage && (
            <div className="flex items-center gap-3 mb-5">
              <Layers size={12} className="text-[#9B9B9B] flex-shrink-0" aria-hidden="true" />
              <h2
                id={`page-heading-${pageIdx}`}
                className="text-xs font-semibold text-[#767676] uppercase tracking-widest"
              >
                {pageName}
              </h2>
              <span className="text-xs text-[#9B9B9B]">
                {pageScreens.length} screen{pageScreens.length !== 1 ? 's' : ''}
              </span>
              <div className="h-px flex-1 bg-[#E2E2E2]" aria-hidden="true" />
            </div>
          )}

          {!multiPage && (
            <h2
              id={`page-heading-${pageIdx}`}
              className="text-xs font-semibold text-[#767676] uppercase tracking-widest mb-5"
            >
              {pageScreens.length} screen{pageScreens.length !== 1 ? 's' : ''}
            </h2>
          )}

          <div className="space-y-4">
            {pageScreens.map((screen, i) => (
              <ScreenReport
                key={screen.id}
                screen={screen}
                defaultOpen={i === 0 && pageIdx === 0}
                figmaCtx={figmaCtx}
              />
            ))}
          </div>
        </section>
      ))}
    </div>
  )
}
