import { useState, useId, useRef } from 'react'
import { Eye, EyeOff, ExternalLink, AlertCircle, ArrowRight, Loader2 } from 'lucide-react'
import { PeekabooBrand } from './PeekabooBrand'
import { cn } from '../lib/utils'

export function TokenSetup({ onTokenSave }) {
  const [token, setToken]             = useState('')
  const [showToken, setShowToken]     = useState(false)
  const [error, setError]             = useState(null)
  const [saving, setSaving]           = useState(false)

  const inputId  = useId()
  const errorId  = useId()
  const inputRef = useRef(null)

  async function handleSubmit(e) {
    e.preventDefault()
    setError(null)

    const trimmed = token.trim()
    if (!trimmed) {
      setError('Please enter your Figma personal access token.')
      inputRef.current?.focus()
      return
    }

    // Basic format check — Figma PATs are long alphanumeric strings
    if (trimmed.length < 20) {
      setError("That doesn\u2019t look like a valid Figma token. Please check and try again.")
      inputRef.current?.focus()
      return
    }

    setSaving(true)
    // Brief delay so the loading state is perceptible
    await new Promise((r) => setTimeout(r, 600))
    onTokenSave(trimmed)
  }

  const hasError = !!error

  return (
    <section
      className="flex flex-col items-center justify-center px-4 py-12 min-h-[calc(100dvh-3rem)] animate-slide-up"
      aria-labelledby="setup-heading"
    >
      {/* Wordmark */}
      <div className="mb-16" aria-hidden="true">
        <PeekabooBrand fontSize="2.5rem" />
      </div>

      <div className="w-full max-w-lg">
        {/* Headline */}
        <div className="mb-8">
          <h1
            id="setup-heading"
            className="text-3xl md:text-4xl font-bold text-[#121212] leading-tight mb-3"
            style={{ fontFamily: "'DM Serif Display', serif" }}
          >
            Connect your Figma account
          </h1>
          <p className="text-[#444444] text-sm leading-relaxed">
            Peekaboo needs your Figma personal access token to read your design files.
            It's stored locally in your browser and never sent to any server.
          </p>
        </div>

        {/* How to get a token */}
        <div className="mb-8 p-4 bg-[#FAFAF9] border border-[#E2E2E2] rounded text-sm text-[#444444] leading-relaxed">
          <p className="font-medium text-[#121212] mb-2">How to get your token</p>
          <ol className="list-decimal list-inside space-y-1 text-[#767676]">
            <li>Open Figma and click your avatar (top-left)</li>
            <li>Go to <span className="font-medium text-[#444444]">Settings → Security</span></li>
            <li>Scroll to <span className="font-medium text-[#444444]">Personal access tokens</span></li>
            <li>Click <span className="font-medium text-[#444444]">Generate new token</span></li>
          </ol>
          <a
            href="https://www.figma.com/settings"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 mt-3 text-[#9B7A2F] hover:text-[#7A5E1A] transition-colors text-xs font-medium focus:outline-none focus:ring-2 focus:ring-[#9B7A2F] rounded"
          >
            Open Figma Settings
            <ExternalLink size={11} aria-hidden="true" />
            <span className="sr-only">(opens in new tab)</span>
          </a>
        </div>

        {/* Token form */}
        <form onSubmit={handleSubmit} noValidate aria-label="Figma token setup">
          <div className="flex flex-col gap-3">
            <label htmlFor={inputId} className="text-sm font-medium text-[#444444]">
              Personal access token
            </label>

            <div className="relative">
              <input
                ref={inputRef}
                id={inputId}
                type={showToken ? 'text' : 'password'}
                value={token}
                onChange={(e) => {
                  setToken(e.target.value)
                  if (error) setError(null)
                }}
                placeholder="figd_••••••••••••••••••••"
                autoComplete="current-password"
                spellCheck="false"
                disabled={saving}
                aria-describedby={hasError ? errorId : undefined}
                aria-invalid={hasError}
                aria-required="true"
                className={cn(
                  'w-full h-11 bg-white border rounded',
                  'pl-3 pr-10 text-sm text-[#121212] placeholder:text-[#9B9B9B]',
                  'font-mono transition-colors duration-150',
                  'focus:outline-none focus:ring-2 focus:ring-[#9B7A2F]/30 focus:border-[#9B7A2F]',
                  'disabled:opacity-50 disabled:cursor-not-allowed',
                  hasError
                    ? 'border-[#D0021B] focus:ring-[#D0021B]/20'
                    : 'border-[#C8C8C4] hover:border-[#9B9B9B]'
                )}
              />
              <button
                type="button"
                onClick={() => setShowToken((v) => !v)}
                aria-label={showToken ? 'Hide token' : 'Show token'}
                aria-pressed={showToken}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#9B9B9B] hover:text-[#444444] transition-colors focus:outline-none focus:ring-2 focus:ring-[#9B7A2F] rounded"
              >
                {showToken
                  ? <EyeOff size={15} aria-hidden="true" />
                  : <Eye    size={15} aria-hidden="true" />
                }
              </button>
            </div>

            {/* Error */}
            {hasError && (
              <div
                id={errorId}
                role="alert"
                aria-live="assertive"
                className="flex items-start gap-2 text-sm text-[#D0021B] animate-fade-in"
              >
                <AlertCircle size={14} className="mt-0.5 flex-shrink-0" aria-hidden="true" />
                <span>{error}</span>
              </div>
            )}

            {/* CTA */}
            <button
              type="submit"
              disabled={saving || !token.trim()}
              className={cn(
                'h-11 px-5 rounded font-medium text-sm mt-1',
                'flex items-center justify-center gap-2',
                'bg-[#9B7A2F] text-white',
                'transition-all duration-150',
                'hover:bg-[#7A5E1A] focus:outline-none focus:ring-2 focus:ring-[#9B7A2F] focus:ring-offset-2',
                'disabled:opacity-40 disabled:cursor-not-allowed',
                'active:scale-[0.98]'
              )}
              aria-label={saving ? 'Saving token, please wait…' : 'Save token and continue'}
            >
              {saving ? (
                <>
                  <Loader2 size={14} className="animate-spin" aria-hidden="true" />
                  <span>Connecting…</span>
                </>
              ) : (
                <>
                  <span>Save &amp; Continue</span>
                  <ArrowRight size={14} aria-hidden="true" />
                </>
              )}
            </button>
          </div>
        </form>

        {/* Helper */}
        <p className="text-xs text-[#9B9B9B] mt-4 text-center leading-relaxed">
          Your token is saved locally and only used to read your Figma files.
        </p>
      </div>
    </section>
  )
}
