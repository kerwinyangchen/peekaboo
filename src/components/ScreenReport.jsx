import { useState, useId, useRef, useEffect, useCallback } from 'react'
import { Filter, ChevronDown } from 'lucide-react'
import { ScoreRing } from './ScoreRing'
import { CheckItem } from './CheckItem'
import { Lightbox } from './Lightbox'
import { fetchThumbnails } from '../lib/figmaAnalyzer'
import { cn } from '../lib/utils'

const FILTER_OPTIONS = [
  { value: 'all',     label: 'All' },
  { value: 'fail',    label: 'Failed' },
  { value: 'warning', label: 'Warnings' },
  { value: 'pass',    label: 'Passed' },
]

const TYPE_LABELS = {
  contrast:    'Contrast',
  'tap-target': 'Tap',
  'text-size':  'Text',
}

function extractNodeId(checkId) {
  const dash = checkId.indexOf('-')
  return dash === -1 ? checkId : checkId.slice(dash + 1)
}

export function ScreenReport({ screen, defaultOpen = false, figmaCtx = null }) {
  const [open, setOpen]                   = useState(defaultOpen)
  const [filter, setFilter]               = useState('all')
  const [typeFilter, setTypeFilter]       = useState('all')
  const [lightboxOpen, setLightboxOpen]   = useState(false)
  const [checkThumbnails, setCheckThumbnails] = useState(null)
  const fetchedRef = useRef(false)
  const headingId  = useId()

  useEffect(() => {
    if (!open || fetchedRef.current || !figmaCtx?.fileKey || !figmaCtx?.token) return
    const failedChecks = screen.checks.filter(
      (c) => c.status === 'fail' || c.severity === 'critical'
    )
    fetchedRef.current = true
    if (!failedChecks.length) { setCheckThumbnails({}); return }
    const nodeIds = failedChecks.map((c) => c.thumbnailNodeId ?? extractNodeId(c.id))
    fetchThumbnails(figmaCtx.fileKey, nodeIds, figmaCtx.token, 2).then((thumbMap) => {
      const result = {}
      failedChecks.forEach((c) => {
        const nodeId = c.thumbnailNodeId ?? extractNodeId(c.id)
        result[c.id] = thumbMap[nodeId] ?? null
      })
      setCheckThumbnails(result)
    })
  }, [open, figmaCtx, screen.checks])

  const handleCloseLightbox = useCallback(() => setLightboxOpen(false), [])

  const filtered = screen.checks.filter((c) => {
    const statusMatch =
      filter === 'all' ||
      (filter === 'fail'    && (c.status === 'fail' || c.severity === 'critical')) ||
      (filter === 'warning' && c.severity === 'warning') ||
      (filter === 'pass'    && c.status === 'pass')
    const typeMatch = typeFilter === 'all' || c.type === typeFilter
    return statusMatch && typeMatch
  })

  const failedChecks  = screen.checks.filter((c) => c.status === 'fail' || c.severity === 'critical')
  const warningChecks = screen.checks.filter((c) => c.severity === 'warning' && c.status !== 'fail')
  const passedChecks  = screen.checks.filter((c) => c.status === 'pass' && c.severity !== 'warning')

  function getCheckThumb(check) {
    const isFailed = check.status === 'fail' || check.severity === 'critical'
    if (!isFailed || !figmaCtx) return undefined
    if (checkThumbnails === null) return 'loading'
    return checkThumbnails[check.id] ?? null
  }

  return (
    <>
      <article className="card overflow-hidden animate-slide-up" aria-labelledby={headingId}>

        {/* Card header */}
        <button
          className="w-full flex items-start gap-4 p-4 text-left hover:bg-[#FAFAF9] transition-colors duration-150"
          onClick={() => setOpen(!open)}
          aria-expanded={open}
          aria-controls={`screen-body-${screen.id}`}
        >
          {/* Thumbnail */}
          <ScreenThumbnail
            src={screen.thumbnail}
            name={screen.name}
            width={screen.width}
            height={screen.height}
            onOpenLightbox={(e) => {
              if (!screen.thumbnail) return
              e.stopPropagation()
              setLightboxOpen(true)
            }}
          />

          {/* Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span id={headingId} className="text-sm font-semibold text-[#121212] truncate">
                {screen.name}
              </span>
              <span className="text-xs px-1.5 py-px rounded-sm border border-[#E2E2E2] bg-[#F5F4F1] text-[#767676] font-medium flex-shrink-0">
                {screen.pageName}
              </span>
            </div>

            <p className="text-xs text-[#9B9B9B] mt-0.5 font-mono tabular-nums">
              {screen.width}×{screen.height}
            </p>

            <div className="flex items-center gap-2 mt-2.5 flex-wrap">
              {failedChecks.length > 0 && (
                <span className="chip-critical"><FailDot />{failedChecks.length} failed</span>
              )}
              {warningChecks.length > 0 && (
                <span className="chip-warning"><WarnDot />{warningChecks.length} warning{warningChecks.length !== 1 ? 's' : ''}</span>
              )}
              {failedChecks.length === 0 && warningChecks.length === 0 && (
                <span className="chip-pass"><PassDot />All checks pass</span>
              )}
              <span className="text-xs text-[#9B9B9B]">
                {passedChecks.length} passed · {screen.checks.length} total
              </span>
            </div>

            <MiniProgress
              failed={failedChecks.length}
              warnings={warningChecks.length}
              passed={passedChecks.length}
              total={screen.checks.length}
            />
          </div>

          {/* Score ring */}
          <div className="flex-shrink-0">
            <ScoreRing score={screen.score} size={52} />
          </div>

          {/* Chevron */}
          <ChevronDown
            size={14}
            className={cn(
              'text-[#9B9B9B] flex-shrink-0 transition-transform duration-200 mt-1',
              open && 'rotate-180'
            )}
            aria-hidden="true"
          />
        </button>

        {/* Expandable body */}
        {open && (
          <div id={`screen-body-${screen.id}`} className="border-t border-[#E2E2E2] animate-fade-in">

            {/* Filter bar */}
            <div className="flex items-center gap-2 px-4 py-2.5 border-b border-[#F0EEE9] flex-wrap bg-[#FAFAF9]">
              <Filter size={11} className="text-[#9B9B9B] flex-shrink-0" aria-hidden="true" />

              <div role="group" aria-label="Filter by status" className="flex gap-1">
                {FILTER_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => setFilter(opt.value)}
                    className={cn(
                      'text-xs px-2 py-0.5 rounded-sm transition-colors duration-150',
                      'focus:outline-none focus:ring-2 focus:ring-[#9B7A2F]',
                      filter === opt.value
                        ? 'bg-white text-[#121212] border border-[#E2E2E2] shadow-sm font-medium'
                        : 'text-[#767676] border border-transparent hover:text-[#444444]'
                    )}
                    aria-pressed={filter === opt.value}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>

              <div className="h-3 w-px bg-[#E2E2E2] mx-1" aria-hidden="true" />

              <div role="group" aria-label="Filter by type" className="flex gap-1">
                {['all', 'contrast', 'tap-target', 'text-size'].map((t) => (
                  <button
                    key={t}
                    onClick={() => setTypeFilter(t)}
                    className={cn(
                      'text-xs px-2 py-0.5 rounded-sm transition-colors duration-150',
                      'focus:outline-none focus:ring-2 focus:ring-[#9B7A2F]',
                      typeFilter === t
                        ? 'bg-white text-[#121212] border border-[#E2E2E2] shadow-sm font-medium'
                        : 'text-[#9B9B9B] border border-transparent hover:text-[#767676]'
                    )}
                    aria-pressed={typeFilter === t}
                  >
                    {t === 'all' ? 'All types' : TYPE_LABELS[t]}
                  </button>
                ))}
              </div>

              <span className="ml-auto text-xs text-[#9B9B9B]">
                {filtered.length} of {screen.checks.length}
              </span>
            </div>

            {/* Check list */}
            <div
              className="divide-y divide-[#F5F4F1]"
              role="list"
              aria-label={`Accessibility checks for ${screen.name}`}
            >
              {filtered.length === 0 ? (
                <div className="text-center py-10">
                  <p className="text-[#9B9B9B] text-sm">No checks match the current filter.</p>
                </div>
              ) : (
                filtered.map((check) => (
                  <div key={check.id} role="listitem">
                    <CheckItem check={check} thumbnail={getCheckThumb(check)} />
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </article>

      {lightboxOpen && screen.thumbnail && (
        <Lightbox
          src={screen.thumbnail}
          alt={`${screen.name} — ${screen.pageName}`}
          onClose={handleCloseLightbox}
        />
      )}
    </>
  )
}

// ─── Screen Thumbnail ──────────────────────────────────────────────────────────

function ScreenThumbnail({ src, name, width, height, onOpenLightbox }) {
  const aspectRatio = height / width || 2.16
  const thumbW = 62
  const thumbH = Math.min(Math.round(thumbW * aspectRatio), 130)

  if (src) {
    return (
      <button
        type="button"
        className="flex-shrink-0 rounded overflow-hidden border border-[#E2E2E2] bg-[#F5F4F1] focus:outline-none focus:ring-2 focus:ring-[#9B7A2F] group"
        style={{ width: thumbW, height: thumbH, cursor: 'zoom-in' }}
        onClick={onOpenLightbox}
        aria-label={`Open full-size preview of ${name}`}
      >
        <img
          src={src}
          alt=""
          className="w-full h-full object-cover object-top transition-transform duration-200 group-hover:scale-105"
          loading="lazy"
        />
      </button>
    )
  }

  // Placeholder wireframe — newspaper column feel
  return (
    <div
      className="flex-shrink-0 rounded border border-[#E2E2E2] bg-[#FAFAF9] overflow-hidden flex flex-col"
      style={{ width: thumbW, height: thumbH }}
      aria-hidden="true"
    >
      <div className="flex items-center justify-between px-1.5 pt-1.5 pb-1">
        <div className="h-0.5 w-3 rounded-full bg-[#E2E2E2]" />
        <div className="h-0.5 w-2 rounded-full bg-[#E2E2E2]" />
      </div>
      <div className="flex-1 px-1.5 space-y-1 pb-1.5">
        <div className="h-2   w-full rounded-sm bg-[#E2E2E2]" />
        <div className="h-1.5 w-3/4  rounded-sm bg-[#EEECEA]" />
        <div className="h-1.5 w-full rounded-sm bg-[#EEECEA]" />
        <div className="h-5   w-full rounded    bg-[#E8E7E4] mt-1.5" />
        <div className="h-5   w-full rounded    bg-[#F0EEE9]" />
        <div className="h-1.5 w-1/2  rounded-sm bg-[#EEECEA]" />
      </div>
      <div className="h-3 bg-[#F0EEE9] border-t border-[#E2E2E2] flex items-center justify-around px-2">
        {[1, 2, 3].map((n) => (
          <div key={n} className="h-1 w-1 rounded-full bg-[#E2E2E2]" />
        ))}
      </div>
    </div>
  )
}

// ─── Mini progress strip ───────────────────────────────────────────────────────

function MiniProgress({ failed, warnings, passed, total }) {
  if (total === 0) return null
  return (
    <div className="mt-2 h-1 rounded-full bg-[#F0EEE9] overflow-hidden flex gap-px" aria-hidden="true">
      {failed > 0 && (
        <div className="h-full bg-[#D0021B]" style={{ width: `${(failed   / total) * 100}%`, transition: 'width 600ms cubic-bezier(0.16,1,0.3,1)' }} />
      )}
      {warnings > 0 && (
        <div className="h-full bg-[#9B7A2F]" style={{ width: `${(warnings / total) * 100}%`, transition: 'width 600ms cubic-bezier(0.16,1,0.3,1)' }} />
      )}
      {passed > 0 && (
        <div className="h-full bg-[#1A6B3C]" style={{ width: `${(passed   / total) * 100}%`, transition: 'width 600ms cubic-bezier(0.16,1,0.3,1)' }} />
      )}
    </div>
  )
}

// ─── Tiny SVG status dots ──────────────────────────────────────────────────────

function FailDot() {
  return (
    <svg width="8" height="8" viewBox="0 0 8 8" fill="none" aria-hidden="true">
      <circle cx="4" cy="4" r="3.5" fill="#D0021B" />
      <path d="M2.5 2.5l3 3M5.5 2.5l-3 3" stroke="white" strokeWidth="1" strokeLinecap="round" />
    </svg>
  )
}
function WarnDot() {
  return (
    <svg width="8" height="8" viewBox="0 0 8 8" fill="none" aria-hidden="true">
      <path d="M4 1L7.5 7H0.5L4 1z" fill="#9B7A2F" />
      <path d="M4 3.5v1.5M4 6h.01" stroke="white" strokeWidth="0.8" strokeLinecap="round" />
    </svg>
  )
}
function PassDot() {
  return (
    <svg width="8" height="8" viewBox="0 0 8 8" fill="none" aria-hidden="true">
      <circle cx="4" cy="4" r="3.5" fill="#1A6B3C" />
      <path d="M2 4l1.5 1.5L6 2.5" stroke="white" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}
