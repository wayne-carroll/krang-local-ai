import { useEffect } from 'react'

/**
 * Themed confirmation dialog used for destructive actions. Replaces
 * window.confirm, which silently returns false inside the Tauri WebView (so
 * delete/clear/uninstall would no-op in the desktop app). Works identically in
 * the browser and the desktop shell.
 *
 * Driven by a promise-based helper in App: render it when a confirm is pending,
 * and call onConfirm/onCancel to resolve.
 */
export default function ConfirmModal({
  title = 'Confirm',
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  destructive = true,
  onConfirm,
  onCancel,
}) {
  useEffect(() => {
    function onKey(e) {
      if (e.key === 'Escape') onCancel()
      else if (e.key === 'Enter') onConfirm()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onConfirm, onCancel])

  return (
    <div
      className="fixed inset-0 z-[80] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
      onMouseDown={onCancel}
    >
      <div
        className="panel flex w-full max-w-sm animate-risefade flex-col overflow-hidden"
        onMouseDown={(e) => e.stopPropagation()}
        role="alertdialog"
        aria-modal="true"
      >
        <div className="border-b border-line/30 px-5 py-4">
          <h2 className="wordmark text-sm font-bold text-fg">{title}</h2>
        </div>

        <div className="px-5 py-4">
          <p className="whitespace-pre-line text-sm leading-relaxed text-muted">{message}</p>
        </div>

        <div className="flex items-center justify-end gap-2 border-t border-line/30 px-5 py-3">
          <button
            type="button"
            onClick={onCancel}
            className="btn-ghost px-3 py-1.5 font-mono text-[11px] font-semibold uppercase tracking-wide"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            autoFocus
            onClick={onConfirm}
            className={
              destructive
                ? 'rounded-md bg-red-600 px-4 py-1.5 font-mono text-[11px] font-semibold uppercase tracking-wide text-white transition-colors hover:bg-red-500'
                : 'btn-primary px-4 py-1.5 font-mono text-[11px] font-semibold tracking-wide'
            }
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}
