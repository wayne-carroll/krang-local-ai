import { useEffect, useState } from 'react'
import { THEMES } from '../lib/themes.js'
import {
  supportsWorkingFolder,
  pickWorkingFolder,
  clearWorkingFolder,
  getWorkingFolderName,
} from '../lib/fileSave.js'

/**
 * Settings modal with a left section nav. Sections:
 *   - Appearance: theme picker (live preview on click)
 *   - Data: export / clear all conversations
 *   - About: app info
 *
 * Props:
 *   theme            active theme id
 *   onThemeChange    (id) => void  (applies immediately)
 *   conversationCount number
 *   onExportAll      () => void
 *   onClearAll       () => void
 *   onClose          () => void
 */
const SECTIONS = [
  { id: 'appearance', label: 'Appearance' },
  { id: 'data', label: 'Data' },
  { id: 'about', label: 'About' },
]

export default function SettingsModal({
  theme,
  onThemeChange,
  conversationCount,
  onExportAll,
  onClearAll,
  onClose,
}) {
  const [section, setSection] = useState('appearance')

  useEffect(() => {
    function onKey(e) {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onClose])

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
      onMouseDown={onClose}
    >
      <div
        className="panel flex h-[460px] w-full max-w-2xl animate-risefade overflow-hidden"
        onMouseDown={(e) => e.stopPropagation()}
      >
        {/* Section nav */}
        <div className="flex w-44 shrink-0 flex-col border-r border-line/30 bg-void-900/60 p-3">
          <h2 className="wordmark px-2 pb-3 pt-1 text-xs text-fg">Settings</h2>
          {SECTIONS.map((s) => (
            <button
              key={s.id}
              type="button"
              onClick={() => setSection(s.id)}
              className={`rounded-md px-3 py-2 text-left font-mono text-xs uppercase tracking-wide transition-colors ${
                section === s.id
                  ? 'bg-krang/10 text-krang-bright'
                  : 'text-muted hover:bg-void-800 hover:text-fg'
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>

        {/* Panel */}
        <div className="relative flex-1 overflow-y-auto p-5">
          <button
            type="button"
            onClick={onClose}
            aria-label="Close settings"
            className="absolute right-4 top-4 rounded-md p-1.5 text-muted transition-colors hover:bg-void-700 hover:text-krang"
          >
            <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path d="M6.3 5.3a1 1 0 011.4 0L10 7.6l2.3-2.3a1 1 0 111.4 1.4L11.4 9l2.3 2.3a1 1 0 01-1.4 1.4L10 10.4l-2.3 2.3a1 1 0 01-1.4-1.4L8.6 9 6.3 6.7a1 1 0 010-1.4z" />
            </svg>
          </button>

          {section === 'appearance' && (
            <AppearancePanel theme={theme} onThemeChange={onThemeChange} />
          )}
          {section === 'data' && (
            <DataPanel
              conversationCount={conversationCount}
              onExportAll={onExportAll}
              onClearAll={onClearAll}
            />
          )}
          {section === 'about' && <AboutPanel />}
        </div>
      </div>
    </div>
  )
}

function AppearancePanel({ theme, onThemeChange }) {
  return (
    <div>
      <SectionTitle>Theme</SectionTitle>
      <p className="mb-4 font-sans text-sm text-muted">
        Choose a look. Changes apply instantly and are saved to this browser.
      </p>
      <div className="grid grid-cols-2 gap-3">
        {THEMES.map((t) => {
          const active = t.id === theme
          return (
            <button
              key={t.id}
              type="button"
              onClick={() => onThemeChange(t.id)}
              className={`group rounded-sm p-3 text-left transition-all ${
                active
                  ? 'shadow-[inset_0_0_0_1px_rgb(var(--accent))]'
                  : 'shadow-[inset_0_0_0_1px_rgb(var(--border-2)/0.3)] hover:shadow-[inset_0_0_0_1px_rgb(var(--border-2)/0.6)]'
              }`}
            >
              {/* Mini preview */}
              <div
                className="mb-2.5 flex h-16 items-end gap-1.5 rounded-sm p-2"
                style={{ background: t.swatch.bg }}
              >
                <span
                  className="h-full w-2/5 rounded-sm"
                  style={{ background: t.swatch.surface }}
                />
                <span className="flex-1" />
                <span
                  className="h-3 w-3 rounded-full"
                  style={{ background: t.swatch.accent }}
                />
              </div>
              <div className="flex items-center justify-between">
                <span className="font-display text-sm font-semibold text-fg">{t.name}</span>
                {active ? (
                  <span className="font-mono text-[10px] uppercase tracking-wide text-krang">
                    ● active
                  </span>
                ) : (
                  <span className="font-mono text-[10px] uppercase tracking-wide text-faint">
                    {t.type}
                  </span>
                )}
              </div>
              <p className="mt-0.5 font-sans text-xs text-muted">{t.blurb}</p>
            </button>
          )
        })}
      </div>
    </div>
  )
}

function DataPanel({ conversationCount, onExportAll, onClearAll }) {
  const [folder, setFolder] = useState(getWorkingFolderName())
  const folderSupported = supportsWorkingFolder()

  async function pickFolder() {
    try {
      setFolder(await pickWorkingFolder())
    } catch {
      // User dismissed the picker.
    }
  }
  function disconnectFolder() {
    clearWorkingFolder()
    setFolder(null)
  }

  return (
    <div>
      <SectionTitle>Data</SectionTitle>
      <p className="mb-4 font-sans text-sm text-muted">
        Conversations are stored only in this browser ({conversationCount} saved).
      </p>

      <div className="space-y-3">
        {folderSupported && (
          <Row
            title="Working folder"
            desc={
              folder
                ? `“Save” writes straight into “${folder}” (re-connect after reload).`
                : 'Connect a folder so Save writes files there instead of downloading.'
            }
          >
            {folder ? (
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={pickFolder}
                  className="btn-ghost px-3 py-1.5 font-mono text-[11px] font-semibold uppercase tracking-wide"
                >
                  Change
                </button>
                <button
                  type="button"
                  onClick={disconnectFolder}
                  className="btn-ghost px-3 py-1.5 font-mono text-[11px] font-semibold uppercase tracking-wide"
                >
                  Disconnect
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={pickFolder}
                className="btn-ghost px-3 py-1.5 font-mono text-[11px] font-semibold uppercase tracking-wide"
              >
                Connect…
              </button>
            )}
          </Row>
        )}
        <Row
          title="Export conversations"
          desc="Download all chats as a JSON backup file."
        >
          <button
            type="button"
            onClick={onExportAll}
            disabled={conversationCount === 0}
            className="btn-ghost px-3 py-1.5 font-mono text-[11px] font-semibold uppercase tracking-wide disabled:cursor-not-allowed disabled:opacity-40"
          >
            Export
          </button>
        </Row>

        <Row title="Delete all conversations" desc="Permanently clears every saved chat." danger>
          <button
            type="button"
            onClick={onClearAll}
            disabled={conversationCount === 0}
            className="rounded-md border border-krang/50 px-3 py-1.5 font-mono text-[11px] font-semibold uppercase tracking-wide text-krang-bright transition-colors hover:bg-krang hover:text-accent-contrast disabled:cursor-not-allowed disabled:opacity-40"
          >
            Delete all
          </button>
        </Row>
      </div>
    </div>
  )
}

function AboutPanel() {
  return (
    <div>
      <SectionTitle>About</SectionTitle>
      <div className="mt-2">
        <h3 className="wordmark text-xl text-fg">Krang</h3>
        <p className="mt-1 font-mono text-[11px] uppercase tracking-[0.2em] text-krang">
          Local AI · v1.0
        </p>
        <p className="mt-4 max-w-md font-sans text-sm leading-relaxed text-muted">
          A local chat interface for Ollama models. Every message, model, and conversation
          stays on your machine — nothing is sent to any server.
        </p>
        <p className="mt-3 font-sans text-sm text-muted">
          Requires{' '}
          <a
            href="https://ollama.com"
            target="_blank"
            rel="noreferrer"
            className="text-krang-bright underline underline-offset-2"
          >
            Ollama
          </a>{' '}
          running locally at <span className="font-mono text-faint">localhost:11434</span>.
        </p>
      </div>
    </div>
  )
}

function SectionTitle({ children }) {
  return (
    <h3 className="mb-2 font-display text-lg font-bold uppercase tracking-tight text-fg">
      {children}
    </h3>
  )
}

function Row({ title, desc, danger, children }) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-sm bg-void-800/50 px-4 py-3">
      <div className="min-w-0">
        <p className={`font-sans text-sm font-medium ${danger ? 'text-krang-bright' : 'text-fg'}`}>
          {title}
        </p>
        <p className="font-sans text-xs text-muted">{desc}</p>
      </div>
      <div className="shrink-0">{children}</div>
    </div>
  )
}
