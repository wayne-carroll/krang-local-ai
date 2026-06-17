import { useEffect, useRef, useState } from 'react'
import { DEFAULT_PARAMS, hasCustomParams } from '../lib/params.js'

// Plain-language "response style" presets. Each maps to a temperature; Balanced
// is the model default (null). This is the everyday control; the raw knobs live
// under Advanced for anyone who wants them.
const PRESETS = [
  { id: 'focused', name: 'Focused', temp: 0.3, hint: 'Precise and consistent. Best for facts, code, and structured tasks.' },
  { id: 'balanced', name: 'Balanced', temp: null, hint: 'The model default: a good all-round mix.' },
  { id: 'creative', name: 'Creative', temp: 1.2, hint: 'More varied and imaginative. Best for brainstorming and writing.' },
]

function activePresetId(temp) {
  if (temp == null) return 'balanced'
  const match = PRESETS.find((p) => p.temp != null && Math.abs(p.temp - temp) < 0.001)
  return match ? match.id : null // null = a custom temperature set in Advanced
}

/**
 * Header control for the active conversation's generation settings. The main
 * view is a plain-language "response style"; raw parameters (temperature,
 * top_p, seed, stop) are tucked under an Advanced section.
 */
export default function ParamsPopover({ params, onChange, disabled }) {
  const [open, setOpen] = useState(false)
  const [advanced, setAdvanced] = useState(false)
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

  const set = (key, value) => onChange({ ...params, [key]: value })
  const num = (v) => (v === '' ? null : Number(v))

  const stopText = (params.stop || []).join(', ')
  const setStop = (text) =>
    set(
      'stop',
      text
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean)
    )

  const presetId = activePresetId(params.temperature)
  const activeHint = PRESETS.find((p) => p.id === presetId)?.hint

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen((o) => !o)}
        title="Response style and parameters"
        aria-label="Response style and parameters"
        className="btn-ghost relative flex h-8 items-center gap-1.5 px-2.5 disabled:cursor-not-allowed disabled:opacity-50"
      >
        <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
          <path d="M5 3a1 1 0 011 1v3.05a2.5 2.5 0 010 4.9V16a1 1 0 11-2 0v-4.05a2.5 2.5 0 010-4.9V4a1 1 0 011-1zm10 0a1 1 0 011 1v.05a2.5 2.5 0 010 4.9V16a1 1 0 11-2 0V8.95a2.5 2.5 0 010-4.9V4a1 1 0 011-1zm-5 5a1 1 0 011 1v.05a2.5 2.5 0 010 4.9V16a1 1 0 11-2 0v-1.05a2.5 2.5 0 010-4.9V9a1 1 0 011-1z" />
        </svg>
        {custom && (
          <span className="absolute right-1 top-1 h-1.5 w-1.5 rounded-full bg-krang shadow-glow-sm" />
        )}
      </button>

      {open && (
        <div className="panel absolute right-0 z-20 mt-2 w-72 animate-risefade p-3 text-sm">
          <div className="mb-1 flex items-center justify-between">
            <span className="font-mono text-[11px] uppercase tracking-wider text-krang/80">
              response style
            </span>
            {custom && (
              <button
                type="button"
                onClick={() => {
                  onChange({ ...DEFAULT_PARAMS })
                  setAdvanced(false)
                }}
                className="font-mono text-[10px] uppercase tracking-wide text-muted hover:text-krang"
              >
                reset
              </button>
            )}
          </div>
          <p className="mb-2.5 font-sans text-[11px] leading-snug text-faint">
            How creative the model is when it answers this chat.
          </p>

          {/* Preset chips */}
          <div className="flex gap-1.5">
            {PRESETS.map((p) => {
              const isActive = p.id === presetId
              return (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => set('temperature', p.temp)}
                  className={`chip flex-1 px-2 py-1.5 font-mono text-[11px] font-medium uppercase tracking-wide transition-colors ${
                    isActive ? 'chip-active' : 'bg-void-800 text-muted hover:bg-void-700 hover:text-fg'
                  }`}
                >
                  {p.name}
                </button>
              )
            })}
          </div>
          <p className="mt-2 min-h-[2.4em] font-sans text-[11px] leading-snug text-muted">
            {presetId ? activeHint : 'Custom temperature set below.'}
          </p>

          {/* Advanced toggle */}
          <button
            type="button"
            onClick={() => setAdvanced((a) => !a)}
            className="mt-1 flex w-full items-center gap-1.5 border-t border-line/30 pt-2.5 font-mono text-[10px] uppercase tracking-wide text-muted transition-colors hover:text-krang"
          >
            <svg
              className={`h-3 w-3 transition-transform ${advanced ? 'rotate-90' : ''}`}
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path d="M7 5l6 5-6 5V5z" />
            </svg>
            Advanced settings
          </button>

          {advanced && (
            <div className="mt-1">
              <Slider
                label="temperature"
                info="How random the output is. Low (around 0.2) = focused and predictable; high (1.2+) = creative and varied. The presets above just set this."
                value={params.temperature}
                min={0}
                max={2}
                step={0.1}
                fallback={0.8}
                onChange={(v) => set('temperature', v)}
              />
              <Slider
                label="top_p"
                info="Nucleus sampling: limits word choices to the most likely options. Lower = narrower and safer, higher = more diverse. Tip: adjust temperature OR top_p, not both."
                value={params.top_p}
                min={0}
                max={1}
                step={0.05}
                fallback={0.9}
                onChange={(v) => set('top_p', v)}
              />

              <label className="mt-3 flex items-center justify-between gap-2">
                <ParamLabel info="Set a number to get the exact same answer every time for the same prompt (reproducible runs). Leave blank for fresh, varied answers.">
                  seed
                </ParamLabel>
                <input
                  type="number"
                  value={params.seed ?? ''}
                  placeholder="random"
                  onChange={(e) => set('seed', num(e.target.value))}
                  className="input-line w-28 px-2 py-1 text-right font-mono text-xs text-fg"
                />
              </label>

              <label className="mt-3 block">
                <ParamLabel info="Words or phrases that make the model stop generating the moment they appear. Separate multiple with commas. Leave blank for normal stopping.">
                  stop sequences
                </ParamLabel>
                <input
                  type="text"
                  value={stopText}
                  placeholder="comma,separated"
                  onChange={(e) => setStop(e.target.value)}
                  className="input-line mt-1 w-full px-2 py-1 font-mono text-xs text-fg"
                />
              </label>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// A labeled slider whose value can be "unset" (model default). Enabling it
// seeds a sensible starting value; the clear button resets to default.
function Slider({ label, info, value, min, max, step, fallback, onChange }) {
  const active = value != null
  return (
    <label className="mt-3 block">
      <span className="flex items-center justify-between">
        <ParamLabel info={info}>{label}</ParamLabel>
        <span className="flex items-center gap-2">
          <span className="font-mono text-xs tabular-nums text-fg">{active ? value : 'default'}</span>
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

// A parameter label with an optional "?" info button. The explanation shows on
// hover or keyboard focus, positioned to extend left so it stays on-screen.
function ParamLabel({ info, children }) {
  return (
    <span className="flex items-center gap-1.5">
      <span className="font-mono text-[11px] uppercase tracking-wide text-muted">{children}</span>
      {info && (
        <span className="group/info relative inline-flex">
          <button
            type="button"
            aria-label={`What is ${children}?`}
            className="flex h-3.5 w-3.5 items-center justify-center rounded-full text-[9px] font-bold leading-none text-faint ring-1 ring-inset ring-current/50 transition-colors hover:text-krang"
          >
            ?
          </button>
          <span
            role="tooltip"
            className="pointer-events-none absolute right-0 top-5 z-30 w-56 rounded-sm bg-void-950 p-2 text-left font-sans text-[11px] normal-case leading-snug text-fg-soft opacity-0 shadow-[0_8px_24px_rgb(0_0_0/0.5)] ring-1 ring-inset ring-[rgb(var(--border-2)/0.5)] transition-opacity duration-150 group-hover/info:opacity-100 group-focus-within/info:opacity-100"
          >
            {info}
          </span>
        </span>
      )}
    </span>
  )
}
