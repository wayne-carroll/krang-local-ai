import { useEffect, useRef, useState } from 'react'
import { formatTokens, COMPACT_THRESHOLD } from '../lib/tokens.js'

// Visual thresholds for the ring intensity and "compact recommended" hint.
// DANGER (red + auto-compact) is the shared COMPACT_THRESHOLD so the warning
// and the action stay in lockstep.
const WARN_RATIO = 0.6
const DANGER_RATIO = COMPACT_THRESHOLD

// Accent-tinted ring; intensifies toward the limit. Uses theme CSS vars so it
// follows the active theme.
function ringColor(ratio) {
  return ratio >= DANGER_RATIO ? 'rgb(var(--accent-strong))' : 'rgb(var(--accent))'
}

/**
 * Header widget: a circular gauge showing how full the model's context window
 * is (used tokens vs. num_ctx). Clicking it opens a popover with exact counts,
 * a window-size selector, a Compact button, and an Auto-compact toggle.
 */
export default function ContextGauge({
  used,
  limit,
  windowOptions,
  onChangeWindow,
  onCompact,
  canCompact,
  isCompacting,
  autoCompact,
  onToggleAuto,
  approximate,
}) {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)

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

  const ratio = limit > 0 ? Math.min(used / limit, 1) : 0
  const pct = Math.round(ratio * 100)
  const color = ringColor(ratio)
  const nearFull = ratio >= DANGER_RATIO

  // SVG ring geometry. Keep `size` comfortably under the button's h-8 (32px)
  // so the ring doesn't touch the top/bottom edges.
  const size = 22
  const stroke = 3
  const r = (size - stroke) / 2
  const circumference = 2 * Math.PI * r
  const dash = circumference * ratio

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        title="Context window usage"
        className="btn-ghost flex h-8 items-center gap-2 px-2.5"
      >
        <span
          className={`relative inline-flex ${nearFull ? 'animate-pulseglow' : ''}`}
          style={{ width: size, height: size }}
        >
          <svg width={size} height={size} className="-rotate-90">
            <circle
              cx={size / 2}
              cy={size / 2}
              r={r}
              fill="none"
              strokeWidth={stroke}
              style={{ stroke: 'rgb(var(--border))' }}
            />
            <circle
              cx={size / 2}
              cy={size / 2}
              r={r}
              fill="none"
              strokeWidth={stroke}
              strokeLinecap="round"
              strokeDasharray={`${dash} ${circumference}`}
              style={{ stroke: color, transition: 'stroke-dasharray 0.4s ease, stroke 0.4s ease' }}
            />
          </svg>
          <span
            className="absolute inset-0 flex items-center justify-center font-mono text-[9px] font-semibold tabular-nums"
            style={{ color }}
          >
            {pct}
          </span>
        </span>
        <span className="hidden font-mono text-xs text-muted sm:block">
          {formatTokens(used)}/{formatTokens(limit)}
        </span>
      </button>

      {open && (
        <div className="panel absolute right-0 z-20 mt-2 w-72 animate-risefade p-3 text-sm">
          <div className="mb-2 flex items-center justify-between">
            <span className="font-mono text-[11px] uppercase tracking-wider text-krang/80">context buffer</span>
            <span className="font-mono tabular-nums text-muted">
              {used.toLocaleString()} / {limit.toLocaleString()}
            </span>
          </div>

          {/* Linear bar mirrors the ring. */}
          <div className="h-2 w-full overflow-hidden rounded-full bg-void-700">
            <div
              className="h-full rounded-full"
              style={{
                width: `${pct}%`,
                backgroundColor: color,
                boxShadow: `0 0 8px ${color}`,
                transition: 'width 0.4s ease',
              }}
            />
          </div>
          <p className="mt-1.5 font-mono text-[11px] text-faint">
            {pct}% used{approximate ? ' · est.' : ''}
            {nearFull && <span className="text-krang"> · compact recommended</span>}
          </p>

          {/* Window-size selector — controls the num_ctx sent to Ollama. */}
          <label className="mt-3 flex items-center justify-between gap-2">
            <span className="font-mono text-[11px] uppercase tracking-wide text-muted">window · num_ctx</span>
            <select
              value={limit}
              onChange={(e) => onChangeWindow(Number(e.target.value))}
              className="input-line px-2 py-1 font-mono text-xs text-fg"
            >
              {windowOptions.map((w) => (
                <option key={w} value={w}>
                  {formatTokens(w)} tok
                </option>
              ))}
            </select>
          </label>
          <p className="mt-1 font-mono text-[10px] leading-snug text-faint">
            Larger windows use more memory and run slower locally.
          </p>

          {/* Auto-compact toggle. */}
          <label className="mt-3 flex cursor-pointer items-center justify-between">
            <span className="font-mono text-[11px] uppercase tracking-wide text-muted">
              auto-compact @ {Math.round(DANGER_RATIO * 100)}%
            </span>
            <input
              type="checkbox"
              checked={autoCompact}
              onChange={(e) => onToggleAuto(e.target.checked)}
              className="h-4 w-4 accent-krang"
            />
          </label>

          {/* Manual compact. */}
          <button
            type="button"
            onClick={onCompact}
            disabled={!canCompact}
            className="btn-primary mt-3 flex w-full items-center justify-center gap-2 px-3 py-2 font-mono text-xs font-semibold tracking-wider disabled:bg-none disabled:bg-void-800 disabled:text-faint"
          >
            {isCompacting ? (
              <>
                <Spinner /> compacting…
              </>
            ) : (
              'compact buffer'
            )}
          </button>
          <p className="mt-1.5 font-mono text-[10px] leading-snug text-faint">
            Summarizes older messages, keeping recent turns intact, to free context.
          </p>
        </div>
      )}
    </div>
  )
}

function Spinner() {
  return (
    <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-90" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
    </svg>
  )
}
