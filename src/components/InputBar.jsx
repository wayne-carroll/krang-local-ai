import { useEffect, useRef, useState } from 'react'

const genId = () =>
  typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : String(Math.random())

/**
 * Fixed bottom input bar. A textarea that:
 *   - submits on Enter, newline on Shift+Enter, auto-grows up to a max height
 * Plus image attachments for vision models: attach via the 📎 button, paste,
 * or drag-and-drop. Images are sent as base64 alongside the text.
 * While the model is streaming, the send button becomes a Stop button.
 */
export default function InputBar({ onSend, onStop, isStreaming, disabled }) {
  const [text, setText] = useState('')
  const [images, setImages] = useState([]) // { id, dataUrl, base64, name }
  const [dragging, setDragging] = useState(false)
  const textareaRef = useRef(null)
  const fileInputRef = useRef(null)

  // Auto-resize the textarea to fit its content (capped at ~200px).
  useEffect(() => {
    const el = textareaRef.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = `${Math.min(el.scrollHeight, 200)}px`
  }, [text])

  // Read image files into base64 (stripped of the data-URL prefix for Ollama).
  function addFiles(fileList) {
    const files = Array.from(fileList || []).filter((f) => f.type.startsWith('image/'))
    for (const file of files) {
      const reader = new FileReader()
      reader.onload = () => {
        const dataUrl = String(reader.result)
        const base64 = dataUrl.split(',')[1] || ''
        setImages((prev) => [...prev, { id: genId(), dataUrl, base64, name: file.name }])
      }
      reader.readAsDataURL(file)
    }
  }

  function removeImage(id) {
    setImages((prev) => prev.filter((img) => img.id !== id))
  }

  function submit() {
    const trimmed = text.trim()
    if ((!trimmed && images.length === 0) || isStreaming || disabled) return
    // Send data URLs; App strips the prefix to raw base64 for the API but keeps
    // the full URL on the message for rendering.
    onSend(trimmed, images.map((img) => img.dataUrl))
    setText('')
    setImages([])
  }

  function onKeyDown(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      submit()
    }
  }

  // Paste images straight from the clipboard.
  function onPaste(e) {
    const items = Array.from(e.clipboardData?.items || [])
    const files = items.filter((it) => it.type.startsWith('image/')).map((it) => it.getAsFile())
    if (files.length) {
      e.preventDefault()
      addFiles(files)
    }
  }

  function onDrop(e) {
    e.preventDefault()
    setDragging(false)
    if (e.dataTransfer?.files?.length) addFiles(e.dataTransfer.files)
  }

  return (
    <div className="relative z-10 bg-void-900/80 px-4 py-3 shadow-[inset_0_1px_0_rgb(var(--border-2)/0.18)] backdrop-blur-sm">
      <div
        className={`input-line mx-auto flex max-w-[820px] flex-col gap-2 px-3 py-2 transition-colors ${
          dragging ? 'ring-1 ring-krang/60' : ''
        }`}
        onDragOver={(e) => {
          e.preventDefault()
          if (!dragging) setDragging(true)
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
      >
        {/* Attached image thumbnails */}
        {images.length > 0 && (
          <div className="flex flex-wrap gap-2 pt-1">
            {images.map((img) => (
              <div key={img.id} className="group relative">
                <img
                  src={img.dataUrl}
                  alt={img.name}
                  className="h-14 w-14 rounded-sm object-cover shadow-[inset_0_0_0_1px_rgb(var(--border-2)/0.5)]"
                />
                <button
                  type="button"
                  onClick={() => removeImage(img.id)}
                  title="Remove image"
                  aria-label={`Remove ${img.name}`}
                  className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-void-950 text-muted shadow-glow-sm transition-colors hover:text-krang"
                >
                  <svg className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M6.3 5.3a1 1 0 011.4 0L10 7.6l2.3-2.3a1 1 0 111.4 1.4L11.4 9l2.3 2.3a1 1 0 01-1.4 1.4L10 10.4l-2.3 2.3a1 1 0 01-1.4-1.4L8.6 9 6.3 6.7a1 1 0 010-1.4z" />
                  </svg>
                </button>
              </div>
            ))}
          </div>
        )}

        <div className="flex items-end gap-2">
          <span className="select-none pb-2 font-mono text-krang/60">{'>'}</span>

          {/* Hidden file input + attach button */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={(e) => {
              addFiles(e.target.files)
              e.target.value = '' // allow re-selecting the same file
            }}
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={disabled}
            title="Attach image (for vision models)"
            aria-label="Attach image"
            className="mb-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-sm text-muted transition-colors hover:bg-void-700 hover:text-krang disabled:cursor-not-allowed disabled:opacity-40"
          >
            <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
              <path
                fillRule="evenodd"
                d="M15.6 5.2a3 3 0 00-4.2 0L5 11.6a1.5 1.5 0 102.1 2.1l5.3-5.3a.75.75 0 011.1 1.1l-5.3 5.3a3 3 0 11-4.2-4.2l6.4-6.4a4.5 4.5 0 116.4 6.4l-6.4 6.4a.75.75 0 01-1.1-1.1l6.4-6.4a3 3 0 000-4.2z"
                clipRule="evenodd"
              />
            </svg>
          </button>

          <textarea
            ref={textareaRef}
            rows={1}
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={onKeyDown}
            onPaste={onPaste}
            disabled={disabled}
            placeholder={
              disabled
                ? 'select a model to begin transmission…'
                : 'transmit a message…  (Enter to send · Shift+Enter for newline · paste or drop an image)'
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
              disabled={(!text.trim() && images.length === 0) || disabled}
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
    </div>
  )
}
