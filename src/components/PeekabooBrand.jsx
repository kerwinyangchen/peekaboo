import { useEffect, useRef } from 'react'

// Pacifico glyph paths for "Peekaboo" — extracted via opentype.js at fontSize=100
// ViewBox: -0.4 -19.0 409.9 114.9  (includes ascenders/descenders with 5px padding)
const LETTERS = [
  {
    char: 'P',
    d: 'M82.3 20.4Q82.3 28.9 77.9 36Q73.5 43.1 65.1 47.6Q56.7 52.1 45.1 52.9L40.8 77Q38.3 90.9 27.2 90.9Q21.1 90.9 15.95 87.3Q10.8 83.7 7.7 76.3Q4.6 68.9 4.6 58.1Q4.6 37.8 11.15 23.65Q17.7 9.5 28.75 2.45Q39.8-4.6 53.1-4.6Q62.5-4.6 69.05-1.3Q75.6 2 78.95 7.65Q82.3 13.3 82.3 20.4ZM46.9 42.6Q67.4 40 67.4 21.3Q67.4 14.7 63.05 10.55Q58.7 6.4 49.6 6.4Q39.3 6.4 31.65 12.9Q24 19.4 19.85 30.95Q15.7 42.5 15.7 57.3Q15.7 63.5 16.95 68.3Q18.2 73.1 20.15 75.75Q22.1 78.4 23.9 78.4Q26.4 78.4 27.7 71.5L31 52.6Q27.1 52 27.6 52.1Q24.6 51.6 23.7 50.25Q22.8 48.9 22.8 46.8Q22.8 44.6 24.05 43.3Q25.3 42 27.5 42Q28.5 42 29 42.1Q31.4 42.5 32.7 42.6Q34 34.8 36.4 21.7Q37 18.3 39.15 16.85Q41.3 15.4 44.2 15.4Q47.5 15.4 48.95 16.65Q50.4 17.9 50.4 20.6Q50.4 22.2 50.2 23.2Z',
  },
  {
    char: 'e',
    d: 'M124.9 57.7Q126.2 57.7 126.95 58.9Q127.7 60.1 127.7 62.2Q127.7 66.2 125.8 68.4Q122.1 72.9 115.35 76.7Q108.6 80.5 100.9 80.5Q90.4 80.5 84.6 74.8Q78.8 69.1 78.8 59.2Q78.8 52.3 81.7 46.35Q84.6 40.4 89.75 36.9Q94.9 33.4 101.4 33.4Q107.2 33.4 110.7 36.85Q114.2 40.3 114.2 46.2Q114.2 53.1 109.25 58.05Q104.3 63 92.5 65.9Q95 70.5 102 70.5Q106.5 70.5 112.25 67.35Q118 64.2 122.2 59.1Q123.4 57.7 124.9 57.7ZM99.7 43.2Q96 43.2 93.45 47.5Q90.9 51.8 90.9 57.9L90.9 58.1Q96.8 56.7 100.2 53.9Q103.6 51.1 103.6 47.4Q103.6 45.5 102.55 44.35Q101.5 43.2 99.7 43.2Z',
  },
  {
    char: 'e',
    d: 'M164.2 57.7Q165.5 57.7 166.25 58.9Q167 60.1 167 62.2Q167 66.2 165.1 68.4Q161.4 72.9 154.65 76.7Q147.9 80.5 140.2 80.5Q129.7 80.5 123.9 74.8Q118.1 69.1 118.1 59.2Q118.1 52.3 121 46.35Q123.9 40.4 129.05 36.9Q134.2 33.4 140.7 33.4Q146.5 33.4 150 36.85Q153.5 40.3 153.5 46.2Q153.5 53.1 148.55 58.05Q143.6 63 131.8 65.9Q134.3 70.5 141.3 70.5Q145.8 70.5 151.55 67.35Q157.3 64.2 161.5 59.1Q162.7 57.7 164.2 57.7ZM139 43.2Q135.3 43.2 132.75 47.5Q130.2 51.8 130.2 57.9L130.2 58.1Q136.1 56.7 139.5 53.9Q142.9 51.1 142.9 47.4Q142.9 45.5 141.85 44.35Q140.8 43.2 139 43.2Z',
  },
  {
    char: 'k',
    d: 'M216.7 57.7Q218 57.7 218.75 58.9Q219.5 60.1 219.5 62.2Q219.5 66.2 217.6 68.4Q213.1 73.9 208.5 77.2Q203.9 80.5 197.6 80.5Q189.9 80.5 185.2 76.1Q180.5 71.7 180.5 64.4Q180.5 60.5 184.5 58.8Q188.9 56.9 190.8 54.75Q192.7 52.6 192.7 49.5Q192.7 47.7 191.95 46.8Q191.2 45.9 190.1 45.9Q187.4 45.9 184.15 49.8Q180.9 53.7 178.1 59.85Q175.3 66 173.7 72.5Q172.6 77.2 171.15 78.85Q169.7 80.5 166.6 80.5Q163.5 80.5 162.05 78.25Q160.6 76 160.1 71.3Q159.6 66.6 159.6 57.5Q159.6 42.1 162.75 25.4Q165.9 8.7 172.05-2.65Q178.2-14 186.8-14Q191.4-14 194.25-10.05Q197.1-6.1 197.1 0.2Q197.1 10.3 191.2 21.15Q185.3 32 172 46.5Q171.7 51.7 171.7 57.2Q176.5 44.7 182.7 39.05Q188.9 33.4 194.3 33.4Q199.3 33.4 202.35 36.8Q205.4 40.2 205.4 45.2Q205.4 50.7 202.6 55.3Q199.8 59.9 193 63.5Q193.4 66.2 195.45 67.85Q197.5 69.5 200.4 69.5Q203.5 69.5 206.4 67.1Q209.3 64.7 214 59.1Q215.2 57.7 216.7 57.7ZM184.7-4.1Q182.9-4.1 180.7 1.05Q178.5 6.2 176.45 14.95Q174.4 23.7 173.1 34Q179.3 26.7 183.35 18.1Q187.4 9.5 187.4 2.5Q187.4-0.7 186.7-2.4Q186-4.1 184.7-4.1Z',
  },
  {
    char: 'a',
    d: 'M223.7 80.5Q217.5 80.5 213.8 76Q210.1 71.5 210.1 64.2Q210.1 56.2 213.8 49.05Q217.5 41.9 223.65 37.55Q229.8 33.2 236.7 33.2Q238.9 33.2 239.65 34.05Q240.4 34.9 240.9 37.1Q243 36.7 245.3 36.7Q250.2 36.7 250.2 40.2Q250.2 42.3 248.7 50.2Q246.4 61.7 246.4 66.2Q246.4 67.7 247.15 68.6Q247.9 69.5 249.1 69.5Q251 69.5 253.7 67.05Q256.4 64.6 261 59.1Q262.2 57.7 263.7 57.7Q265 57.7 265.75 58.9Q266.5 60.1 266.5 62.2Q266.5 66.2 264.6 68.4Q260.5 73.5 255.9 77Q251.3 80.5 247 80.5Q243.7 80.5 240.95 78.25Q238.2 76 236.8 72.1Q231.6 80.5 223.7 80.5ZM227.3 70.4Q229.5 70.4 231.5 67.8Q233.5 65.2 234.4 60.9L238.1 42.5Q233.9 42.6 230.35 45.65Q226.8 48.7 224.7 53.7Q222.6 58.7 222.6 64.3Q222.6 67.4 223.85 68.9Q225.1 70.4 227.3 70.4Z',
  },
  {
    char: 'b',
    d: 'M311.6 49.3Q312.9 49.3 313.6 50.6Q314.3 51.9 314.3 53.9Q314.3 56.4 313.6 57.75Q312.9 59.1 311.4 59.6Q305.4 61.7 298.2 62Q296.2 70.3 290.65 75.4Q285.1 80.5 278.4 80.5Q268.3 80.5 263.7 72.8Q259.1 65.1 259.1 50.5Q259.1 37.6 262.3 22.45Q265.5 7.3 271.65-3.35Q277.8-14 286.3-14Q290.9-14 293.7-10.05Q296.5-6.1 296.5 0.2Q296.5 8.4 293.4 16.5Q290.3 24.6 283.1 33.5Q289.8 34 294 39.05Q298.2 44.1 299 51.5Q303.7 51.2 310.2 49.5Q310.8 49.3 311.6 49.3ZM284-4.1Q282-4.1 279.65 1.85Q277.3 7.8 275.3 18Q273.3 28.2 272.3 40.3Q278.9 28.2 282.85 18.95Q286.8 9.7 286.8 2.5Q286.8-0.7 286.05-2.4Q285.3-4.1 284-4.1ZM278.8 69.9Q281.9 69.9 284.3 67.3Q286.7 64.7 287.5 59.8Q284.4 57.7 282.75 54.3Q281.1 50.9 281.1 47.1Q281.1 45.7 281.5 43.3L281.2 43.3Q277.1 43.3 274.35 47.35Q271.6 51.4 271.6 58.2Q271.6 63.9 273.75 66.9Q275.9 69.9 278.8 69.9Z',
  },
  {
    char: 'o',
    d: 'M356.7 49.3Q358 49.3 358.7 50.6Q359.4 51.9 359.4 53.9Q359.4 58.7 356.5 59.6Q350.5 61.7 343.3 62Q341.4 70.4 335.8 75.45Q330.2 80.5 323.1 80.5Q317.1 80.5 312.85 77.6Q308.6 74.7 306.4 69.9Q304.2 65.1 304.2 59.5Q304.2 51.9 307.1 45.95Q310 40 315.1 36.65Q320.2 33.3 326.4 33.3Q334 33.3 338.65 38.55Q343.3 43.8 344.1 51.5Q348.8 51.2 355.3 49.5Q356.1 49.3 356.7 49.3ZM323.9 69.9Q327.1 69.9 329.45 67.3Q331.8 64.7 332.6 59.8Q329.5 57.7 327.85 54.3Q326.2 50.9 326.2 47.1Q326.2 45.5 326.5 43.9L326 43.9Q322 43.9 319.35 47.75Q316.7 51.6 316.7 58.6Q316.7 64.1 318.85 67Q321 69.9 323.9 69.9Z',
  },
  {
    char: 'o',
    d: 'M401.8 49.3Q403.1 49.3 403.8 50.6Q404.5 51.9 404.5 53.9Q404.5 58.7 401.6 59.6Q395.6 61.7 388.4 62Q386.5 70.4 380.9 75.45Q375.3 80.5 368.2 80.5Q362.2 80.5 357.95 77.6Q353.7 74.7 351.5 69.9Q349.3 65.1 349.3 59.5Q349.3 51.9 352.2 45.95Q355.1 40 360.2 36.65Q365.3 33.3 371.5 33.3Q379.1 33.3 383.75 38.55Q388.4 43.8 389.2 51.5Q393.9 51.2 400.4 49.5Q401.2 49.3 401.8 49.3ZM369 69.9Q372.2 69.9 374.55 67.3Q376.9 64.7 377.7 59.8Q374.6 57.7 372.95 54.3Q371.3 50.9 371.3 47.1Q371.3 45.5 371.6 43.9L371.1 43.9Q367.1 43.9 364.45 47.75Q361.8 51.6 361.8 58.6Q361.8 64.1 363.95 67Q366.1 69.9 369 69.9Z',
  },
]

// Timing: each letter draws in ~380ms, staggered by ~290ms
// Total ≈ 7×290 + 380 = 2410ms for all strokes to complete
const PER_LETTER_MS = 380
const STAGGER_MS = 290

const PAUSE_MS    = 1000  // hold after fully drawn
const FADE_OUT_MS = 500   // fade out before next loop

export function PeekabooBrand({ fontSize = '2.5rem' }) {
  const pathRefs  = useRef([])
  const lengthsRef = useRef([])
  const mountedRef = useRef(true)
  const timersRef  = useRef([])

  useEffect(() => {
    mountedRef.current = true

    // Respect prefers-reduced-motion — show static wordmark
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      pathRefs.current.forEach((path) => {
        if (!path) return
        path.style.fillOpacity = '1'
        path.style.strokeDasharray = 'none'
        path.style.strokeDashoffset = '0'
      })
      return
    }

    // Compute path lengths once
    lengthsRef.current = pathRefs.current.map((p) => (p ? p.getTotalLength() : 0))

    function runLoop() {
      if (!mountedRef.current) return

      const paths   = pathRefs.current
      const lengths = lengthsRef.current

      // Cancel any running animations and reset to hidden
      paths.forEach((path, i) => {
        if (!path) return
        path.getAnimations().forEach((a) => a.cancel())
        path.style.opacity        = '1'
        path.style.fillOpacity    = '0'
        path.style.strokeDasharray  = `${lengths[i]}`
        path.style.strokeDashoffset = `${lengths[i]}`
      })

      // Draw each letter in sequence
      paths.forEach((path, i) => {
        if (!path) return
        const len   = lengths[i]
        const delay = i * STAGGER_MS

        path.animate(
          [{ strokeDashoffset: len }, { strokeDashoffset: 0 }],
          { duration: PER_LETTER_MS, delay, fill: 'forwards', easing: 'cubic-bezier(0.4,0,0.2,1)' }
        )
        path.animate(
          [{ fillOpacity: 0 }, { fillOpacity: 0, offset: 0.25 }, { fillOpacity: 1 }],
          { duration: PER_LETTER_MS + 80, delay, fill: 'forwards', easing: 'ease-out' }
        )
      })

      // Time when the last letter finishes drawing
      const drawDone = (paths.length - 1) * STAGGER_MS + PER_LETTER_MS + 80

      // After draw + pause, fade all out together
      const t1 = setTimeout(() => {
        if (!mountedRef.current) return
        paths.forEach((path) => {
          if (!path) return
          path.animate(
            [{ opacity: 1 }, { opacity: 0 }],
            { duration: FADE_OUT_MS, fill: 'forwards', easing: 'ease-in-out' }
          )
        })

        // After fade-out, restart
        const t2 = setTimeout(() => {
          if (!mountedRef.current) return
          runLoop()
        }, FADE_OUT_MS)
        timersRef.current.push(t2)
      }, drawDone + PAUSE_MS)

      timersRef.current.push(t1)
    }

    runLoop()

    return () => {
      mountedRef.current = false
      timersRef.current.forEach(clearTimeout)
      pathRefs.current.forEach((path) => {
        if (path) path.getAnimations().forEach((a) => a.cancel())
      })
    }
  }, [])

  return (
    <svg
      viewBox="-0.4 -19.0 409.9 114.9"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="Peekaboo"
      role="img"
      style={{
        height: fontSize,
        width: 'auto',
        display: 'block',
        overflow: 'visible',
      }}
    >
      {LETTERS.map((letter, i) => (
        <path
          key={i}
          ref={(el) => { pathRefs.current[i] = el }}
          d={letter.d}
          fill="#121212"
          fillOpacity={0}
          stroke="#121212"
          strokeWidth={3}
          strokeLinejoin="round"
          strokeLinecap="round"
        />
      ))}
    </svg>
  )
}
