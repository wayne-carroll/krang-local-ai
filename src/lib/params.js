// Per-conversation generation parameters passed to Ollama's `options`.
// `null`/empty means "leave it to the model default" — we only send a field
// when the user has actually set it.

export const PARAMS_KEY = 'krang:gen-params'

export const DEFAULT_PARAMS = {
  temperature: null, // 0 to 2; creativity/randomness
  top_p: null, // 0 to 1; nucleus sampling
  seed: null, // integer; fixed seed = reproducible output
  stop: [], // array of stop strings
}

/** Read the saved default params (used for new chats). */
export function loadParams() {
  try {
    const raw = localStorage.getItem(PARAMS_KEY)
    const parsed = raw ? JSON.parse(raw) : null
    return parsed ? { ...DEFAULT_PARAMS, ...parsed } : { ...DEFAULT_PARAMS }
  } catch {
    return { ...DEFAULT_PARAMS }
  }
}

/** True if any parameter has been customized away from the model default. */
export function hasCustomParams(p) {
  return (
    p != null &&
    (p.temperature != null || p.top_p != null || p.seed != null || (p.stop && p.stop.length > 0))
  )
}

/**
 * Merge the always-present context window with any user-set params into the
 * Ollama `options` object, omitting unset fields.
 */
export function buildOptions(numCtx, p = DEFAULT_PARAMS) {
  const options = { num_ctx: numCtx }
  if (p.temperature != null) options.temperature = p.temperature
  if (p.top_p != null) options.top_p = p.top_p
  if (p.seed != null) options.seed = p.seed
  if (p.stop && p.stop.length > 0) options.stop = p.stop
  return options
}
