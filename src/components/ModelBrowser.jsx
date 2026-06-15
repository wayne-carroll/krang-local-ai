import { useEffect, useMemo, useState } from 'react'
import { MODEL_CATALOG, MODEL_CATEGORIES } from '../lib/modelCatalog.js'

/**
 * Modal "model browser". Lists a curated catalog of popular Ollama models with
 * descriptions and approximate sizes, and lets the user install any of them
 * with one click (which streams `ollama pull` progress back via `pulls`).
 *
 * Props:
 *   installedNames  Set<string> of installed model tags
 *   pulls           map of { [name]: { phase, percent, status, error } }
 *   onInstall(name)   start a pull
 *   onCancel(name)    abort an in-progress pull
 *   onUninstall(name) delete an installed model
 *   onClose()         close the modal
 */
export default function ModelBrowser({ installedNames, pulls, onInstall, onCancel, onUninstall, onClose }) {
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState('All')
  const [installedOnly, setInstalledOnly] = useState(false)

  // How many catalog models are currently installed (for the toggle label).
  const installedCount = useMemo(
    () => MODEL_CATALOG.filter((m) => installedNames.has(m.name)).length,
    [installedNames]
  )

  // Close on Escape.
  useEffect(() => {
    function onKey(e) {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onClose])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return MODEL_CATALOG.filter((m) => {
      if (installedOnly && !installedNames.has(m.name)) return false
      if (category !== 'All' && m.category !== category) return false
      if (!q) return true
      return (
        m.label.toLowerCase().includes(q) ||
        m.name.toLowerCase().includes(q) ||
        m.description.toLowerCase().includes(q)
      )
    })
  }, [query, category, installedOnly, installedNames])

  return (
    // Backdrop — clicking outside the panel closes.
    <div
      className="fixed inset-0 z-40 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
      onMouseDown={onClose}
    >
      <div
        className="hud-corner panel flex max-h-[85vh] w-full max-w-2xl animate-risefade flex-col overflow-hidden"
        onMouseDown={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-line/30 px-5 py-4">
          <div>
            <h2 className="wordmark text-sm font-bold text-fg">MODEL REGISTRY</h2>
            <p className="mt-0.5 font-mono text-[11px] text-faint">
              Pull models directly from Ollama · sizes approximate
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md p-1.5 text-muted transition-colors hover:bg-void-700 hover:text-krang"
          >
            <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path d="M6.3 5.3a1 1 0 011.4 0L10 7.6l2.3-2.3a1 1 0 111.4 1.4L11.4 9l2.3 2.3a1 1 0 01-1.4 1.4L10 10.4l-2.3 2.3a1 1 0 01-1.4-1.4L8.6 9 6.3 6.7a1 1 0 010-1.4z" />
            </svg>
          </button>
        </div>

        {/* Search + category filter */}
        <div className="space-y-3 border-b border-line/30 px-5 py-3">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="search models…"
            className="input-line w-full px-3 py-2 font-mono text-sm text-fg"
          />
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex flex-wrap gap-1.5">
              {['All', ...MODEL_CATEGORIES].map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setCategory(cat)}
                  className={`chip px-3 py-1 font-mono text-[11px] font-medium uppercase tracking-wide transition-colors ${
                    category === cat
                      ? 'chip-active'
                      : 'bg-void-800 text-muted hover:bg-void-700 hover:text-fg'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
            {/* Quick filter to show only what's already installed. */}
            <button
              type="button"
              onClick={() => setInstalledOnly((v) => !v)}
              aria-pressed={installedOnly}
              className={`chip inline-flex items-center gap-1.5 px-3 py-1 font-mono text-[11px] font-medium uppercase tracking-wide transition-colors ${
                installedOnly
                  ? 'chip-active'
                  : 'bg-void-800 text-muted hover:bg-void-700 hover:text-fg'
              }`}
            >
              <svg className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor">
                <path
                  fillRule="evenodd"
                  d="M16.7 5.3a1 1 0 010 1.4l-7.5 7.5a1 1 0 01-1.4 0l-3.5-3.5a1 1 0 011.4-1.4l2.8 2.79 6.8-6.79a1 1 0 011.4 0z"
                  clipRule="evenodd"
                />
              </svg>
              Installed ({installedCount})
            </button>
          </div>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto px-3 py-3">
          {filtered.length === 0 ? (
            <p className="px-2 py-6 text-center font-mono text-sm text-faint">
              {installedOnly && installedCount === 0
                ? 'No catalog models installed yet.'
                : 'No models match your search.'}
            </p>
          ) : (
            <ul className="space-y-1.5">
              {filtered.map((m) => (
                <ModelRow
                  key={m.name}
                  model={m}
                  installed={installedNames.has(m.name)}
                  pull={pulls[m.name]}
                  onInstall={() => onInstall(m.name)}
                  onCancel={() => onCancel(m.name)}
                  onUninstall={() => onUninstall(m.name)}
                />
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  )
}

function ModelRow({ model, installed, pull, onInstall, onCancel, onUninstall }) {
  const isPulling = pull && pull.phase === 'pulling'
  const isRemoving = pull && pull.phase === 'removing'
  const hasError = pull && pull.phase === 'error'

  return (
    <li className="rounded-sm bg-void-800/70 px-4 py-3 transition-colors hover:bg-void-700/50">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-sans font-semibold text-fg">{model.label}</span>
            <span className="chip px-1.5 py-0.5 font-mono text-[10px] uppercase tracking-wide text-krang/70">
              {model.category}
            </span>
          </div>
          <p className="mt-0.5 font-sans text-xs leading-snug text-muted">{model.description}</p>
          <p className="mt-1 font-mono text-[11px] text-faint">
            {model.name} · ~{model.size}
          </p>
        </div>

        {/* Action */}
        <div className="shrink-0">
          {isRemoving ? (
            <span className="chip inline-flex items-center px-2.5 py-1.5 font-mono text-[11px] font-medium uppercase tracking-wide text-muted">
              Removing…
            </span>
          ) : installed ? (
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1 rounded-sm bg-krang/10 px-2.5 py-1.5 font-mono text-[11px] font-medium uppercase tracking-wide text-krang-bright shadow-[inset_0_0_0_1px_rgb(var(--accent)/0.3)]">
                <svg className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor">
                  <path
                    fillRule="evenodd"
                    d="M16.7 5.3a1 1 0 010 1.4l-7.5 7.5a1 1 0 01-1.4 0l-3.5-3.5a1 1 0 011.4-1.4l2.8 2.79 6.8-6.79a1 1 0 011.4 0z"
                    clipRule="evenodd"
                  />
                </svg>
                Installed
              </span>
              <button
                type="button"
                onClick={onUninstall}
                title={`Uninstall ${model.name}`}
                className="btn-ghost p-1.5 text-muted hover:text-red-400"
              >
                <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                  <path
                    fillRule="evenodd"
                    d="M8.75 1a1 1 0 00-.95.69L7.41 3H4a.75.75 0 000 1.5h.36l.84 11.04A2.25 2.25 0 007.44 17.6h5.12a2.25 2.25 0 002.24-2.06L15.64 4.5H16A.75.75 0 0016 3h-3.41l-.39-1.31A1 1 0 0011.25 1h-2.5zM9 7a.75.75 0 011.5 0v6a.75.75 0 01-1.5 0V7zm-2.25.75a.75.75 0 011.5-.06l.25 6a.75.75 0 11-1.5.06l-.25-6zm6.5-.06a.75.75 0 00-1.5.06l-.25 6a.75.75 0 101.5.06l.25-6z"
                    clipRule="evenodd"
                  />
                </svg>
              </button>
            </div>
          ) : isPulling ? (
            <button
              type="button"
              onClick={onCancel}
              className="btn-ghost px-2.5 py-1.5 font-mono text-[11px] font-medium uppercase tracking-wide"
            >
              Cancel
            </button>
          ) : (
            <button
              type="button"
              onClick={onInstall}
              className="btn-primary px-3 py-1.5 font-mono text-[11px] font-semibold tracking-wide"
            >
              {hasError ? 'Retry' : 'Install'}
            </button>
          )}
        </div>
      </div>

      {/* Progress / error */}
      {isPulling && (
        <div className="mt-2.5">
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-void-700">
            <div
              className="h-full rounded-full bg-krang"
              style={{
                width: `${pull.percent || 0}%`,
                boxShadow: '0 0 8px rgb(var(--accent) / 0.6)',
                transition: 'width 0.3s ease',
              }}
            />
          </div>
          <p className="mt-1 truncate font-mono text-[11px] text-faint">
            {pull.status}
            {pull.percent ? ` · ${pull.percent}%` : ''}
          </p>
        </div>
      )}
      {hasError && (
        <p className="mt-2 font-mono text-[11px] text-krang-bright">Failed: {pull.error}</p>
      )}
    </li>
  )
}
