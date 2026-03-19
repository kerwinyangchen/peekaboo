import { useState, useRef, useEffect } from 'react'
import { XCircle, AlertTriangle, CheckCircle, LayoutGrid, Info } from 'lucide-react'

function scoreColor(score) {
  if (score >= 90) return '#1A6B3C'
  if (score >= 60) return '#9B7A2F'
  return '#D0021B'
}

function scoreLabel(score) {
  if (score >= 90) return 'Excellent'
  if (score >= 60) return 'Needs work'
  return 'Critical'
}

export function SummaryBar({ screens }) {
  if (!screens || screens.length === 0) return null

  const totalChecks   = screens.reduce((s, sc) => s + sc.checks.length, 0)
  const totalFailed   = screens.reduce((s, sc) => s + sc.failed, 0)
  const totalWarnings = screens.reduce((s, sc) => s + sc.warnings, 0)
  const totalPassed   = screens.reduce((s, sc) => s + sc.passed, 0)
  const avgScore      = Math.round(screens.reduce((s, sc) => s + sc.score, 0) / screens.length)
  const color         = scoreColor(avgScore)

  const failPct = totalChecks > 0 ? (totalFailed   / totalChecks) * 100 : 0
  const warnPct = totalChecks > 0 ? (totalWarnings / totalChecks) * 100 : 0
  const passPct = totalChecks > 0 ? (totalPassed   / totalChecks) * 100 : 0

  return (
    <section aria-label="Scan summary" className="card p-5 animate-slide-up">
      <div className="flex items-start gap-6 flex-wrap">

        {/* Score block */}
        <div className="flex items-center gap-4 flex-shrink-0">
          <ScoreDonut score={avgScore} color={color} />
          <div>
            <div className="flex items-center gap-1 mb-0.5">
              <p className="text-xs text-[#767676] font-semibold uppercase tracking-widest">
                Avg. score
              </p>
              <ScoreInfoPopover />
            </div>
            <p
              className="font-mono text-3xl font-bold tabular-nums leading-none"
              style={{ color }}
              aria-label={`Average accessibility score ${avgScore} percent — ${scoreLabel(avgScore)}`}
            >
              {avgScore}
              <span className="text-base font-normal text-[#767676] ml-0.5">%</span>
            </p>
            <p className="text-xs mt-1 font-medium" style={{ color }}>
              {scoreLabel(avgScore)}
            </p>
          </div>
        </div>

        {/* Vertical divider */}
        <div className="w-px self-stretch bg-[#E2E2E2] flex-shrink-0 hidden sm:block" aria-hidden="true" />

        {/* Stats + progress */}
        <div className="flex-1 min-w-0 flex flex-col justify-between gap-4">
          <div className="flex items-center gap-6 flex-wrap" role="list">
            <StatItem icon={<LayoutGrid size={13} className="text-[#9B9B9B]" />}               value={screens.length}  label="screens"  valueColor="#121212" />
            <StatItem icon={<XCircle      size={13} style={{ color: '#D0021B' }} />}            value={totalFailed}     label="failed"   valueColor={totalFailed   > 0 ? '#D0021B' : '#121212'} />
            <StatItem icon={<AlertTriangle size={13} style={{ color: '#9B7A2F' }} />}           value={totalWarnings}   label="warnings" valueColor={totalWarnings > 0 ? '#9B7A2F' : '#121212'} />
            <StatItem icon={<CheckCircle  size={13} style={{ color: '#1A6B3C' }} />}            value={totalPassed}     label="passed"   valueColor="#1A6B3C" />
          </div>

          {/* Segmented progress bar */}
          <div>
            <div className="h-1.5 rounded-full bg-[#F0EEE9] overflow-hidden flex gap-px" aria-hidden="true">
              {failPct > 0 && (
                <div className="h-full bg-[#D0021B] transition-all duration-700" style={{ width: `${failPct}%` }} />
              )}
              {warnPct > 0 && (
                <div className="h-full bg-[#9B7A2F] transition-all duration-700" style={{ width: `${warnPct}%` }} />
              )}
              {passPct > 0 && (
                <div className="h-full bg-[#1A6B3C] transition-all duration-700" style={{ width: `${passPct}%` }} />
              )}
            </div>
            <p className="text-xs text-[#9B9B9B] mt-1.5">
              {totalChecks} total checks ·{' '}
              <span className="text-[#1A6B3C]">{totalPassed} passed</span>
              {totalFailed > 0 && <>, <span className="text-[#D0021B]">{totalFailed} failed</span></>}
              {totalWarnings > 0 && <>, <span className="text-[#9B7A2F]">{totalWarnings} warnings</span></>}
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}

// ─── Score info popover ────────────────────────────────────────────────────────

function ScoreInfoPopover() {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)

  useEffect(() => {
    if (!open) return
    function onKey(e)     { if (e.key === 'Escape') setOpen(false) }
    function onOutside(e) { if (ref.current && !ref.current.contains(e.target)) setOpen(false) }
    document.addEventListener('keydown', onKey)
    document.addEventListener('mousedown', onOutside)
    return () => {
      document.removeEventListener('keydown', onKey)
      document.removeEventListener('mousedown', onOutside)
    }
  }, [open])

  return (
    <div ref={ref} className="relative flex items-center">
      <button
        type="button"
        aria-label="How is this score calculated?"
        aria-expanded={open}
        aria-haspopup="true"
        onClick={() => setOpen((v) => !v)}
        onMouseEnter={() => setOpen(true)}
        onMouseLeave={() => setOpen(false)}
        className="text-[#C8C8C4] hover:text-[#767676] transition-colors focus:outline-none focus:ring-2 focus:ring-[#9B7A2F] rounded"
      >
        <Info size={11} aria-hidden="true" />
      </button>

      {open && (
        <div
          role="tooltip"
          className="absolute left-1/2 -translate-x-1/2 top-[calc(100%+8px)] z-50 w-72 rounded border border-[#E2E2E2] bg-white shadow-elevated p-4 animate-fade-in"
          onMouseEnter={() => setOpen(true)}
          onMouseLeave={() => setOpen(false)}
        >
          {/* Upward caret */}
          <div className="absolute left-1/2 -translate-x-1/2 bottom-full" aria-hidden="true">
            <div className="w-2.5 h-1.5 overflow-hidden flex items-end justify-center">
              <div className="w-2 h-2 bg-white border-l border-t border-[#E2E2E2] rotate-45 translate-y-[1px]" />
            </div>
          </div>

          <p className="text-xs font-semibold text-[#121212] mb-2.5 uppercase tracking-wide">How the score is calculated</p>

          <div className="space-y-2 mb-3">
            <Row dot="#1A6B3C" label="Passed"  desc="Meets WCAG 2.1 AA. Counts as 1 point." />
            <Row dot="#9B7A2F" label="Warning" desc="Borderline — contrast 3:1–4.5:1 (AA large text only), tap target 36–44pt, or text 11–12pt. Counts as 1 point." />
            <Row dot="#D0021B" label="Failed"  desc="Does not meet the required threshold. Counts as 0 points." />
          </div>

          <div className="pt-2.5 border-t border-[#E2E2E2]">
            <p className="text-[11px] text-[#767676] leading-relaxed">
              <span className="font-mono text-[#444444]">score = passed ÷ total × 100</span>
              <br />
              Warnings count as passed for scoring. The average is taken across all screens.
            </p>
          </div>
        </div>
      )}
    </div>
  )
}

function Row({ dot, label, desc }) {
  return (
    <div className="flex items-start gap-2">
      <div className="w-1.5 h-1.5 rounded-full flex-shrink-0 mt-[3px]" style={{ backgroundColor: dot }} aria-hidden="true" />
      <div>
        <span className="text-xs font-semibold text-[#121212]">{label} </span>
        <span className="text-xs text-[#767676]">— {desc}</span>
      </div>
    </div>
  )
}

// ─── Stat item ─────────────────────────────────────────────────────────────────

function StatItem({ icon, value, label, valueColor }) {
  return (
    <div className="flex items-center gap-2" role="listitem">
      <span aria-hidden="true">{icon}</span>
      <span
        className="font-mono text-xl font-bold tabular-nums leading-none"
        style={{ color: valueColor }}
        aria-label={`${value} ${label}`}
      >
        {value}
      </span>
      <span className="text-xs text-[#767676]">{label}</span>
    </div>
  )
}

// ─── Score donut ───────────────────────────────────────────────────────────────

function ScoreDonut({ score, color }) {
  const size = 56
  const stroke = 5
  const r = (size - stroke) / 2
  const circumference = 2 * Math.PI * r
  const offset = circumference - (score / 100) * circumference

  return (
    <figure
      className="relative inline-flex items-center justify-center flex-shrink-0"
      style={{ width: size, height: size }}
      aria-hidden="true"
    >
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ transform: 'rotate(-90deg)' }}>
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="#E2E2E2" strokeWidth={stroke} />
        <circle
          cx={size/2} cy={size/2} r={r}
          fill="none" stroke={color} strokeWidth={stroke} strokeLinecap="round"
          strokeDasharray={circumference} strokeDashoffset={offset}
          style={{ transition: 'stroke-dashoffset 700ms cubic-bezier(0.16,1,0.3,1)' }}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="font-mono font-bold tabular-nums text-xs" style={{ color }}>
          {score}%
        </span>
      </div>
    </figure>
  )
}
