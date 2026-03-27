import { useState, useId, useRef, useEffect } from 'react'
import { Link, Loader2, ArrowRight, AlertCircle, KeyRound } from 'lucide-react'
import { parseFigmaUrl } from '../lib/figmaAnalyzer'
import { cn } from '../lib/utils'
import { PeekabooBrand } from './PeekabooBrand'

export function UrlInput({ onScan, isLoading, error, isTokenError, prefillUrl, onUpdateToken }) {
  const [url, setUrl] = useState(() => prefillUrl || '')
  const [validationError, setValidationError] = useState(null)
  const [shakeInput, setShakeInput] = useState(false)
  const inputId = useId()
  const errorId = useId()
  const tokenErrorId = useId()
  const inputRef = useRef(null)
  const tokenErrorRef = useRef(null)

  // Shake the input and focus the error banner when token error appears
  useEffect(() => {
    if (!isTokenError) return
    setShakeInput(true)
    const t = setTimeout(() => setShakeInput(false), 300)
    // Defer focus so the element is in the DOM
    const f = setTimeout(() => tokenErrorRef.current?.focus(), 50)
    return () => { clearTimeout(t); clearTimeout(f) }
  }, [isTokenError])

  function handleSubmit(e) {
    e.preventDefault()
    setValidationError(null)

    const trimmed = url.trim()
    if (!trimmed) {
      setValidationError('Please enter a Figma file URL.')
      inputRef.current?.focus()
      return
    }

    const parsed = parseFigmaUrl(trimmed)
    if (!parsed) {
      setValidationError(
        "That doesn't look like a valid Figma URL. It should contain /design/ or /file/ followed by a file key."
      )
      inputRef.current?.focus()
      return
    }

    onScan(trimmed, parsed)
  }

  // Token errors have their own dedicated UI; regular errors use the inline display
  const displayError = validationError || (!isTokenError ? error : null)
  const hasError = !!displayError

  return (
    <section
      className="flex flex-col items-center justify-center px-6 py-12 min-h-[calc(100dvh-3rem)] animate-slide-up"
      aria-labelledby="scan-heading"
    >
      {/* Wordmark */}
      <div className="mb-24" aria-hidden="true">
        <PeekabooBrand fontSize="3.25rem" />
      </div>

      {/* Headline */}
      <div className="text-center max-w-2xl mb-16">
        <h1
          id="scan-heading"
          className="text-4xl md:text-5xl font-bold text-[#121212] leading-tight mb-4"
          style={{ fontFamily: "'DM Serif Display', serif", letterSpacing: '-0.01em' }}
        >
          What your design is{' '}
          <em className="not-italic text-[#9B7A2F]">hiding</em><span className="text-[#121212]">.</span>
        </h1>
        <p className="text-[#444444] text-base leading-relaxed">
          Paste your Figma URL and get a full accessibility report in seconds.
        </p>
      </div>

      {/* URL form */}
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-xl"
        noValidate
        aria-label="Accessibility scanner"
      >
        <div className="flex flex-col gap-3">
          <label
            htmlFor={inputId}
            className="text-sm font-medium text-[#444444]"
          >
            Figma file URL
          </label>

          <div className="flex gap-2">
            <div className="relative flex-1">
              <div
                className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
                aria-hidden="true"
              >
                <Link size={14} className="text-[#9B9B9B]" />
              </div>
              <input
                ref={inputRef}
                id={inputId}
                type="url"
                value={url}
                onChange={(e) => {
                  setUrl(e.target.value)
                  if (validationError) setValidationError(null)
                }}
                placeholder="https://www.figma.com/design/..."
                className={cn(
                  'w-full h-11 bg-white border rounded',
                  'pl-9 pr-3 text-sm text-[#121212] placeholder:text-[#9B9B9B]',
                  'transition-colors duration-150',
                  'focus:outline-none focus:ring-2 focus:ring-[#9B7A2F]/30 focus:border-[#9B7A2F]',
                  hasError
                    ? 'border-[#D0021B] focus:ring-[#D0021B]/30'
                    : 'border-[#C8C8C4] hover:border-[#9B9B9B]',
                  shakeInput && 'animate-shake'
                )}
                aria-describedby={
                  hasError ? errorId : isTokenError ? tokenErrorId : undefined
                }
                aria-invalid={hasError || undefined}
                aria-required="true"
                autoComplete="url"
                spellCheck="false"
                disabled={isLoading}
              />
            </div>

            <button
              type="submit"
              disabled={isLoading || !url.trim()}
              className={cn(
                'h-11 px-5 rounded font-medium text-sm',
                'flex items-center gap-2 flex-shrink-0',
                'bg-[#9B7A2F] text-white',
                'transition-all duration-150',
                'hover:bg-[#7A5E1A] focus:outline-none focus:ring-2 focus:ring-[#9B7A2F] focus:ring-offset-2',
                'disabled:opacity-40 disabled:cursor-not-allowed',
                'active:scale-[0.98]'
              )}
              aria-label={isLoading ? 'Scanning, please wait…' : 'Scan for accessibility issues'}
            >
              {isLoading ? (
                <>
                  <Loader2 size={14} className="animate-spin" aria-hidden="true" />
                  <span>Scanning…</span>
                </>
              ) : (
                <>
                  <span>Scan</span>
                  <ArrowRight size={14} aria-hidden="true" />
                </>
              )}
            </button>
          </div>

          {/* Validation / generic API error */}
          {hasError && (
            <div
              id={errorId}
              role="alert"
              aria-live="assertive"
              className="flex items-start gap-2 text-sm text-[#D0021B] animate-fade-in"
            >
              <AlertCircle size={14} className="mt-0.5 flex-shrink-0" aria-hidden="true" />
              <span>{displayError}</span>
            </div>
          )}

          {/* Token expired / invalid error */}
          {isTokenError && (
            <div
              ref={tokenErrorRef}
              id={tokenErrorId}
              role="alert"
              aria-live="assertive"
              tabIndex={-1}
              className="flex items-center justify-between gap-3 px-3 py-2.5 bg-[#FDF8EE] border border-[#E8D5A0] rounded animate-fade-in focus:outline-none"
            >
              <div className="flex items-center gap-2 min-w-0">
                <KeyRound size={13} className="text-[#9B7A2F] flex-shrink-0" aria-hidden="true" />
                <p className="text-sm text-[#7A5E1A] leading-snug">
                  Your Figma token has expired or is invalid.
                </p>
              </div>
              <button
                type="button"
                onClick={onUpdateToken}
                className={cn(
                  'flex-shrink-0 h-7 px-3 rounded text-xs font-medium',
                  'bg-[#9B7A2F] text-white whitespace-nowrap',
                  'transition-all duration-150',
                  'hover:bg-[#7A5E1A] active:scale-[0.98]',
                  'focus:outline-none focus:ring-2 focus:ring-[#9B7A2F] focus:ring-offset-2 focus:ring-offset-[#FDF8EE]'
                )}
              >
                Update token →
              </button>
            </div>
          )}
        </div>
      </form>

      {/* Demo link */}
      <div className="mt-5 mb-24 text-center">
        <p className="text-xs text-[#767676]">
          Don't have a file? Try the{' '}
          <button
            type="button"
            onClick={() => onScan('__demo__', null)}
            className="text-[#9B7A2F] hover:text-[#7A5E1A] underline underline-offset-2 transition-colors focus:outline-none focus:ring-2 focus:ring-[#9B7A2F] rounded"
          >
            interactive demo
          </button>
        </p>
      </div>

      {/* Thin rule */}
      <div className="w-full max-w-xl h-px bg-[#E2E2E2] mb-8" aria-hidden="true" />

      {/* Feature pills */}
      <ul
        className="flex flex-wrap gap-2 justify-center list-none p-0 m-0"
        aria-label="Accessibility checks performed by Peekaboo"
      >
        {[
          'WCAG 2.1 AA Standard',
          'Contrast Checker',
          'Touch Targets',
          'Readable Text',
          'ADA Ready',
        ].map((item) => (
          <li
            key={item}
            className="text-xs px-3 py-1.5 rounded-full border border-[#E2E2E2] text-[#444444] bg-[#FAFAF9]"
          >
            {item}
          </li>
        ))}
      </ul>
    </section>
  )
}
