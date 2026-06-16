// Thin client for the local Ollama HTTP API.
// Docs: https://github.com/ollama/ollama/blob/main/docs/api.md

export const OLLAMA_BASE = 'http://localhost:11434'

/**
 * Raised when we can reach the network layer but Ollama itself is unreachable
 * (i.e. `ollama serve` is not running). Lets the UI distinguish "not running"
 * from other failures.
 */
export class OllamaOfflineError extends Error {
  constructor(message = 'Ollama is not running') {
    super(message)
    this.name = 'OllamaOfflineError'
  }
}

/**
 * Fetch the list of installed models from GET /api/tags.
 * @returns {Promise<Array<{name: string, model: string, size: number, modified_at: string}>>}
 * @throws {OllamaOfflineError} when the server can't be reached.
 */
export async function fetchModels() {
  let res
  try {
    res = await fetch(`${OLLAMA_BASE}/api/tags`)
  } catch (err) {
    // A thrown fetch (vs. a non-2xx response) means the connection was
    // refused — Ollama isn't running.
    throw new OllamaOfflineError()
  }
  if (!res.ok) {
    throw new Error(`Failed to fetch models (HTTP ${res.status})`)
  }
  const data = await res.json()
  return Array.isArray(data.models) ? data.models : []
}

/**
 * Stream a chat completion from POST /api/chat with stream: true.
 *
 * Ollama streams newline-delimited JSON objects. We read the response body as
 * a stream, split on newlines, and invoke `onToken` with each incremental
 * `message.content` chunk.
 *
 * @param {object} opts
 * @param {string} opts.model            model name to run
 * @param {Array<{role: string, content: string}>} opts.messages  full history
 * @param {AbortSignal} [opts.signal]    abort signal to stop generation
 * @param {object} [opts.options]        Ollama options (e.g. { num_ctx })
 * @param {(chunk: string) => void} opts.onToken  called per streamed token
 * @returns {Promise<{content: string, stats: object|null}>} full reply plus
 *   the final stats chunk (includes exact `prompt_eval_count`/`eval_count`).
 * @throws {OllamaOfflineError} when the server can't be reached.
 */
export async function streamChat({ model, messages, signal, options, onToken }) {
  let res
  try {
    res = await fetch(`${OLLAMA_BASE}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ model, messages, stream: true, options: options || undefined }),
      signal,
    })
  } catch (err) {
    if (err.name === 'AbortError') throw err
    throw new OllamaOfflineError()
  }

  if (!res.ok) {
    throw new Error(`Chat request failed (HTTP ${res.status})`)
  }

  const reader = res.body.getReader()
  const decoder = new TextDecoder()
  let buffer = ''
  let full = ''
  let stats = null

  // Parse one newline-delimited JSON object and fold it into the result.
  const processLine = (line) => {
    const trimmed = line.trim()
    if (!trimmed) return
    let json
    try {
      json = JSON.parse(trimmed)
    } catch {
      // Skip malformed/partial lines defensively.
      return
    }
    const token = json?.message?.content
    if (token) {
      full += token
      onToken(token)
    }
    // The final chunk (done: true) carries exact token accounting.
    if (json.done) {
      stats = {
        prompt_eval_count: json.prompt_eval_count ?? 0,
        eval_count: json.eval_count ?? 0,
      }
    }
    if (json.error) {
      throw new Error(json.error)
    }
  }

  // Read the stream chunk-by-chunk. Each chunk may contain zero or more
  // complete JSON lines plus a trailing partial line we carry in `buffer`.
  while (true) {
    const { done, value } = await reader.read()
    if (done) break
    buffer += decoder.decode(value, { stream: true })

    const lines = buffer.split('\n')
    // Keep the last element — it may be an incomplete line.
    buffer = lines.pop()

    for (const line of lines) processLine(line)
  }
  // Flush a final object not terminated by a newline (otherwise the `done`
  // chunk — and its token stats — could be dropped).
  processLine(buffer)

  return { content: full, stats }
}

/**
 * Pull (download) a model via POST /api/pull with stream: true. Ollama streams
 * newline-delimited JSON progress objects, e.g.:
 *   { status: "pulling manifest" }
 *   { status: "downloading sha256:...", total: 123, completed: 45 }
 *   { status: "verifying sha256 digest" }
 *   { status: "success" }
 *
 * @param {object} opts
 * @param {string} opts.name        model tag to pull, e.g. "llama3.1:8b"
 * @param {AbortSignal} [opts.signal] abort signal to cancel the download
 * @param {(progress: object) => void} opts.onProgress  called per status line
 * @throws {OllamaOfflineError} when the server can't be reached.
 */
export async function pullModel({ name, signal, onProgress }) {
  let res
  try {
    res = await fetch(`${OLLAMA_BASE}/api/pull`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, stream: true }),
      signal,
    })
  } catch (err) {
    if (err.name === 'AbortError') throw err
    throw new OllamaOfflineError()
  }
  if (!res.ok) {
    throw new Error(`Pull failed (HTTP ${res.status})`)
  }

  const reader = res.body.getReader()
  const decoder = new TextDecoder()
  let buffer = ''

  const processLine = (line) => {
    const trimmed = line.trim()
    if (!trimmed) return
    let json
    try {
      json = JSON.parse(trimmed)
    } catch {
      return
    }
    // Ollama reports pull errors (e.g. unknown model) in the stream body.
    if (json.error) throw new Error(json.error)
    onProgress(json)
  }

  while (true) {
    const { done, value } = await reader.read()
    if (done) break
    buffer += decoder.decode(value, { stream: true })
    const lines = buffer.split('\n')
    buffer = lines.pop()
    for (const line of lines) processLine(line)
  }
  // Flush a final object not terminated by a newline (e.g. the "success" line).
  processLine(buffer)
}

/**
 * Delete (uninstall) an installed model via DELETE /api/delete. This removes
 * the model's weights from disk; it is not recoverable without pulling again.
 *
 * @param {string} name model tag to delete, e.g. "llama3.1:8b"
 * @throws {OllamaOfflineError} when the server can't be reached.
 */
export async function deleteModel(name) {
  let res
  try {
    res = await fetch(`${OLLAMA_BASE}/api/delete`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name }),
    })
  } catch (err) {
    throw new OllamaOfflineError()
  }
  if (!res.ok) {
    throw new Error(`Delete failed (HTTP ${res.status})`)
  }
}

/**
 * Look up a model's maximum context length via POST /api/show. Ollama returns
 * architecture details under `model_info`, where the relevant key ends with
 * ".context_length" (e.g. "llama.context_length", "qwen2.context_length").
 *
 * @param {string} model
 * @returns {Promise<number|null>} max context tokens, or null if unknown.
 */
export async function fetchModelMaxContext(model) {
  let res
  try {
    res = await fetch(`${OLLAMA_BASE}/api/show`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ model }),
    })
  } catch {
    return null
  }
  if (!res.ok) return null
  const data = await res.json()
  const info = data.model_info || {}
  for (const [key, value] of Object.entries(info)) {
    if (key.endsWith('.context_length') && typeof value === 'number') {
      return value
    }
  }
  return null
}
