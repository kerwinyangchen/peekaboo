import { useState, useEffect, useRef, useId } from 'react'
import { Eye, EyeOff, AlertCircle, X, Settings } from 'lucide-react'
import { cn } from '../lib/utils'

// All focusable element selectors
const FOCUSABLE = [
  'a[href]',
  'button:not([disabled])',
  'input:not([disabled])',
  'textarea:not([disabled])',
  'select:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(', ')

export function TokenSettingsModal({ isOpen, onClose, onSave, onClear }) {
  const [token, setToken]         = useState('')
  const [showToken, setShowToken] = useState(false)
  const [error, setError]         = useState(null)

  const dialogRef = useRef(null)
  const inputId   = useId()
  const errorId   = useId()

  // Reset form when opening
  useEffect(() => {
    if (isOpen) {
      setToken('')
      setShowToken(false)
      setError(null)
    }
  }, [isOpen])

  // Focus trap + Escape key + scroll lock
  useEffect(() => {
    if (!isOpen) return

    document.body.style.overflow = 'hidden'

    // Focus first focusable element
    const el = dialogRef.current
    const focusable = () => [...el.querySelectorAll(FOCUSABLE)]
    const first = focusable()[0]
    first?.focus()

    function onKeyDown(e) {
      if (e.key === 'Escape') { onClose(); return }
      if (e.key !== 'Tab') return
      const items = focusable()
      if (!items.length) return
      const last  = items[items.length - 1]
      if (e.shiftKey) {
        if (document.activeElement === items[0]) {
          e.preventDefault(); last.focus()
        }
      } else {
        if (document.activeElement === last) {
          e.preventDefault(); items[0].focus()
        }
      }
    }

    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.body.style.overflow = ''
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [isOpen, onClose])

  if (!isOpen) return null

  const hasError = !!error

  function handleSave(e) {
    e.preventDefault()
    setError(null)
    const trimmed = token.trim()
    if (!trimmed) {
      setError('Please enter a token.')
      return
    }
    if (trimmed.length < 20) {
      setError("That doesn\u2019t look like a valid Figma token.")
      return
    }
    onSave(trimmed)
    onClose()
  }

  function handleClear() {
    onClear()
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40 modal-backdrop animate-fade-in"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Dialog */}
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
        className="relative w-full max-w-md bg-white rounded border border-[#E2E2E2] shadow-elevated animate-slide-up"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-[#E2E2E2]">
          <h2
            id="modal-title"
            className="text-xl font-bold text-[#121212]"
            style={{ fontFamily: "'DM Serif Display', serif" }}
          >
            Figma Token
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close settings"
            className="text-[#9B9B9B] hover:text-[#444444] transition-colors focus:outline-none focus:ring-2 focus:ring-[#9B7A2F] rounded p-1 -mr-1"
          >
            <X size={16} aria-hidden="true" />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSave} noValidate className="px-6 py-5 space-y-4">
          <p className="text-sm text-[#767676] leading-relaxed">
            Update your Figma personal access token, or clear it to disconnect.
          </p>

          <div className="space-y-2">
            <label htmlFor={inputId} className="text-sm font-medium text-[#444444] block">
              Personal access token
            </label>
            <div className="relative">
              <input
                id={inputId}
                type={showToken ? 'text' : 'password'}
                value={token}
                onChange={(e) => {
                  setToken(e.target.value)
                  if (error) setError(null)
                }}
                placeholder="Paste new token here"
                autoComplete="current-password"
                spellCheck="false"
                aria-describedby={hasError ? errorId : undefined}
                aria-invalid={hasError}
                className={cn(
                  'w-full h-11 bg-white border rounded',
                  'pl-3 pr-10 text-sm text-[#121212] placeholder:text-[#C8C8C4]',
                  'font-mono transition-colors duration-150',
                  'focus:outline-none focus:ring-2 focus:ring-[#9B7A2F]/30 focus:border-[#9B7A2F]',
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
          </div>

          {/* Actions */}
          <div className="flex items-center justify-between pt-1 gap-3">
            <button
              type="button"
              onClick={handleClear}
              className="text-sm text-[#9B9B9B] hover:text-[#D0021B] transition-colors focus:outline-none focus:ring-2 focus:ring-[#D0021B] rounded px-2 py-1.5 -ml-2"
            >
              Clear token
            </button>

            <button
              type="submit"
              disabled={!token.trim()}
              className={cn(
                'h-10 px-5 rounded font-medium text-sm',
                'flex items-center gap-2',
                'bg-[#9B7A2F] text-white',
                'transition-all duration-150',
                'hover:bg-[#7A5E1A] focus:outline-none focus:ring-2 focus:ring-[#9B7A2F] focus:ring-offset-2',
                'disabled:opacity-40 disabled:cursor-not-allowed',
                'active:scale-[0.98]'
              )}
            >
              Save token
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// Re-export the trigger icon for use in App.jsx
export { Settings as SettingsIcon }
