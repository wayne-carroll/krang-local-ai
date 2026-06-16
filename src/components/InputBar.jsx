import { useEffect, useRef, useState } from 'react'

/**
 * Fixed bottom input bar. A textarea that:
 *   - submits on Enter
 *   - inserts a newline on Shift+Enter
 *   - auto-grows up to a max height
 * While the model is streaming, the send button becomes a Stop button.
 */
export default function InputBar({ onSend, onStop, isStreaming, disabled }) {
  const [text, setText] = useState('')
  const textareaRef = useRef(null)

  // Auto-resize the textarea to fit its content (capped at ~200px).
  useEffect(() => {
    const el = textareaRef.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = `${Math.min(el.scrollHeight, 200)}px`
  }, [text])

  function submit() {
    const trimmed = text.trim()
    if (!trimmed || isStreaming || disabled) return
    onSend(trimmed)
    setText('')
  }

  function onKeyDown(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      submit()
    }
  }

  return (
    <div className="relative z-10 bg-void-900/80 px-4 py-3 shadow-[inset_0_1px_0_rgb(var(--border-2)/0.18)] backdrop-blur-sm">
      <div className="input-line mx-auto flex max-w-[820px] items-end gap-2 px-3 py-2">
        <span className="pb-2 font-mono text-krang/60 select-none">{'>'}</span>
        <textarea
          ref={textareaRef}
          rows={1}
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={onKeyDown}
          disabled={disabled}
          placeholder={
            disabled
              ? 'select a model to begin transmission…'
              : 'transmit a message…  (Enter to send · Shift+Enter for newline)'
          }
          className="max-h-[200px] flex-1 resize-none bg-transparent py-1.5 font-sans text-[15px] text-fg placeholder-faint outline-none disabled:cursor-not-allowed"
        />

        {isStreaming ? (
          <button
            type="button"
            onClick={onStop}
            title="Stop generating"
            aria-label="Stop generating"
            className="flex h-9 w-9 shrink-0 animate-pulseglow items-center justify-center rounded-md bg-krang text-accent-contrast transition-colors hover:bg-krang-bright"
          >
            <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
              <rect x="5" y="5" width="10" height="10" rx="1.5" />
            </svg>
          </button>
        ) : (
          <button
            type="button"
            onClick={submit}
            disabled={!text.trim() || disabled}
            title="Send"
            aria-label="Send message"
            className="btn-primary flex h-9 w-9 shrink-0 items-center justify-center"
          >
            <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
              <path d="M3.4 2.6a1 1 0 011.05-.16l12 5.5a1 1 0 010 1.82l-12 5.5A1 1 0 013 14.3l1.6-4.3L11 9 4.6 8 3 3.7a1 1 0 01.4-1.1z" />
            </svg>
          </button>
        )}
      </div>
    </div>
  )
}
