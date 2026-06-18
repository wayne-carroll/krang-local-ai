// Runtime bridge between the web build and the Tauri desktop build. The same
// bundle ships in both; everything here degrades to plain web behavior in a
// browser, so no component needs to know which shell it is running in.

/** True when running inside the Tauri desktop shell. */
export function isTauri() {
  return typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window
}

// Resolve the HTTP transport once. In Tauri we use the http plugin's fetch,
// which routes through Rust and so is not subject to the WebView's CORS rules
// (the Ollama API would otherwise reject the non-localhost WebView origin). In
// a browser we use the global fetch. Both expose the same Fetch API surface,
// including streaming response bodies, so callers are identical.
let _fetchPromise = null
export function getFetch() {
  if (!_fetchPromise) {
    _fetchPromise = isTauri()
      ? import('@tauri-apps/plugin-http').then((m) => m.fetch)
      : Promise.resolve(window.fetch.bind(window))
  }
  return _fetchPromise
}

/** Invoke a Rust command in Tauri; resolves to null (no-op) in a browser. */
export async function invokeCmd(cmd, args) {
  if (!isTauri()) return null
  const { invoke } = await import('@tauri-apps/api/core')
  return invoke(cmd, args)
}

/**
 * Subscribe to a Rust-emitted event. Returns an unlisten function. In a browser
 * this is a no-op that returns a no-op unlisten.
 */
export async function onEvent(name, handler) {
  if (!isTauri()) return () => {}
  const { listen } = await import('@tauri-apps/api/event')
  return listen(name, (e) => handler(e.payload))
}
