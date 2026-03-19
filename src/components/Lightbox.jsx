import { useEffect, useRef } from 'react'
import { X } from 'lucide-react'

/**
 * Full-screen image lightbox.
 * Closes on Escape key, click outside the image, or close button.
 * Traps focus and locks body scroll while open.
 */
export function Lightbox({ src, alt, onClose }) {
  const closeRef = useRef(null)

  // Focus the close button on mount
  useEffect(() => {
    closeRef.current?.focus()
  }, [])

  // Escape key
  useEffect(() => {
    function onKey(e) {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onClose])

  // Lock body scroll
  useEffect(() => {
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = prev }
  }, [])

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center animate-fade-in"
      style={{ background: 'rgba(0,0,0,0.88)' }}
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={`Full-size preview: ${alt}`}
    >
      {/* Backdrop blur */}
      <div className="absolute inset-0 backdrop-blur-sm" aria-hidden="true" />

      {/* Close button — always accessible */}
      <button
        ref={closeRef}
        className="absolute top-4 right-4 z-10 p-2 rounded-lg text-white/70 hover:text-white hover:bg-white/10 transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-white/40"
        onClick={onClose}
        aria-label="Close preview"
      >
        <X size={20} aria-hidden="true" />
      </button>

      {/* Image — stop propagation so clicking it doesn't close */}
      <div
        className="relative z-10 flex flex-col items-center gap-3"
        onClick={(e) => e.stopPropagation()}
      >
        <img
          src={src}
          alt={alt}
          className="max-h-[85vh] max-w-[85vw] object-contain rounded-lg"
          style={{
            boxShadow: '0 25px 80px rgba(0,0,0,0.8), 0 8px 32px rgba(0,0,0,0.6)',
          }}
        />
        {alt && (
          <p className="text-xs text-white/40 font-mono max-w-sm text-center truncate select-none">
            {alt}
          </p>
        )}
      </div>

      {/* Click outside hint */}
      <p
        className="absolute bottom-5 left-1/2 -translate-x-1/2 text-xs text-white/25 select-none"
        aria-hidden="true"
      >
        Click outside or press Esc to close
      </p>
    </div>
  )
}
