import { useEffect, useRef, useState } from 'react'
import { describeModel, categorizeModel } from '../lib/modelDescriptions.js'

/**
 * Custom dropdown for selecting the active model. We use a custom popover
 * rather than a native <select> so each option can show a two-line layout:
 * the model name plus its human-readable description from the lookup table.
 */
export default function ModelPicker({ models, selected, onSelect, disabled }) {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)

  // Close on outside click / Escape.
  useEffect(() => {
    if (!open) return
    function onDocClick(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false)
    }
    function onKey(e) {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', onDocClick)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDocClick)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  const hasModels = models.length > 0

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        disabled={disabled || !hasModels}
        onClick={() => setOpen((o) => !o)}
        className="flex h-8 items-center gap-2 rounded-md border border-void-600 bg-void-800 px-3 font-mono text-xs font-medium text-fg transition-all hover:border-krang/60 hover:shadow-glow-sm disabled:cursor-not-allowed disabled:opacity-50"
      >
        <span className="h-1.5 w-1.5 rounded-full bg-krang shadow-glow-sm" />
        <span className="max-w-[200px] truncate">
          {selected || (hasModels ? 'select model' : 'no models')}
        </span>
        <svg
          className={`h-4 w-4 shrink-0 text-krang transition-transform ${open ? 'rotate-180' : ''}`}
          viewBox="0 0 20 20"
          fill="currentColor"
        >
          <path
            fillRule="evenodd"
            d="M5.23 7.21a.75.75 0 011.06.02L10 11.17l3.71-3.94a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z"
            clipRule="evenodd"
          />
        </svg>
      </button>

      {open && hasModels && (
        <div className="absolute right-0 z-20 mt-2 max-h-[70vh] w-80 animate-risefade overflow-y-auto rounded-lg border border-void-600 bg-void-850 p-1 shadow-glow-lg">
          {models.map((m) => {
            const isActive = m.name === selected
            return (
              <button
                key={m.name}
                type="button"
                onClick={() => {
                  onSelect(m.name)
                  setOpen(false)
                }}
                className={`flex w-full flex-col items-start gap-0.5 rounded-md px-3 py-2 text-left transition-colors ${
                  isActive ? 'bg-krang/10 shadow-hud' : 'hover:bg-void-800'
                }`}
              >
                <span className="flex w-full items-center justify-between gap-2">
                  <span className="truncate font-mono text-sm font-medium text-fg">{m.name}</span>
                  <span className="flex shrink-0 items-center gap-2">
                    {/* Coarse category, matched fuzzily from the model name. */}
                    <span className="rounded border border-void-600 px-1.5 py-0.5 font-mono text-[10px] uppercase tracking-wide text-krang/70">
                      {categorizeModel(m.name)}
                    </span>
                    {isActive && (
                      <span className="font-mono text-[10px] uppercase tracking-wider text-krang">
                        active
                      </span>
                    )}
                  </span>
                </span>
                <span className="font-sans text-xs leading-snug text-faint">
                  {describeModel(m.name)}
                </span>
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
