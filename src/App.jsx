import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import Sidebar from './components/Sidebar.jsx'
import ChatWindow from './components/ChatWindow.jsx'
import InputBar from './components/InputBar.jsx'
import ModelPicker from './components/ModelPicker.jsx'
import ContextGauge from './components/ContextGauge.jsx'
import ModelBrowser from './components/ModelBrowser.jsx'
import SettingsModal from './components/SettingsModal.jsx'
import KrangLogo from './components/KrangLogo.jsx'
import {
  fetchModels,
  streamChat,
  fetchModelMaxContext,
  pullModel,
  deleteModel,
  OllamaOfflineError,
} from './lib/ollama.js'
import { estimateMessagesTokens } from './lib/tokens.js'
import { applyTheme, loadTheme } from './lib/themes.js'

const STORAGE_KEY = 'ollama-chat:conversations'
const MODEL_KEY = 'ollama-chat:selected-model'
const NUMCTX_KEY = 'ollama-chat:num-ctx'
const AUTOCOMPACT_KEY = 'ollama-chat:auto-compact'

// Standard window sizes offered in the gauge, filtered to the model's max.
const WINDOW_CHOICES = [2048, 4096, 8192, 16384, 32768, 65536, 131072]
const DEFAULT_WINDOW = 8192
// Fraction of the window at which auto-compact fires (and the ring turns red).
const AUTO_COMPACT_RATIO = 0.85
// How many trailing user/assistant messages to keep verbatim when compacting.
const KEEP_RECENT = 4

const genId = () =>
  typeof crypto !== 'undefined' && crypto.randomUUID
    ? crypto.randomUUID()
    : String(Date.now() + Math.random())

// Title is the first user message, trimmed to 40 chars with an ellipsis.
function deriveTitle(text) {
  const clean = text.trim().replace(/\s+/g, ' ')
  return clean.length > 40 ? clean.slice(0, 40) + '…' : clean
}

// Load persisted conversations from localStorage (defensively).
function loadConversations() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    const parsed = raw ? JSON.parse(raw) : []
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

export default function App() {
  const [models, setModels] = useState([])
  const [selectedModel, setSelectedModel] = useState(
    () => localStorage.getItem(MODEL_KEY) || ''
  )

  const [conversations, setConversations] = useState(loadConversations)
  const [activeId, setActiveId] = useState(null)

  const [isStreaming, setIsStreaming] = useState(false)
  const [awaitingFirstToken, setAwaitingFirstToken] = useState(false)
  const [isCompacting, setIsCompacting] = useState(false)

  // Context-window controls.
  const [numCtx, setNumCtx] = useState(() => Number(localStorage.getItem(NUMCTX_KEY)) || DEFAULT_WINDOW)
  const [modelMaxCtx, setModelMaxCtx] = useState(DEFAULT_WINDOW)
  const [autoCompact, setAutoCompact] = useState(() => localStorage.getItem(AUTOCOMPACT_KEY) === '1')

  // Model browser (curated catalog) + in-flight downloads.
  const [browserOpen, setBrowserOpen] = useState(false)
  const [pulls, setPulls] = useState({}) // { [name]: { phase, percent, status, error } }
  const pullControllers = useRef({}) // { [name]: AbortController }

  // Settings + theme.
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [theme, setTheme] = useState(loadTheme)

  function handleThemeChange(id) {
    setTheme(id)
    applyTheme(id) // sets data-theme on <html> and persists
  }

  // Export every conversation as a downloaded JSON backup.
  function handleExportAll() {
    const blob = new Blob([JSON.stringify(conversations, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `krang-conversations-${new Date().toISOString().slice(0, 10)}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  // Delete all saved conversations (with confirmation).
  function handleClearAll() {
    if (!window.confirm('Delete ALL conversations? This cannot be undone.')) return
    setConversations([])
    setActiveId(null)
  }

  // Connection/setup problems surfaced as banners.
  const [offline, setOffline] = useState(false)
  const [noModels, setNoModels] = useState(false)

  // Holds the AbortController for the in-flight stream so Stop can cancel it.
  const abortRef = useRef(null)
  // Mirror of conversations for use inside async callbacks (compaction).
  const conversationsRef = useRef(conversations)
  useEffect(() => {
    conversationsRef.current = conversations
  }, [conversations])

  const activeConversation = conversations.find((c) => c.id === activeId) || null
  const messages = activeConversation?.messages ?? []

  // Displayed context usage: a live char-based estimate, multiplied by the
  // per-conversation calibration factor learned from Ollama's exact counts.
  const calibration = activeConversation?.calibration || 1
  const usedTokens = Math.round(estimateMessagesTokens(messages) * calibration)
  // Until a reply has streamed (no calibration yet) the number is approximate.
  const usageApproximate = !activeConversation?.exactTokens

  // Window sizes to offer: standard choices up to the model's max, plus the
  // current value and the max itself so nothing is ever unselectable.
  const windowOptions = Array.from(
    new Set([...WINDOW_CHOICES.filter((w) => w <= modelMaxCtx), modelMaxCtx, numCtx])
  ).sort((a, b) => a - b)

  // Real user/assistant/summary message count (ignores UI-only dividers).
  const realMessageCount = messages.filter((m) => m.role !== 'divider').length
  const canCompact = !isStreaming && !isCompacting && realMessageCount > KEEP_RECENT + 1

  // --- Persist conversations + selected model to localStorage ---
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(conversations))
    } catch {
      // Storage can be full or disabled; ignore.
    }
  }, [conversations])

  useEffect(() => {
    if (selectedModel) localStorage.setItem(MODEL_KEY, selectedModel)
  }, [selectedModel])

  useEffect(() => {
    localStorage.setItem(NUMCTX_KEY, String(numCtx))
  }, [numCtx])

  useEffect(() => {
    localStorage.setItem(AUTOCOMPACT_KEY, autoCompact ? '1' : '0')
  }, [autoCompact])

  // --- Look up the selected model's max context window ---
  useEffect(() => {
    if (!selectedModel) return
    let cancelled = false
    fetchModelMaxContext(selectedModel)
      .then((max) => {
        if (cancelled || !max) return
        setModelMaxCtx(max)
        // Never let the chosen window exceed what the model supports.
        setNumCtx((prev) => Math.min(prev, max))
      })
      .catch(() => {})
    return () => {
      cancelled = true
    }
  }, [selectedModel])

  // --- Load installed models on mount ---
  const loadModels = useCallback(async () => {
    setOffline(false)
    setNoModels(false)
    try {
      const list = await fetchModels()
      setModels(list)
      if (list.length === 0) {
        setNoModels(true)
        return
      }
      // Keep the previously selected model if it's still installed,
      // otherwise default to the first one.
      setSelectedModel((prev) =>
        prev && list.some((m) => m.name === prev) ? prev : list[0].name
      )
    } catch (err) {
      if (err instanceof OllamaOfflineError) {
        setOffline(true)
      } else {
        // Unexpected error — surface as offline-style banner.
        setOffline(true)
      }
    }
  }, [])

  useEffect(() => {
    loadModels()
  }, [loadModels])

  // Set of installed model tags, for marking catalog entries as installed.
  const installedNames = useMemo(() => new Set(models.map((m) => m.name)), [models])

  // --- Model install (pull) ---

  async function handleInstall(name) {
    // Ignore if already downloading.
    if (pulls[name]?.phase === 'pulling') return

    const controller = new AbortController()
    pullControllers.current[name] = controller
    setPulls((p) => ({ ...p, [name]: { phase: 'pulling', percent: 0, status: 'starting…' } }))

    try {
      await pullModel({
        name,
        signal: controller.signal,
        onProgress: (prog) => {
          // `total`/`completed` are per-layer; show the current layer's percent
          // alongside Ollama's status text.
          const percent =
            prog.total && prog.completed
              ? Math.min(100, Math.round((prog.completed / prog.total) * 100))
              : undefined
          setPulls((p) => ({
            ...p,
            [name]: {
              phase: 'pulling',
              status: prog.status || 'downloading…',
              percent: percent ?? p[name]?.percent ?? 0,
            },
          }))
        },
      })

      // Success — refresh the installed list and clear the pull entry.
      await loadModels()
      setPulls((p) => {
        const next = { ...p }
        delete next[name]
        return next
      })
      // If nothing was selected yet, adopt the freshly installed model.
      setSelectedModel((prev) => prev || name)
    } catch (err) {
      if (err.name === 'AbortError') {
        // Cancelled by the user — drop the entry silently.
        setPulls((p) => {
          const next = { ...p }
          delete next[name]
          return next
        })
      } else {
        const message = err instanceof OllamaOfflineError ? 'Ollama is not running' : err.message
        setPulls((p) => ({ ...p, [name]: { phase: 'error', error: message || 'download failed' } }))
      }
    } finally {
      delete pullControllers.current[name]
    }
  }

  function handleCancelInstall(name) {
    pullControllers.current[name]?.abort()
  }

  // --- Model uninstall (delete) ---

  async function handleUninstall(name) {
    if (pulls[name]?.phase === 'removing') return // already in progress
    if (
      !window.confirm(
        `Uninstall ${name}?\n\nThis deletes the downloaded model from disk. You can re-install it later, but it will need to download again.`
      )
    )
      return

    // Reuse the `pulls` map with a 'removing' phase so the row can show status.
    setPulls((p) => ({ ...p, [name]: { phase: 'removing', status: 'removing…' } }))
    try {
      await deleteModel(name)
      // Refresh the installed list; loadModels() reselects a valid model if the
      // one we just removed was active.
      await loadModels()
      setPulls((p) => {
        const next = { ...p }
        delete next[name]
        return next
      })
    } catch (err) {
      const message = err instanceof OllamaOfflineError ? 'Ollama is not running' : err.message
      setPulls((p) => ({ ...p, [name]: { phase: 'error', error: message || 'uninstall failed' } }))
    }
  }

  // --- Conversation helpers ---

  function handleNewChat() {
    // If the active conversation is already empty, just stay on it.
    if (activeConversation && activeConversation.messages.length === 0) return
    setActiveId(null)
  }

  function handleSelectConversation(id) {
    if (isStreaming) return // avoid switching mid-stream
    setActiveId(id)
  }

  function handleDeleteConversation(id) {
    if (!window.confirm('Delete this conversation? This cannot be undone.')) return
    setConversations((prev) => prev.filter((c) => c.id !== id))
    if (id === activeId) setActiveId(null)
  }

  // Switching models mid-chat drops a visible divider into the log.
  function handleSelectModel(name) {
    setSelectedModel(name)
    if (!activeConversation) return
    const msgs = activeConversation.messages
    const lastReal = msgs[msgs.length - 1]
    const alreadyMarked =
      lastReal && lastReal.role === 'divider' && lastReal.content === name
    // Only add a divider if there's actual content and we're truly switching.
    if (msgs.some((m) => m.role !== 'divider') && !alreadyMarked) {
      setConversations((prev) =>
        prev.map((c) =>
          c.id === activeId
            ? { ...c, messages: [...c.messages, { id: genId(), role: 'divider', content: name }] }
            : c
        )
      )
    }
  }

  // Mutate a single message inside a conversation immutably.
  function patchMessage(convId, msgId, patch) {
    setConversations((prev) =>
      prev.map((c) =>
        c.id !== convId
          ? c
          : {
              ...c,
              messages: c.messages.map((m) =>
                m.id !== msgId ? m : { ...m, ...patch(m) }
              ),
            }
      )
    )
  }

  // --- Send + stream ---
  async function handleSend(text) {
    if (!selectedModel) return

    const userMsg = { id: genId(), role: 'user', content: text }
    const assistantMsg = { id: genId(), role: 'assistant', content: '' }

    // Resolve which conversation we're appending to, creating one if needed.
    let convId = activeId
    const creatingNew = !convId
    if (creatingNew) convId = genId()

    // Build the message history we'll send to the API.
    const priorMessages = activeConversation ? activeConversation.messages : []
    const apiMessages = toApiMessages([...priorMessages, userMsg])

    // Commit the user message + empty assistant placeholder to state.
    setConversations((prev) => {
      if (creatingNew) {
        const conv = {
          id: convId,
          title: deriveTitle(text),
          model: selectedModel,
          messages: [userMsg, assistantMsg],
        }
        return [conv, ...prev]
      }
      return prev.map((c) =>
        c.id !== convId
          ? c
          : {
              ...c,
              title: c.title || deriveTitle(text),
              messages: [...c.messages, userMsg, assistantMsg],
            }
      )
    })
    setActiveId(convId)

    // Kick off streaming.
    setIsStreaming(true)
    setAwaitingFirstToken(true)
    const controller = new AbortController()
    abortRef.current = controller

    let succeeded = false
    let finalUsed = 0
    try {
      const { content: full, stats } = await streamChat({
        model: selectedModel,
        messages: apiMessages,
        signal: controller.signal,
        options: { num_ctx: numCtx },
        onToken: (chunk) => {
          // First token arrived — drop the typing indicator.
          setAwaitingFirstToken(false)
          patchMessage(convId, assistantMsg.id, (m) => ({ content: m.content + chunk }))
        },
      })
      succeeded = true

      // Calibrate the token estimator against Ollama's exact counts so the
      // gauge becomes accurate. `prompt_eval_count` covers everything sent;
      // `eval_count` is the reply. Together they equal the full context size.
      const exactTotal = stats ? stats.prompt_eval_count + stats.eval_count : 0
      if (exactTotal > 0) {
        const estTotal = estimateMessagesTokens([...apiMessages, { role: 'assistant', content: full }])
        const calib = estTotal > 0 ? exactTotal / estTotal : 1
        setConversations((prev) =>
          prev.map((c) => (c.id === convId ? { ...c, calibration: calib, exactTokens: exactTotal } : c))
        )
        finalUsed = exactTotal
      } else {
        finalUsed = estimateMessagesTokens([...apiMessages, { role: 'assistant', content: full }])
      }
    } catch (err) {
      if (err.name === 'AbortError') {
        // User stopped generation — keep whatever streamed so far.
      } else if (err instanceof OllamaOfflineError) {
        setOffline(true)
        appendErrorNote(convId, assistantMsg.id, '\n\n_⚠️ Lost connection to Ollama._')
      } else {
        appendErrorNote(
          convId,
          assistantMsg.id,
          `\n\n_⚠️ Error: ${err.message || 'network error during generation'}._`
        )
      }
    } finally {
      setIsStreaming(false)
      setAwaitingFirstToken(false)
      abortRef.current = null
    }

    // Auto-compact once the turn settled past the threshold (if enabled).
    if (succeeded && autoCompact && numCtx > 0 && finalUsed / numCtx >= AUTO_COMPACT_RATIO) {
      await compactConversation(convId)
    }
  }

  // Append an error note to the assistant message (or replace it if empty).
  function appendErrorNote(convId, msgId, note) {
    patchMessage(convId, msgId, (m) => ({
      content: m.content ? m.content + note : note.trim(),
    }))
  }

  function handleStop() {
    abortRef.current?.abort()
  }

  // Map our internal message list to the Ollama chat format. UI-only dividers
  // are dropped; compaction summaries are sent as a system message.
  function toApiMessages(msgs) {
    return msgs
      .filter((m) => m.role !== 'divider')
      .map((m) =>
        m.role === 'summary'
          ? { role: 'system', content: m.content }
          : { role: m.role, content: m.content }
      )
  }

  // Compaction: summarize all but the last KEEP_RECENT turns into a single
  // system-level "summary" message, freeing up context while keeping recent
  // exchanges verbatim. Triggered manually or automatically near the limit.
  async function compactConversation(convId) {
    const conv = conversationsRef.current.find((c) => c.id === convId)
    if (!conv || isCompacting) return

    // Only the real, model-visible messages participate.
    const real = conv.messages.filter(
      (m) => m.role === 'user' || m.role === 'assistant' || m.role === 'summary'
    )
    if (real.length <= KEEP_RECENT + 1) return // too short to be worth compacting

    const head = real.slice(0, real.length - KEEP_RECENT)
    const tail = real.slice(real.length - KEEP_RECENT)

    setIsCompacting(true)
    try {
      const transcript = head
        .map((m) => {
          const label = m.role === 'summary' ? 'EARLIER SUMMARY' : m.role.toUpperCase()
          return `${label}: ${m.content}`
        })
        .join('\n\n')

      const prompt = [
        {
          role: 'system',
          content:
            'You compress conversation history. Produce a concise summary that preserves all facts, decisions, names, code snippets, and unresolved questions needed to continue the conversation. Use terse bullet points. Do not add commentary or pleasantries.',
        },
        { role: 'user', content: `Summarize the conversation so far:\n\n${transcript}` },
      ]

      const { content } = await streamChat({
        model: selectedModel,
        messages: prompt,
        options: { num_ctx: numCtx },
        onToken: () => {},
      })

      const summary = content.trim()
      if (!summary) return

      const summaryMsg = { id: genId(), role: 'summary', content: summary }
      // Replace head with the summary; drop stale calibration so the next turn
      // recalibrates against the new, shorter context.
      setConversations((prev) =>
        prev.map((c) =>
          c.id !== convId
            ? c
            : { ...c, messages: [summaryMsg, ...tail], exactTokens: undefined }
        )
      )
    } catch {
      // Leave the conversation untouched on failure (e.g. offline).
    } finally {
      setIsCompacting(false)
    }
  }

  function handleCompact() {
    if (activeId) compactConversation(activeId)
  }

  return (
    <div className="flex h-full flex-col bg-void-900">
      {/* Fixed header — z-30 keeps its dropdowns above the chat body below. */}
      <header className="relative z-30 flex h-14 shrink-0 items-center justify-between bg-void-950/85 px-4 shadow-[inset_0_-1px_0_rgb(var(--border-2)/0.18)] backdrop-blur-xl">
        <div className="flex items-center gap-2.5">
          <span className="text-krang">
            <KrangLogo size={24} />
          </span>
          <h1 className="wordmark select-none text-[15px] text-fg">KRANG</h1>
          <span className="hidden font-display text-[10px] font-medium uppercase tracking-[0.3em] text-faint sm:inline">
            local&nbsp;ai
          </span>
        </div>
        <div className="flex items-center gap-2">
          {isCompacting && (
            <span className="hidden font-display text-[11px] uppercase tracking-[0.2em] text-krang md:block">
              compacting…
            </span>
          )}
          <ContextGauge
            used={usedTokens}
            limit={numCtx}
            windowOptions={windowOptions}
            onChangeWindow={setNumCtx}
            onCompact={handleCompact}
            canCompact={canCompact}
            isCompacting={isCompacting}
            autoCompact={autoCompact}
            onToggleAuto={setAutoCompact}
            approximate={usageApproximate}
          />
          <ModelPicker
            models={models}
            selected={selectedModel}
            onSelect={handleSelectModel}
            disabled={isStreaming}
          />
          <button
            type="button"
            onClick={() => setBrowserOpen(true)}
            title="Manage models"
            className="btn-ghost flex h-8 items-center gap-1.5 px-2.5 font-mono text-xs font-medium uppercase tracking-wide"
          >
            <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
              <path d="M4.25 2A2.25 2.25 0 002 4.25v2.5A2.25 2.25 0 004.25 9h2.5A2.25 2.25 0 009 6.75v-2.5A2.25 2.25 0 006.75 2h-2.5zm0 9A2.25 2.25 0 002 13.25v2.5A2.25 2.25 0 004.25 18h2.5A2.25 2.25 0 009 15.75v-2.5A2.25 2.25 0 006.75 11h-2.5zm9-9A2.25 2.25 0 0011 4.25v2.5A2.25 2.25 0 0013.25 9h2.5A2.25 2.25 0 0018 6.75v-2.5A2.25 2.25 0 0015.75 2h-2.5zm0 9A2.25 2.25 0 0011 13.25v2.5A2.25 2.25 0 0013.25 18h2.5A2.25 2.25 0 0018 15.75v-2.5A2.25 2.25 0 0015.75 11h-2.5z" />
            </svg>
            <span className="hidden sm:inline">Manage Models</span>
          </button>
        </div>
      </header>

      {/* Banners */}
      {offline && (
        <Banner tone="error">
          <span>
            Ollama is not running. Start it with:{' '}
            <code className="rounded bg-black/50 px-1.5 py-0.5 font-mono text-krang-bright">ollama serve</code>
          </span>
          <button
            onClick={loadModels}
            className="ml-3 rounded border border-krang/50 px-2 py-0.5 font-mono text-xs font-medium uppercase tracking-wide text-krang-bright transition-colors hover:bg-krang/15"
          >
            Retry
          </button>
        </Banner>
      )}
      {!offline && noModels && (
        <Banner tone="warn">
          <span>No models found. Install one to get started.</span>
          <button
            onClick={() => setBrowserOpen(true)}
            className="ml-3 rounded border border-amber-400/50 px-2 py-0.5 font-mono text-xs font-medium uppercase tracking-wide text-amber-200 transition-colors hover:bg-amber-400/15"
          >
            Browse
          </button>
          <button
            onClick={loadModels}
            className="ml-2 rounded border border-amber-400/50 px-2 py-0.5 font-mono text-xs font-medium uppercase tracking-wide text-amber-200 transition-colors hover:bg-amber-400/15"
          >
            Retry
          </button>
        </Banner>
      )}

      {/* Body: sidebar + chat — sits below the header's stacking context. */}
      <div className="relative z-0 flex min-h-0 flex-1">
        <Sidebar
          conversations={conversations}
          activeId={activeId}
          onNew={handleNewChat}
          onSelect={handleSelectConversation}
          onDelete={handleDeleteConversation}
          onOpenSettings={() => setSettingsOpen(true)}
        />

        <main className="flex min-w-0 flex-1 flex-col">
          <ChatWindow
            messages={messages}
            isStreaming={isStreaming}
            awaitingFirstToken={awaitingFirstToken}
          />
          <InputBar
            onSend={handleSend}
            onStop={handleStop}
            isStreaming={isStreaming}
            disabled={!selectedModel || offline}
          />
        </main>
      </div>

      {browserOpen && (
        <ModelBrowser
          installedNames={installedNames}
          pulls={pulls}
          onInstall={handleInstall}
          onCancel={handleCancelInstall}
          onUninstall={handleUninstall}
          onClose={() => setBrowserOpen(false)}
        />
      )}

      {settingsOpen && (
        <SettingsModal
          theme={theme}
          onThemeChange={handleThemeChange}
          conversationCount={conversations.length}
          onExportAll={handleExportAll}
          onClearAll={handleClearAll}
          onClose={() => setSettingsOpen(false)}
        />
      )}
    </div>
  )
}

// Small banner used for connection/setup messages.
function Banner({ tone, children }) {
  const tones = {
    error: 'bg-krang/10 border-krang/40 text-krang-bright',
    warn: 'bg-amber-950/60 border-amber-500/40 text-amber-200',
  }
  return (
    <div
      className={`relative z-10 flex items-center justify-center border-b px-4 py-2 text-sm ${tones[tone]}`}
    >
      <div className="flex items-center">{children}</div>
    </div>
  )
}
