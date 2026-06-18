import { useCallback, useEffect, useState } from 'react'
import KrangLogo from './KrangLogo.jsx'
import { isTauri, invokeCmd, onEvent } from '../lib/platform.js'

// Desktop-only first-launch gate. In the Tauri shell it asks the Rust backend
// to make Ollama reachable (detect, start, or download+install as needed),
// showing progress, before rendering the app. In a browser it is a pass-through
// and never calls the backend, so web mode keeps its existing behavior (the app
// just tries to reach Ollama and shows the in-app "not running" banner).
//
// `ensure_ollama_ready` is idempotent and fast when Ollama is already up, so we
// run it on every desktop launch rather than gating on a first-run marker; that
// also recovers gracefully if Ollama was stopped between sessions.
export default function StartupGate({ children }) {
  // 'pending' | 'ready' | 'error'  (browser starts 'ready').
  const [status, setStatus] = useState(() => (isTauri() ? 'pending' : 'ready'))
  const [progress, setProgress] = useState({ phase: 'check', percent: null, message: 'Starting' })
  const [error, setError] = useState('')

  const runSetup = useCallback(async () => {
    setStatus('pending')
    setError('')
    try {
      await invokeCmd('ensure_ollama_ready')
      setStatus('ready')
    } catch (err) {
      setError(typeof err === 'string' ? err : err?.message || 'Setup failed')
      setStatus('error')
    }
  }, [])

  useEffect(() => {
    if (!isTauri()) return
    let unlisten = () => {}
    let active = true
    onEvent('ollama-setup', (payload) => {
      if (active && payload) setProgress(payload)
    }).then((fn) => {
      unlisten = fn
    })
    runSetup()
    return () => {
      active = false
      unlisten()
    }
  }, [runSetup])

  if (status === 'ready') return children

  return (
    <div className="flex h-full flex-col items-center justify-center gap-6 bg-void-900 px-8 text-center">
      <span className="text-krang">
        <KrangLogo size={48} />
      </span>
      <div className="flex flex-col items-center gap-1">
        <h1 className="wordmark select-none text-lg text-fg">KRANG</h1>
        <span className="font-display text-[10px] font-medium uppercase tracking-[0.3em] text-faint">
          local&nbsp;ai
        </span>
      </div>

      {status === 'pending' && (
        <div className="flex w-full max-w-xs flex-col items-center gap-3">
          <p className="font-mono text-sm text-fg">{progress.message || 'Starting'}</p>
          <div className="h-1 w-full overflow-hidden rounded bg-white/10">
            <div
              className="h-full rounded bg-krang transition-all duration-300"
              style={{
                width: progress.percent != null ? `${progress.percent}%` : '40%',
              }}
            />
          </div>
          {progress.phase === 'download' && progress.percent != null && (
            <p className="font-mono text-xs text-faint">{progress.percent}%</p>
          )}
        </div>
      )}

      {status === 'error' && (
        <div className="flex max-w-sm flex-col items-center gap-4">
          <p className="text-sm text-krang-bright">{error}</p>
          <button
            type="button"
            onClick={runSetup}
            className="rounded border border-krang/50 px-3 py-1 font-mono text-xs font-medium uppercase tracking-wide text-krang-bright transition-colors hover:bg-krang/15"
          >
            Retry
          </button>
        </div>
      )}
    </div>
  )
}
