import { useEffect, useRef } from 'react'
import MessageBubble from './MessageBubble.jsx'
import KrangLogo from './KrangLogo.jsx'

/**
 * Scrollable message log. Renders user/assistant bubbles, model-switch
 * dividers, and a typing indicator while the model is generating.
 */
export default function ChatWindow({ messages, isStreaming, awaitingFirstToken }) {
  const bottomRef = useRef(null)

  // Auto-scroll to the latest message whenever the log changes or tokens
  // stream in.
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isStreaming])

  const isEmpty = messages.length === 0

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="mx-auto flex max-w-[820px] flex-col gap-5 px-4 py-6">
        {isEmpty && (
          <div className="flex flex-col items-center justify-center gap-5 pt-24 text-center">
            <span className="text-krang">
              <KrangLogo size={52} />
            </span>
            <div>
              {/* pl compensates each line's trailing letter-spacing so the
                  glyphs sit on true center (and align with each other). */}
              <p className="pl-[0.35em] font-display text-[11px] font-medium uppercase tracking-[0.35em] text-krang">
                Local AI
              </p>
              <h2 className="wordmark mt-2 pl-[0.18em] text-2xl text-fg">Krang</h2>
            </div>
            <p className="max-w-sm font-sans text-sm leading-relaxed text-muted">
              Select a model and send a message. Responses stream live from your local Ollama
              instance. Nothing leaves this machine.
            </p>
          </div>
        )}

        {messages.map((m) => {
          if (m.role === 'summary') {
            // Collapsible note produced by compaction; replaces older turns.
            return (
              <details
                key={m.id}
                className="animate-risefade rounded-lg border border-krang/25 bg-krang/5 px-4 py-2.5 shadow-hud"
              >
                <summary className="flex cursor-pointer select-none items-center gap-2 font-mono text-[11px] uppercase tracking-wider text-krang/80">
                  <svg className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M3 5a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 5a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm1 4a1 1 0 100 2h7a1 1 0 100-2H4z" />
                  </svg>
                  context compacted
                </summary>
                <div className="mt-2 whitespace-pre-wrap font-sans text-sm leading-relaxed text-muted">
                  {m.content}
                </div>
              </details>
            )
          }
          if (m.role === 'divider') {
            // Visible marker shown when the user switches models mid-chat.
            return (
              <div
                key={m.id}
                className="flex items-center gap-3 py-1 font-mono text-[11px] uppercase tracking-wider text-faint"
              >
                <span className="h-px flex-1 bg-gradient-to-r from-transparent to-krang/30" />
                <span className="whitespace-nowrap text-krang/70">⟐ {m.content}</span>
                <span className="h-px flex-1 bg-gradient-to-l from-transparent to-krang/30" />
              </div>
            )
          }
          return (
            <MessageBubble
              key={m.id}
              role={m.role}
              content={m.content}
              images={m.images}
              stats={m.stats}
            />
          )
        })}

        {/* Typing indicator: shown after sending while we wait for the first
            token of the assistant reply. */}
        {awaitingFirstToken && (
          <div className="flex animate-risefade justify-start">
            <div className="flex gap-3">
              <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-md border border-krang/40 bg-void-850 text-krang">
                <KrangLogo size={16} glow={false} />
              </div>
              <div className="flex items-center gap-1.5 rounded-lg border border-void-700 bg-void-800 px-4 py-3">
                <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-krang [animation-delay:-0.3s]" />
                <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-krang [animation-delay:-0.15s]" />
                <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-krang" />
              </div>
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>
    </div>
  )
}
