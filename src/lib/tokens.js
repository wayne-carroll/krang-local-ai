// Lightweight token accounting for the context-window gauge.
//
// We can't run the model's real tokenizer in the browser, so we estimate from
// character count (~4 chars/token is a good rule of thumb for English + code).
// The estimate is then *calibrated* per-conversation against the exact counts
// Ollama reports (`prompt_eval_count` + `eval_count`) after each turn, so the
// gauge starts approximate and becomes accurate once a reply has streamed.

const CHARS_PER_TOKEN = 4
// Rough per-message overhead from chat-template role markers / separators.
const PER_MESSAGE_OVERHEAD = 4

// Fraction of the context window at which the gauge turns "danger" red and
// auto-compact fires. Shared so the visual warning and the action stay in sync.
export const COMPACT_THRESHOLD = 0.85

export function estimateTokens(text = '') {
  return Math.ceil((text || '').length / CHARS_PER_TOKEN)
}

/**
 * Estimate the token footprint of a list of chat messages. Dividers (UI-only
 * markers) are ignored since they're never sent to the model.
 */
export function estimateMessagesTokens(messages = []) {
  let total = 0
  for (const m of messages) {
    if (m.role === 'divider') continue
    total += estimateTokens(m.content) + PER_MESSAGE_OVERHEAD
  }
  return total
}

/** Compact "1.2k" / "850" style formatting for the gauge labels. */
export function formatTokens(n) {
  if (n >= 1000) return (n / 1000).toFixed(n >= 10000 ? 0 : 1) + 'k'
  return String(n)
}
