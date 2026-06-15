// Built-in lookup table mapping model families to a short, human-readable
// description of what each is best for, plus a coarse category.
//
// Matching is a fuzzy/partial substring match against the lowercased model
// name, so it works regardless of version/size tags. For example:
//   "llama3.1:8b"        -> matches "llama"
//   "qwen2.5-coder:7b"   -> matches "qwen-coder" (a coder variant)
//   "deepseek-r1:latest" -> matches "deepseek-r1"
//
// ORDER MATTERS: entries are evaluated top-to-bottom and the first match wins,
// so more specific families (e.g. "deepseek-r1", "qwen-coder", "phi4",
// "gemma3n") must come BEFORE their broader parents ("deepseek", "qwen",
// "phi", "gemma"). Each entry lists one or more `patterns` (substrings, all
// lowercase) and any one of them matching counts as a hit.
//
// `category` is one of the MODEL_CATEGORIES in modelCatalog.js. It's a family-
// level hint (derived from the model's specialty), so it can differ from a
// catalog entry's hand-assigned category for a specific size/quant.

const TABLE = [
  // --- Coding-specialised variants (check before general families) ---
  {
    patterns: ['qwen-coder', 'qwen2.5-coder', 'qwen2-coder', 'qwencoder', 'qwen3-coder'],
    category: 'Coding',
    description: 'Specialized for coding. Best for code generation, debugging, and refactoring.',
  },
  {
    patterns: ['codellama', 'code-llama'],
    category: 'Coding',
    description: "Meta's coding-focused model. Best for code completion and generation.",
  },
  {
    patterns: ['codegemma'],
    category: 'Coding',
    description: "Google's CodeGemma. Code completion and generation across many languages.",
  },
  {
    patterns: ['devstral'],
    category: 'Coding',
    description: "Mistral's coding agent model. Designed for agentic coding workflows.",
  },
  {
    patterns: ['starcoder'],
    category: 'Coding',
    description: 'Hugging Face coding model. Best for code completion across many languages.',
  },

  // --- Reasoning-specialised variants ---
  {
    patterns: ['deepseek-r1', 'deepseekr1', 'deepseek-reasoner'],
    category: 'Reasoning',
    description: 'Reasoning-focused model. Best for math, logic, and step-by-step problem solving.',
  },
  {
    patterns: ['qwq'],
    category: 'Reasoning',
    description: "Qwen's QwQ. Deliberate, deep reasoning for hard logic and math problems.",
  },
  {
    patterns: ['deepseek'],
    category: 'Reasoning',
    description: 'Strong reasoning and coding model. Good for logic-heavy tasks.',
  },

  // --- Multimodal / vision ---
  {
    patterns: ['bakllava'],
    category: 'Vision',
    description: 'Multimodal model based on Mistral. Image understanding and chat.',
  },
  {
    patterns: ['llava'],
    category: 'Vision',
    description: 'Multimodal model. Can analyze and describe images as well as chat.',
  },
  {
    patterns: ['moondream'],
    category: 'Vision',
    description: 'Tiny vision model. Fast image description on low-resource hardware.',
  },

  // --- Microsoft Phi (phi4 before generic phi) ---
  {
    patterns: ['phi4', 'phi-4'],
    category: 'General',
    description: "Microsoft's latest compact model. Strong reasoning for a small footprint.",
  },
  {
    patterns: ['phi'],
    category: 'General',
    description: "Microsoft's compact model. Surprisingly capable for its small size.",
  },

  // --- Small/efficient families (size-led, so categorised as Compact) ---
  {
    patterns: ['gemma3n', 'gemma-3n'],
    category: 'Compact',
    description: 'Lightweight Google model optimized for efficient use on local devices.',
  },
  {
    patterns: ['smollm'],
    category: 'Compact',
    description: 'Compact and efficient. A capable small model for constrained devices.',
  },

  // --- General families ---
  {
    patterns: ['gemma'],
    category: 'General',
    description: "Google's open model. Strong at reasoning, multilingual, and instruction following.",
  },
  {
    patterns: ['llama'],
    category: 'General',
    description: 'Great all-around model. Good for general chat, writing, and reasoning.',
  },
  {
    patterns: ['mistral', 'mixtral'],
    category: 'General',
    description: 'Fast and efficient. Good for summarization, Q&A, and everyday tasks.',
  },
  {
    patterns: ['qwen'],
    category: 'General',
    description: "Alibaba's general model. Strong multilingual support and instruction following.",
  },
  {
    patterns: ['vicuna'],
    category: 'General',
    description: 'Fine-tuned conversational model. Good for chat and instruction following.',
  },
  {
    patterns: ['falcon'],
    category: 'General',
    description: 'TII open model. General purpose chat and text generation.',
  },
  {
    patterns: ['neural-chat', 'neuralchat'],
    category: 'General',
    description: "Intel's conversational model. Optimized for dialogue.",
  },
  {
    patterns: ['solar'],
    category: 'General',
    description: 'Upstage model. Good general reasoning and instruction following.',
  },
  {
    patterns: ['dolphin'],
    category: 'General',
    description: 'Uncensored fine-tune. Flexible for creative and open-ended tasks.',
  },
]

const FALLBACK_DESCRIPTION = 'General purpose local model.'
const FALLBACK_CATEGORY = 'General'

// Find the first table entry whose patterns match the (lowercased) name.
function matchEntry(modelName) {
  if (!modelName) return null
  const name = modelName.toLowerCase()
  return TABLE.find((entry) => entry.patterns.some((p) => name.includes(p))) || null
}

/**
 * Resolve a human-readable description for a model name using fuzzy/partial
 * matching. Returns the fallback string if nothing in the table matches.
 *
 * @param {string} modelName e.g. "llama3.1:8b", "qwen2.5-coder:7b"
 * @returns {string}
 */
export function describeModel(modelName) {
  return matchEntry(modelName)?.description ?? FALLBACK_DESCRIPTION
}

/**
 * Resolve a coarse category (e.g. "Coding", "Reasoning", "Vision", "Compact",
 * "General") for a model name using the same fuzzy matching. Defaults to
 * "General" when nothing matches.
 *
 * @param {string} modelName e.g. "llama3.1:8b", "qwen2.5-coder:7b"
 * @returns {string}
 */
export function categorizeModel(modelName) {
  return matchEntry(modelName)?.category ?? FALLBACK_CATEGORY
}
