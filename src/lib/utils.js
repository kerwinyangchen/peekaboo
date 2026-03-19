import { clsx } from 'clsx'

export function cn(...inputs) {
  return clsx(inputs)
}

/**
 * Calculate relative luminance for a hex color.
 * Per WCAG 2.1 spec.
 */
export function getLuminance(hex) {
  const rgb = hexToRgb(hex)
  if (!rgb) return 0
  const { r, g, b } = rgb
  const [rs, gs, bs] = [r, g, b].map((c) => {
    const s = c / 255
    return s <= 0.04045 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4)
  })
  return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs
}

/**
 * Calculate WCAG contrast ratio between two hex colors.
 */
export function getContrastRatio(hex1, hex2) {
  const l1 = getLuminance(hex1)
  const l2 = getLuminance(hex2)
  const lighter = Math.max(l1, l2)
  const darker = Math.min(l1, l2)
  return (lighter + 0.05) / (darker + 0.05)
}

/**
 * Parse a hex color string to RGB.
 */
export function hexToRgb(hex) {
  const clean = hex.replace('#', '')
  if (clean.length === 3) {
    const r = parseInt(clean[0] + clean[0], 16)
    const g = parseInt(clean[1] + clean[1], 16)
    const b = parseInt(clean[2] + clean[2], 16)
    return { r, g, b }
  }
  if (clean.length === 6) {
    return {
      r: parseInt(clean.slice(0, 2), 16),
      g: parseInt(clean.slice(2, 4), 16),
      b: parseInt(clean.slice(4, 6), 16),
    }
  }
  return null
}

/**
 * Format a contrast ratio for display.
 */
export function formatRatio(ratio) {
  return `${ratio.toFixed(2)}:1`
}

/**
 * Determine WCAG AA / AAA pass/fail for a contrast ratio.
 */
export function wcagLevel(ratio, isLargeText = false) {
  const aaThreshold = isLargeText ? 3.0 : 4.5
  const aaaThreshold = isLargeText ? 4.5 : 7.0
  if (ratio >= aaaThreshold) return 'AAA'
  if (ratio >= aaThreshold) return 'AA'
  return 'FAIL'
}

/**
 * Convert pt to px (1pt = 1.333px at 96dpi).
 */
export function ptToPx(pt) {
  return pt * (96 / 72)
}

/**
 * Check if a tap target meets minimum size (44x44pt = ~58.5x58.5px).
 */
export function checkTapTarget(widthPt, heightPt) {
  const minPt = 44
  const passWidth = widthPt >= minPt
  const passHeight = heightPt >= minPt
  return {
    pass: passWidth && passHeight,
    widthPass: passWidth,
    heightPass: passHeight,
    recommended: `${minPt}×${minPt}pt minimum`,
    actual: `${widthPt}×${heightPt}pt`,
  }
}

/**
 * Determine overall screen score from check results.
 */
export function calculateScore(checks) {
  if (!checks || checks.length === 0) return 0
  const passed = checks.filter((c) => c.status === 'pass').length
  return Math.round((passed / checks.length) * 100)
}

/**
 * Severity from score.
 */
export function scoreSeverity(score) {
  if (score >= 90) return 'pass'
  if (score >= 60) return 'warning'
  return 'critical'
}
