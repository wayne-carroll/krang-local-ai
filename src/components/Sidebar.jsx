import { useMemo, useState } from 'react'

/**
 * Left sidebar listing saved conversations. Fixed 260px width.
 * Conversation titles are derived (in App) from the first user message.
 * A search box filters by title and message text (client-side).
 */
export default function Sidebar({ conversations, activeId, onNew, onSelect, onDelete, onOpenSettings }) {
  const [query, setQuery] = useState('')

  // Filter on title or any user/assistant message body. Cheap, fully local.
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return conversations
    return conversations.filter((c) => {
      if ((c.title || '').toLowerCase().includes(q)) return true
      return c.messages?.some(
        (m) =>
          (m.role === 'user' || m.role === 'assistant') &&
          m.content.toLowerCase().includes(q)
      )
    })
  }, [conversations, query])

  return (
    <aside className="flex h-full w-[260px] shrink-0 flex-col bg-void-850/70 shadow-[inset_-1px_0_0_rgb(var(--border-2)/0.18)] backdrop-blur-sm">
      <div className="p-3">
        <button
          type="button"
          onClick={onNew}
          className="btn-primary group flex w-full items-center justify-center gap-2 px-3 py-2 font-mono text-xs font-semibold tracking-wider"
        >
          <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
            <path d="M10 4a.75.75 0 01.75.75v4.5h4.5a.75.75 0 010 1.5h-4.5v4.5a.75.75 0 01-1.5 0v-4.5h-4.5a.75.75 0 010-1.5h4.5v-4.5A.75.75 0 0110 4z" />
          </svg>
          New Chat
        </button>
      </div>

      {/* Search */}
      {conversations.length > 0 && (
        <div className="px-3 pb-2">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="search chats…"
            className="input-line w-full px-2.5 py-1.5 font-mono text-xs text-fg"
          />
        </div>
      )}

      <div className="px-3 pb-1.5">
        <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-faint">
          // sessions
        </span>
      </div>

      <div className="flex-1 overflow-y-auto px-2 pb-3">
        {conversations.length === 0 ? (
          <p className="px-2 py-4 font-mono text-xs text-faint">No conversations yet.</p>
        ) : filtered.length === 0 ? (
          <p className="px-2 py-4 font-mono text-xs text-faint">No chats match “{query}”.</p>
        ) : (
          <ul className="space-y-0.5">
            {filtered.map((c) => {
              const isActive = c.id === activeId
              return (
                <li key={c.id}>
                  <div
                    className={`group relative flex items-center gap-2 rounded-md px-2 py-2 transition-colors ${
                      isActive
                        ? 'bg-krang/10 text-fg shadow-hud'
                        : 'text-muted hover:bg-void-800'
                    }`}
                  >
                    {/* Active indicator bar. */}
                    {isActive && (
                      <span className="absolute left-0 top-1/2 h-5 w-0.5 -translate-y-1/2 rounded-full bg-krang shadow-glow-sm" />
                    )}
                    <button
                      type="button"
                      onClick={() => onSelect(c.id)}
                      className="min-w-0 flex-1 truncate text-left text-sm"
                      title={c.title}
                    >
                      {c.title || 'New Chat'}
                    </button>
                    <button
                      type="button"
                      onClick={() => onDelete(c.id)}
                      title="Delete conversation"
                      aria-label={`Delete conversation: ${c.title || 'New Chat'}`}
                      className="shrink-0 rounded p-1 text-faint opacity-0 transition-all hover:text-krang group-hover:opacity-100"
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
                </li>
              )
            })}
          </ul>
        )}
      </div>

      {/* Footer: settings (gear) + local-only note. */}
      <div className="p-2 shadow-[inset_0_1px_0_rgb(var(--border-2)/0.18)]">
        <button
          type="button"
          onClick={onOpenSettings}
          className="group flex w-full items-center gap-2.5 rounded-md px-2.5 py-2 text-muted transition-colors hover:bg-void-800 hover:text-fg"
        >
          <svg
            className="h-4 w-4 transition-transform duration-500 group-hover:rotate-90"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="12" cy="12" r="3" />
            <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
          </svg>
          <span className="font-mono text-xs font-medium uppercase tracking-wider">Settings</span>
        </button>
        <p className="px-2.5 pb-1 pt-1.5 font-mono text-[10px] leading-relaxed text-faint">
          <span className="text-krang/60">▸</span> stored locally · never leaves your machine
        </p>
      </div>
    </aside>
  )
}
