import { useEffect, useRef, useState } from 'react'
import { SKILLS, getSkill } from '../lib/skills.js'

/**
 * Header dropdown for choosing the active "skill" (persona) for the current
 * conversation. Selecting one auto-loads its system prompt on the next send.
 * Mirrors ModelPicker's popover so the two controls feel consistent.
 */
export default function SkillPicker({ selected, onSelect, disabled }) {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)
  const active = getSkill(selected)

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

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen((o) => !o)}
        title="Skill / persona — sets a system prompt for this chat"
        className="btn-ghost flex h-8 items-center gap-1.5 px-2.5 font-mono text-xs font-medium disabled:cursor-not-allowed disabled:opacity-50"
      >
        {/* Spark/persona glyph */}
        <svg className="h-3.5 w-3.5 shrink-0 text-krang" viewBox="0 0 20 20" fill="currentColor">
          <path d="M10 1l1.6 4.9a3 3 0 001.9 1.9L18.4 9.4a.3.3 0 010 .57l-4.9 1.6a3 3 0 00-1.9 1.9L10 18.4a.3.3 0 01-.57 0l-1.6-4.9a3 3 0 00-1.9-1.9L1.04 9.97a.3.3 0 010-.57l4.9-1.6a3 3 0 001.9-1.9L10 1z" />
        </svg>
        <span className="max-w-[160px] truncate">{active.name}</span>
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

      {open && (
        <div className="panel absolute right-0 z-20 mt-2 max-h-[70vh] w-72 animate-risefade overflow-y-auto p-1">
          <p className="px-3 py-1.5 font-mono text-[10px] uppercase tracking-[0.2em] text-faint">
            // skill · sets a system prompt
          </p>
          {SKILLS.map((s) => {
            const isActive = s.id === selected
            return (
              <button
                key={s.id}
                type="button"
                onClick={() => {
                  onSelect(s.id)
                  setOpen(false)
                }}
                className={`flex w-full flex-col items-start gap-0.5 rounded-md px-3 py-2 text-left transition-colors ${
                  isActive ? 'bg-krang/10 shadow-hud' : 'hover:bg-void-800'
                }`}
              >
                <span className="flex w-full items-center justify-between gap-2">
                  <span className="truncate font-sans text-sm font-medium text-fg">{s.name}</span>
                  {isActive && (
                    <span className="shrink-0 font-mono text-[10px] uppercase tracking-wider text-krang">
                      active
                    </span>
                  )}
                </span>
                <span className="font-sans text-xs leading-snug text-faint">{s.blurb}</span>
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
