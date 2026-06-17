import { useEffect, useRef, useState } from 'react'
import { DEFAULT_PARAMS, hasCustomParams } from '../lib/params.js'

/**
 * Header control for the active conversation's generation parameters
 * (temperature, top_p, seed, stop sequences). A sliders-icon button opens a
 * popover; changes are reported up via onChange and applied on the next send.
 */
export default function ParamsPopover({ params, onChange, disabled }) {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)
  const custom = hasCustomParams(params)

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

  // Update one field immutably; null/empty clears it back to the model default.
  const set = (key, value) => onChange({ ...params, [key]: value })

  // stop sequences are stored as an array; edited as a comma-separated string.
  const stopText = (params.stop || []).join(', ')
  const setStop = (text) =>
    set(
      'stop',
      text
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean)
    )

  // Parse a numeric field; empty string clears to null (model default).
  const num = (v) => (v === '' ? null : Number(v))

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen((o) => !o)}
        title="Generation parameters"
        aria-label="Generation parameters"
        className="btn-ghost relative flex h-8 items-center gap-1.5 px-2.5 disabled:cursor-not-allowed disabled:opacity-50"
      >
        <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
          <path d="M5 3a1 1 0 011 1v3.05a2.5 2.5 0 010 4.9V16a1 1 0 11-2 0v-4.05a2.5 2.5 0 010-4.9V4a1 1 0 011-1zm10 0a1 1 0 011 1v.05a2.5 2.5 0 010 4.9V16a1 1 0 11-2 0V8.95a2.5 2.5 0 010-4.9V4a1 1 0 011-1zm-5 5a1 1 0 011 1v.05a2.5 2.5 0 010 4.9V16a1 1 0 11-2 0v-1.05a2.5 2.5 0 010-4.9V9a1 1 0 011-1z" />
        </svg>
        {/* Dot indicator when any param is customized. */}
        {custom && (
          <span className="absolute right-1 top-1 h-1.5 w-1.5 rounded-full bg-krang shadow-glow-sm" />
        )}
      </button>

      {open && (
        <div className="panel absolute right-0 z-20 mt-2 w-72 animate-risefade p-3 text-sm">
          <div className="mb-2 flex items-center justify-between">
            <span className="font-mono text-[11px] uppercase tracking-wider text-krang/80">
              parameters
            </span>
            {custom && (
              <button
                type="button"
                onClick={() => onChange({ ...DEFAULT_PARAMS })}
                className="font-mono text-[10px] uppercase tracking-wide text-muted hover:text-krang"
              >
                reset
              </button>
            )}
          </div>

          {/* Temperature */}
          <Slider
            label="temperature"
            value={params.temperature}
            min={0}
            max={2}
            step={0.1}
            fallback={0.8}
            onChange={(v) => set('temperature', v)}
          />
          {/* top_p */}
          <Slider
            label="top_p"
            value={params.top_p}
            min={0}
            max={1}
            step={0.05}
            fallback={0.9}
            onChange={(v) => set('top_p', v)}
          />

          {/* Seed */}
          <label className="mt-3 flex items-center justify-between gap-2">
            <span className="font-mono text-[11px] uppercase tracking-wide text-muted">seed</span>
            <input
              type="number"
              value={params.seed ?? ''}
              placeholder="random"
              onChange={(e) => set('seed', num(e.target.value))}
              className="input-line w-28 px-2 py-1 text-right font-mono text-xs text-fg"
            />
          </label>

          {/* Stop sequences */}
          <label className="mt-3 block">
            <span className="font-mono text-[11px] uppercase tracking-wide text-muted">
              stop sequences
            </span>
            <input
              type="text"
              value={stopText}
              placeholder="comma,separated"
              onChange={(e) => setStop(e.target.value)}
              className="input-line mt-1 w-full px-2 py-1 font-mono text-xs text-fg"
            />
          </label>

          <p className="mt-3 font-mono text-[10px] leading-snug text-faint">
            Blank = the model’s default. A fixed seed makes runs reproducible.
          </p>
        </div>
      )}
    </div>
  )
}

// A labeled slider whose value can be "unset" (model default). Enabling it
// seeds a sensible starting value; the ✕ clears it back to default.
function Slider({ label, value, min, max, step, fallback, onChange }) {
  const active = value != null
  return (
    <label className="mt-3 block">
      <span className="flex items-center justify-between">
        <span className="font-mono text-[11px] uppercase tracking-wide text-muted">{label}</span>
        <span className="flex items-center gap-2">
          <span className="font-mono text-xs tabular-nums text-fg">
            {active ? value : 'default'}
          </span>
          {active && (
            <button
              type="button"
              onClick={() => onChange(null)}
              title={`Reset ${label}`}
              aria-label={`Reset ${label}`}
              className="font-mono text-[10px] text-muted hover:text-krang"
            >
              ✕
            </button>
          )}
        </span>
      </span>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={active ? value : fallback}
        onChange={(e) => onChange(Number(e.target.value))}
        className="mt-1 w-full accent-krang"
      />
    </label>
  )
}
