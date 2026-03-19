/**
 * Figma Accessibility Analyzer
 *
 * Parses Figma file data and runs WCAG 2.1 AA + ADA checks:
 * 1. Color contrast (text vs background)
 * 2. Tap target sizes (44×44pt minimum)
 * 3. Text sizing (minimum 11pt, dynamic type readiness)
 */

import { getContrastRatio, getLuminance, formatRatio, wcagLevel, checkTapTarget } from './utils'

/**
 * Parse a Figma file URL and extract fileKey + optional nodeId.
 */
export function parseFigmaUrl(url) {
  try {
    const u = new URL(url)
    // Match /design/:fileKey or /file/:fileKey
    const match = u.pathname.match(/\/(design|file)\/([a-zA-Z0-9]+)/)
    if (!match) return null
    const fileKey = match[2]
    const nodeId = u.searchParams.get('node-id')?.replace(/-/g, ':') ?? null
    return { fileKey, nodeId }
  } catch {
    return null
  }
}

/**
 * Recursively walk a Figma node tree and collect all visible nodes.
 * Skips any node (and its entire subtree) where visible === false or opacity === 0.
 */
function flattenNodes(node, acc = []) {
  if (node.visible === false || node.opacity === 0) return acc
  acc.push(node)
  if (node.children) {
    for (const child of node.children) {
      flattenNodes(child, acc)
    }
  }
  return acc
}

/**
 * Convert a Figma RGBA color object {r,g,b,a} (0–1 range) to a hex string.
 */
function figmaColorToHex({ r, g, b }) {
  const toHex = (v) => Math.round(v * 255).toString(16).padStart(2, '0')
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`
}

/**
 * Alpha-composite foreground [r,g,b] (0–255) at `alpha` (0–1) over background [r,g,b].
 * Returns blended [r,g,b].
 */
function alphaComposite(fgR, fgG, fgB, alpha, bgR, bgG, bgB) {
  return [
    Math.round(fgR * alpha + bgR * (1 - alpha)),
    Math.round(fgG * alpha + bgG * (1 - alpha)),
    Math.round(fgB * alpha + bgB * (1 - alpha)),
  ]
}

function rgbToHex(r, g, b) {
  const toHex = (v) => v.toString(16).padStart(2, '0')
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`
}

function hexToRgb(hex) {
  const n = parseInt(hex.slice(1), 16)
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255]
}

/**
 * Extract the dominant fill color from a Figma node's fills array.
 * Skips fills that are invisible or fully transparent.
 * Returns { hex, alpha } where alpha is the effective fill opacity (fill.opacity * color.a).
 */
// Sentinel returned when the nearest background is an image or gradient fill.
const IMAGE_BG_SENTINEL = '__IMAGE_BG__'

const NON_SOLID_FILL_TYPES = new Set([
  'IMAGE', 'GRADIENT_LINEAR', 'GRADIENT_RADIAL', 'GRADIENT_ANGULAR', 'GRADIENT_DIAMOND',
])

function extractFillColor(fills) {
  if (!fills || fills.length === 0) return null
  const solidFill = fills.find(
    (f) => f.type === 'SOLID' && f.visible !== false && (f.opacity ?? 1) > 0
  )
  if (!solidFill) return null
  return figmaColorToHex(solidFill.color)
}

/**
 * Extract fill color with effective alpha (fill.opacity * color.a * node.opacity).
 * Returns { hex, alpha } or null.
 */
function extractFillWithAlpha(fills, nodeOpacity = 1) {
  if (!fills || fills.length === 0) return null
  const solidFill = fills.find(
    (f) => f.type === 'SOLID' && f.visible !== false && (f.opacity ?? 1) > 0
  )
  if (!solidFill) return null
  const colorAlpha = solidFill.color.a ?? 1
  const fillOpacity = solidFill.opacity ?? 1
  const effectiveAlpha = colorAlpha * fillOpacity * nodeOpacity
  return { hex: figmaColorToHex(solidFill.color), alpha: effectiveAlpha }
}

/**
 * Returns true if the fills array contains a visible image or gradient fill.
 */
function hasNonSolidFill(fills) {
  if (!fills || fills.length === 0) return false
  return fills.some((f) => NON_SOLID_FILL_TYPES.has(f.type) && f.visible !== false)
}

/**
 * Walk up the node tree compositing each layer's fill over an accumulated background.
 * Returns IMAGE_BG_SENTINEL if an image/gradient fill is encountered before a fully-opaque solid.
 * Falls back to white if no filled ancestor exists.
 */
function findAncestorBackground(node, nodeMap) {
  // Collect ancestors from immediate parent up to root
  const ancestors = []
  const mapped = nodeMap[node.id]
  let current = mapped ? nodeMap[mapped.parent] : null
  while (current) {
    ancestors.push(current)
    current = nodeMap[current.parent]
  }

  // Process outermost → innermost (reverse), compositing fills over accumulated bg
  let bg = [255, 255, 255] // default: white canvas

  for (let i = ancestors.length - 1; i >= 0; i--) {
    const ancestor = ancestors[i]
    const nodeOpacity = ancestor.opacity ?? 1

    // Image/gradient fill — can't compute contrast
    if (hasNonSolidFill(ancestor.fills)) return IMAGE_BG_SENTINEL

    const fill = extractFillWithAlpha(ancestor.fills, nodeOpacity)
    if (fill) {
      const fg = hexToRgb(fill.hex)
      bg = alphaComposite(fg[0], fg[1], fg[2], fill.alpha, bg[0], bg[1], bg[2])
    }
  }

  return rgbToHex(bg[0], bg[1], bg[2])
}

/**
 * Find the best node ID to use for a text element's thumbnail.
 * Returns the nearest ancestor that has a solid fill (e.g. button, card),
 * stopping at FRAME/COMPONENT/INSTANCE boundaries.
 * Falls back to the text node's own ID if no suitable ancestor is found.
 */
function findThumbnailAncestorId(node, nodeMap) {
  const mapped = nodeMap[node.id]
  let current = mapped ? nodeMap[mapped.parent] : null
  while (current) {
    if (extractFillColor(current.fills)) return current.id
    // Stop climbing at frame/component boundaries — going higher loses context
    if (current.type === 'FRAME' || current.type === 'COMPONENT' || current.type === 'INSTANCE') {
      return current.id
    }
    current = nodeMap[current.parent]
  }
  return node.id
}

/**
 * Generate a directional fix suggestion based on which of text/background is lighter.
 * Rule: to increase contrast you must push the two colors further apart.
 *   - Text darker than bg  → darken text further OR lighten background
 *   - Text lighter than bg → lighten text further OR darken background
 *   - Nearly identical     → flag same-color issue
 */
function contrastFixSuggestion(textColor, bgColor, ratio, threshold) {
  const textLum = getLuminance(textColor)
  const bgLum   = getLuminance(bgColor)
  const current = formatRatio(ratio)
  const needed  = `${threshold}:1`
  const diff    = Math.abs(textLum - bgLum)

  if (diff < 0.01) {
    return `Contrast is ${current}, needs ${needed}. Text and background appear to be the same or very similar color — change one of them significantly.`
  }

  if (textLum < bgLum) {
    // Text is the darker element — darken text further or lighten the background
    return `Contrast is ${current}, needs ${needed}. Text is darker than the background — darken the text color further or lighten the background.`
  }

  // Text is the lighter element — lighten text further or darken the background
  return `Contrast is ${current}, needs ${needed}. Text is lighter than the background — lighten the text color further or darken the background.`
}

/**
 * Run contrast check on a TEXT node.
 */
function checkContrast(node, nodeMap) {
  const textFill = extractFillWithAlpha(node.fills, node.opacity ?? 1)
  if (!textFill) return null

  const bgColor = findAncestorBackground(node, nodeMap)

  // Blend semi-transparent text color against the background
  let textColor = textFill.hex
  if (textFill.alpha < 0.999 && bgColor !== IMAGE_BG_SENTINEL) {
    const fg = hexToRgb(textFill.hex)
    const bg = hexToRgb(bgColor)
    const blended = alphaComposite(fg[0], fg[1], fg[2], textFill.alpha, bg[0], bg[1], bg[2])
    textColor = rgbToHex(blended[0], blended[1], blended[2])
  }
  const thumbnailNodeId = findThumbnailAncestorId(node, nodeMap)

  // Background is an image or gradient — contrast can't be calculated automatically
  if (bgColor === IMAGE_BG_SENTINEL) {
    return {
      id: `contrast-${node.id}`,
      type: 'contrast',
      label: 'Color Contrast',
      element: node.name || 'Text element',
      status: 'pass', // don't hard-fail; we simply can't determine
      severity: 'warning',
      ratio: 'N/A',
      rawRatio: null,
      textColor,
      bgColor: null,
      wcagLevel: null,
      isLargeText: false,
      threshold: null,
      thumbnailNodeId,
      fix: 'Background is an image or gradient — contrast cannot be calculated automatically. Please check manually.',
      detail: `Text "${truncate(node.characters, 40)}" — background is an image or gradient`,
    }
  }

  const ratio = getContrastRatio(textColor, bgColor)

  // Large text: >= 18pt bold, or >= 24pt regular
  const style = node.style || {}
  const fontSize = style.fontSize ?? 16
  const isBold = (style.fontWeight ?? 400) >= 700
  const isLargeText = fontSize >= 24 || (fontSize >= 18 && isBold)

  const level = wcagLevel(ratio, isLargeText)
  const threshold = isLargeText ? 3.0 : 4.5

  return {
    id: `contrast-${node.id}`,
    type: 'contrast',
    label: 'Color Contrast',
    element: node.name || 'Text element',
    status: ratio >= threshold ? 'pass' : 'fail',
    severity: ratio >= threshold ? 'pass' : ratio >= threshold * 0.75 ? 'warning' : 'critical',
    ratio: formatRatio(ratio),
    rawRatio: ratio,
    textColor,
    bgColor,
    wcagLevel: level,
    isLargeText,
    threshold: `${threshold}:1 (${isLargeText ? 'large text' : 'normal text'})`,
    thumbnailNodeId,
    fix: ratio < threshold ? contrastFixSuggestion(textColor, bgColor, ratio, threshold) : null,
    detail: `Text "${truncate(node.characters, 40)}" — ${formatRatio(ratio)} contrast ratio`,
  }
}

/**
 * Run tap target size check on interactive nodes (buttons, links, inputs).
 */
function checkTapTargetNode(node) {
  const bounds = node.absoluteBoundingBox || node.boundingBox
  if (!bounds) return null

  // Figma units are in px at 1x; treat as pt for iOS (close enough for audit)
  const widthPt = Math.round(bounds.width)
  const heightPt = Math.round(bounds.height)
  const result = checkTapTarget(widthPt, heightPt)

  return {
    id: `tap-${node.id}`,
    type: 'tap-target',
    label: 'Tap Target Size',
    element: node.name || 'Interactive element',
    status: result.pass ? 'pass' : 'fail',
    severity: result.pass ? 'pass' : 'critical',
    actual: result.actual,
    recommended: result.recommended,
    widthPass: result.widthPass,
    heightPass: result.heightPass,
    fix: !result.pass
      ? `Increase touch area to at least 44×44pt. Current: ${result.actual}. ${!result.widthPass ? `Width needs +${44 - widthPt}pt. ` : ''}${!result.heightPass ? `Height needs +${44 - heightPt}pt.` : ''}`
      : null,
    detail: `"${node.name}" — ${result.actual}${result.pass ? ' ✓' : ` (min ${result.recommended})`}`,
  }
}

/**
 * Run text size check on a TEXT node.
 */
function checkTextSize(node) {
  const style = node.style || {}
  const fontSize = style.fontSize ?? 16
  const minSize = 11 // pt minimum for iOS legibility

  const pass = fontSize >= minSize
  const dynamicTypeReady = fontSize >= 16 // good baseline for dynamic type

  return {
    id: `textsize-${node.id}`,
    type: 'text-size',
    label: 'Text Size',
    element: node.name || 'Text element',
    status: pass ? 'pass' : 'fail',
    severity: pass ? (dynamicTypeReady ? 'pass' : 'warning') : 'critical',
    fontSize: `${fontSize}pt`,
    minRequired: `${minSize}pt`,
    dynamicTypeReady,
    fix: !pass
      ? `Increase font size to at least ${minSize}pt (current: ${fontSize}pt). Small text is inaccessible on mobile devices, especially for users with low vision.`
      : !dynamicTypeReady
      ? `Consider using at least 16pt for better Dynamic Type support. Current ${fontSize}pt may be too small when text is scaled.`
      : null,
    detail: `"${node.name}" — ${fontSize}pt${pass ? '' : ` (min ${minSize}pt)`}`,
  }
}

/**
 * Determine if a node is interactive (button, link, input, etc.).
 */
function isInteractiveNode(node) {
  const interactiveTypes = ['INSTANCE', 'COMPONENT', 'FRAME', 'GROUP']
  const interactiveNames = /button|btn|cta|link|tab|input|checkbox|radio|toggle|switch|chip|tag|icon-button|fab|nav/i
  return (
    interactiveTypes.includes(node.type) &&
    (interactiveNames.test(node.name) ||
      node.reactions?.length > 0 ||
      node.componentProperties?.['isInteractive'])
  )
}

/**
 * Build a node map (id → node) with parent references for background lookup.
 */
function buildNodeMap(document) {
  const map = {}
  function walk(node, parentId = null) {
    map[node.id] = { ...node, parent: parentId }
    if (node.children) {
      for (const child of node.children) walk(child, node.id)
    }
  }
  walk(document)
  return map
}

/**
 * Analyze a single Figma page/frame for accessibility issues.
 */
export function analyzeFrame(frame, nodeMap) {
  const nodes = flattenNodes(frame)
  const checks = []

  for (const node of nodes) {
    // Color contrast — only on TEXT nodes with content
    if (node.type === 'TEXT' && node.characters && node.fills?.length) {
      const check = checkContrast(node, nodeMap)
      if (check) checks.push(check)
    }

    // Text size — all TEXT nodes
    if (node.type === 'TEXT') {
      const check = checkTextSize(node)
      if (check) checks.push(check)
    }

    // Tap target — interactive nodes
    if (isInteractiveNode(node)) {
      const check = checkTapTargetNode(node)
      if (check) checks.push(check)
    }
  }

  // Deduplicate by id
  const seen = new Set()
  return checks.filter((c) => {
    if (seen.has(c.id)) return false
    seen.add(c.id)
    return true
  })
}

/**
 * Main entry point: analyze an entire Figma file.
 * Returns per-screen results.
 */
export function analyzeFigmaFile(figmaData) {
  if (!figmaData || !figmaData.document) {
    throw new Error('Invalid Figma file data')
  }

  const nodeMap = buildNodeMap(figmaData.document)
  const screens = []

  // Top-level canvas pages
  for (const page of figmaData.document.children || []) {
    // Top-level frames/components/instances on each page = screens
    for (const frame of page.children || []) {
      const isScreenType = frame.type === 'FRAME' || frame.type === 'COMPONENT' || frame.type === 'INSTANCE'
      const width = frame.absoluteBoundingBox?.width ?? 0
      if (!isScreenType || width < 320) continue

      const checks = analyzeFrame(frame, nodeMap)
      const passed = checks.filter((c) => c.status === 'pass').length
      const failed = checks.filter((c) => c.status === 'fail').length
      const score = checks.length > 0 ? Math.round((passed / checks.length) * 100) : 100

      screens.push({
        id: frame.id,
        name: frame.name,
        pageName: page.name,
        width: frame.absoluteBoundingBox?.width ?? 375,
        height: frame.absoluteBoundingBox?.height ?? 812,
        checks,
        passed,
        failed,
        warnings: checks.filter((c) => c.severity === 'warning').length,
        score,
        issueCount: failed,
      })
    }
  }

  return screens
}

/**
 * Fetch image export URLs for a list of node IDs from the Figma Images API.
 * Returns a map of nodeId → CDN image URL.
 */
export async function fetchThumbnails(fileKey, nodeIds, token, scale = 1) {
  if (!token || !fileKey || !nodeIds?.length) return {}
  try {
    const ids = nodeIds.join(',')
    const qs = new URLSearchParams({ ids, format: 'png', scale: String(scale) })
    const res = await fetch(`https://api.figma.com/v1/images/${fileKey}?${qs}`, {
      headers: { 'X-Figma-Token': token },
    })
    if (!res.ok) return {}
    const data = await res.json()
    return data.images || {}
  } catch {
    return {}
  }
}

function truncate(str, len) {
  if (!str) return ''
  return str.length > len ? str.slice(0, len) + '…' : str
}
