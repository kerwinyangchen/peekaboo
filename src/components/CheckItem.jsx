import { useState, useCallback } from 'react'
import { ChevronRight, Eye, Maximize2, Type, Wrench, ArrowRight } from 'lucide-react'
import { Lightbox } from './Lightbox'
import { cn } from '../lib/utils'

const TYPE_ICONS  = { contrast: Eye, 'tap-target': Maximize2, 'text-size': Type }
const TYPE_LABELS = { contrast: 'Contrast', 'tap-target': 'Tap Target', 'text-size': 'Text Size' }

function getStatus(check) {
  if (check.severity === 'critical' || check.status === 'fail') return 'fail'
  if (check.severity === 'warning') return 'warning'
  return 'pass'
}

const STATUS_DOT = { pass: '#1A6B3C', warning: '#9B7A2F', fail: '#D0021B' }

// ─── Inline value comparison ───────────────────────────────────────────────────

function ValueSummary({ check }) {
  const status = getStatus(check)
  const actualColor =
    status === 'pass' ? '#1A6B3C' : status === 'warning' ? '#9B7A2F' : '#D0021B'

  if (check.type === 'contrast') {
    const needsThreshold = check.threshold?.split(' ')[0]
    return (
      <span className="flex items-center gap-1 flex-shrink-0 font-mono text-xs tabular-nums">
        <span style={{ color: actualColor }} className="font-medium">{check.ratio}</span>
        {status !== 'pass' && needsThreshold && (
          <>
            <ArrowRight size={10} className="text-[#9B9B9B]" aria-hidden="true" />
            <span className="text-[#767676]">needs {needsThreshold}</span>
          </>
        )}
        {status === 'pass' && check.wcagLevel && (
          <span
            className="ml-1 text-[10px] px-1.5 py-px rounded-sm font-sans font-semibold"
            style={{ background: '#EAF4EE', color: '#1A6B3C', border: '1px solid #A8D5B8' }}
          >
            {check.wcagLevel}
          </span>
        )}
      </span>
    )
  }

  if (check.type === 'tap-target') {
    return (
      <span className="flex items-center gap-1 flex-shrink-0 font-mono text-xs tabular-nums">
        <span style={{ color: actualColor }} className="font-medium">{check.actual}</span>
        {status !== 'pass' && (
          <>
            <ArrowRight size={10} className="text-[#9B9B9B]" aria-hidden="true" />
            <span className="text-[#767676]">needs {check.recommended?.split(' ')[0]}</span>
          </>
        )}
      </span>
    )
  }

  if (check.type === 'text-size') {
    return (
      <span className="flex items-center gap-1 flex-shrink-0 font-mono text-xs tabular-nums">
        <span style={{ color: actualColor }} className="font-medium">{check.fontSize}</span>
        {status !== 'pass' && check.minRequired && (
          <>
            <ArrowRight size={10} className="text-[#9B9B9B]" aria-hidden="true" />
            <span className="text-[#767676]">needs {check.minRequired}</span>
          </>
        )}
        {status === 'warning' && check.dynamicTypeReady === false && check.status === 'pass' && (
          <span className="ml-1 text-[10px] font-sans font-medium text-[#9B7A2F]">dyn. type</span>
        )}
      </span>
    )
  }

  return null
}

// ─── Color swatches for contrast ──────────────────────────────────────────────

function ContrastSwatches({ check }) {
  return (
    <div className="flex items-center gap-3 flex-wrap">
      <div className="flex items-center gap-1.5">
        <div className="w-4 h-4 rounded-sm border border-[#E2E2E2] flex-shrink-0" style={{ backgroundColor: check.textColor }} aria-hidden="true" />
        <span className="font-mono text-xs text-[#444444]">{check.textColor}</span>
        <span className="text-[#9B9B9B] text-xs">text</span>
      </div>
      <span className="text-[#9B9B9B] text-xs">on</span>
      <div className="flex items-center gap-1.5">
        <div className="w-4 h-4 rounded-sm border border-[#E2E2E2] flex-shrink-0" style={{ backgroundColor: check.bgColor }} aria-hidden="true" />
        <span className="font-mono text-xs text-[#444444]">{check.bgColor}</span>
        <span className="text-[#9B9B9B] text-xs">bg</span>
      </div>
    </div>
  )
}

// ─── Element thumbnail ─────────────────────────────────────────────────────────

function ElementThumbnail({ thumbnail, elementName, onOpenLightbox }) {
  if (thumbnail === undefined || thumbnail === null) return null

  if (thumbnail === 'loading') {
    return (
      <div
        className="flex-shrink-0 rounded border border-[#E2E2E2] shimmer"
        style={{ width: 52, height: 52 }}
        aria-hidden="true"
      />
    )
  }

  return (
    <button
      type="button"
      className="flex-shrink-0 rounded overflow-hidden border border-[#E2E2E2] bg-[#F5F4F1] group focus:outline-none focus:ring-2 focus:ring-[#9B7A2F]"
      style={{ width: 52, height: 52, cursor: 'zoom-in' }}
      onClick={onOpenLightbox}
      aria-label={`Open full-size preview of ${elementName}`}
    >
      <img
        src={thumbnail}
        alt=""
        className="w-full h-full object-contain transition-transform duration-200 group-hover:scale-110"
        loading="lazy"
      />
    </button>
  )
}

// ─── Main component ────────────────────────────────────────────────────────────

export function CheckItem({ check, thumbnail }) {
  const [expanded, setExpanded]       = useState(false)
  const [lightboxOpen, setLightboxOpen] = useState(false)
  const handleOpenLightbox  = useCallback((e) => { e.stopPropagation(); setLightboxOpen(true) },  [])
  const handleCloseLightbox = useCallback(() => setLightboxOpen(false), [])

  const status   = getStatus(check)
  const dot      = STATUS_DOT[status]
  const TypeIcon = TYPE_ICONS[check.type]
  const hasFix      = !!check.fix
  const hasDetail   = check.type === 'contrast' || check.type === 'tap-target' || check.type === 'text-size'
  const canExpand   = (hasFix || hasDetail) && status !== 'pass'

  return (
    <div
      className={cn(
        'transition-colors duration-100',
        expanded && status === 'fail'    && 'bg-[#FEF7F7]',
        expanded && status === 'warning' && 'bg-[#FDFBF4]',
      )}
    >
      <button
        className={cn(
          'w-full flex items-center gap-3 px-4 py-3 text-left',
          'transition-colors duration-100',
          canExpand ? 'hover:bg-[#FAFAF9] cursor-pointer' : 'cursor-default',
          'focus:outline-none focus:ring-2 focus:ring-inset focus:ring-[#9B7A2F]/30',
          status === 'pass' && 'opacity-60 hover:opacity-80'
        )}
        onClick={() => canExpand && setExpanded(!expanded)}
        aria-expanded={canExpand ? expanded : undefined}
        aria-disabled={!canExpand}
        tabIndex={canExpand ? 0 : -1}
      >
        {/* Status dot */}
        <div className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ backgroundColor: dot }} aria-hidden="true" />

        {/* Type icon */}
        {TypeIcon && <TypeIcon size={13} className="flex-shrink-0 text-[#9B9B9B]" aria-hidden="true" />}

        {/* Type label */}
        <span className="text-xs font-medium text-[#767676] flex-shrink-0 w-[72px]">
          {TYPE_LABELS[check.type] || check.label}
        </span>

        {/* Element name */}
        <span className="text-sm text-[#444444] flex-1 min-w-0 truncate">{check.element}</span>

        {/* Value comparison */}
        <ValueSummary check={check} />

        {/* Element thumbnail */}
        <ElementThumbnail
          thumbnail={thumbnail}
          elementName={check.element}
          onOpenLightbox={handleOpenLightbox}
        />

        {/* Expand chevron */}
        {canExpand && (
          <ChevronRight
            size={13}
            className={cn(
              'flex-shrink-0 text-[#9B9B9B] transition-transform duration-150',
              expanded && 'rotate-90'
            )}
            aria-hidden="true"
          />
        )}
      </button>

      {/* Expanded detail */}
      {expanded && canExpand && (
        <div className="px-4 pb-4 animate-fade-in">
          <div className="pl-[calc(0.375rem+13px+0.75rem+0.75rem+72px+0.75rem)] space-y-3">
            {check.type === 'contrast' && check.textColor && check.bgColor && (
              <ContrastSwatches check={check} />
            )}

            {check.type === 'tap-target' && (
              <div className="flex items-center gap-4 text-xs flex-wrap">
                <div className="flex items-center gap-1.5">
                  <span className="text-[#9B9B9B]">Actual</span>
                  <span className="font-mono text-[#444444]">{check.actual}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-[#9B9B9B]">Required</span>
                  <span className="font-mono text-[#767676]">{check.recommended}</span>
                </div>
                {!check.widthPass  && <span className="text-[#D0021B] text-[11px]">Width too small</span>}
                {!check.heightPass && <span className="text-[#D0021B] text-[11px]">Height too small</span>}
              </div>
            )}

            {hasFix && (
              <div className="flex items-start gap-2.5 p-3 rounded bg-[#F5F4F1] border border-[#E2E2E2]">
                <Wrench size={12} className="text-[#D0021B] mt-0.5 flex-shrink-0" aria-hidden="true" />
                <p className="text-xs text-[#444444] leading-relaxed">{check.fix}</p>
              </div>
            )}
          </div>
        </div>
      )}

      {lightboxOpen && typeof thumbnail === 'string' && (
        <Lightbox src={thumbnail} alt={check.element} onClose={handleCloseLightbox} />
      )}
    </div>
  )
}
