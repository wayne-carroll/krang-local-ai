import { useEffect, useState } from 'react'

/**
 * Modal for creating or editing a custom skill (persona). A skill is just a
 * name + a system prompt. `initial` is the skill being edited, or null/{} for a
 * new one. Calls onSave({ id?, name, system }) or onDelete(id).
 */
export default function SkillEditor({ initial, onSave, onDelete, onClose }) {
  const editing = Boolean(initial?.id)
  const [name, setName] = useState(initial?.name || '')
  const [system, setSystem] = useState(initial?.system || '')

  useEffect(() => {
    function onKey(e) {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onClose])

  const canSave = name.trim() && system.trim()

  function save() {
    if (!canSave) return
    onSave({ id: initial?.id, name: name.trim(), system: system.trim() })
  }

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
      onMouseDown={onClose}
    >
      <div
        className="panel flex w-full max-w-lg animate-risefade flex-col overflow-hidden"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-line/30 px-5 py-4">
          <h2 className="wordmark text-sm font-bold text-fg">
            {editing ? 'Edit skill' : 'New skill'}
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="rounded-md p-1.5 text-muted transition-colors hover:bg-void-700 hover:text-krang"
          >
            <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path d="M6.3 5.3a1 1 0 011.4 0L10 7.6l2.3-2.3a1 1 0 111.4 1.4L11.4 9l2.3 2.3a1 1 0 01-1.4 1.4L10 10.4l-2.3 2.3a1 1 0 01-1.4-1.4L8.6 9 6.3 6.7a1 1 0 010-1.4z" />
            </svg>
          </button>
        </div>

        <div className="space-y-4 px-5 py-4">
          <label className="block">
            <span className="font-mono text-[11px] uppercase tracking-wide text-muted">name</span>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. SQL Analyst"
              autoFocus
              className="input-line mt-1 w-full px-3 py-2 font-sans text-sm text-fg"
            />
          </label>

          <label className="block">
            <span className="font-mono text-[11px] uppercase tracking-wide text-muted">
              system prompt
            </span>
            <textarea
              value={system}
              onChange={(e) => setSystem(e.target.value)}
              placeholder="Describe the role, tone, and output format the model should adopt…"
              rows={7}
              className="input-line mt-1 w-full resize-y px-3 py-2 font-sans text-sm leading-relaxed text-fg"
            />
          </label>
          <p className="font-mono text-[10px] leading-snug text-faint">
            Auto-loaded as the conversation’s system message when this skill is selected.
          </p>
        </div>

        <div className="flex items-center justify-between border-t border-line/30 px-5 py-3">
          {editing ? (
            <button
              type="button"
              onClick={() => onDelete(initial.id)}
              className="btn-ghost px-3 py-1.5 font-mono text-[11px] font-semibold uppercase tracking-wide text-muted hover:text-red-400"
            >
              Delete
            </button>
          ) : (
            <span />
          )}
          <div className="flex gap-2">
            <button
              type="button"
              onClick={onClose}
              className="btn-ghost px-3 py-1.5 font-mono text-[11px] font-semibold uppercase tracking-wide"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={save}
              disabled={!canSave}
              className="btn-primary px-4 py-1.5 font-mono text-[11px] font-semibold tracking-wide disabled:bg-none disabled:bg-void-800 disabled:text-faint"
            >
              Save
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
