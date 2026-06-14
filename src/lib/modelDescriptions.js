// Built-in lookup table mapping model families to a short, human-readable
// description of what each is best for.
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

const TABLE = [
  // --- Coding-specialised variants (check before general families) ---
  {
    patterns: ['qwen-coder', 'qwen2.5-coder', 'qwen2-coder', 'qwencoder', 'qwen3-coder'],
    description: 'Specialized for coding. Best for code generation, debugging, and refactoring.',
  },
  {
    patterns: ['codellama', 'code-llama'],
    description: "Meta's coding-focused model. Best for code completion and generation.",
  },
  {
    patterns: ['devstral'],
    description: "Mistral's coding agent model. Designed for agentic coding workflows.",
  },
  {
    patterns: ['starcoder'],
    description: 'Hugging Face coding model. Best for code completion across many languages.',
  },

  // --- Reasoning-specialised variants ---
  {
    patterns: ['deepseek-r1', 'deepseekr1', 'deepseek-reasoner'],
    description: 'Reasoning-focused model. Best for math, logic, and step-by-step problem solving.',
  },
  {
    patterns: ['deepseek'],
    description: 'Strong reasoning and coding model. Good for logic-heavy tasks.',
  },

  // --- Multimodal / vision ---
  {
    patterns: ['bakllava'],
    description: 'Multimodal model based on Mistral. Image understanding and chat.',
  },
  {
    patterns: ['llava'],
    description: 'Multimodal model. Can analyze and describe images as well as chat.',
  },
  {
    patterns: ['moondream'],
    description: 'Tiny vision model. Fast image description on low-resource hardware.',
  },

  // --- Microsoft Phi (phi4 before generic phi) ---
  {
    patterns: ['phi4', 'phi-4'],
    description: "Microsoft's latest compact model. Strong reasoning for a small footprint.",
  },
  {
    patterns: ['phi'],
    description: "Microsoft's compact model. Surprisingly capable for its small size.",
  },

  // --- Google Gemma (gemma3n before generic gemma) ---
  {
    patterns: ['gemma3n', 'gemma-3n'],
    description: 'Lightweight Google model optimized for efficient use on local devices.',
  },
  {
    patterns: ['gemma'],
    description: "Google's open model. Strong at reasoning, multilingual, and instruction following.",
  },

  // --- General families ---
  {
    patterns: ['llama'],
    description: 'Great all-around model. Good for general chat, writing, and reasoning.',
  },
  {
    patterns: ['mistral', 'mixtral'],
    description: 'Fast and efficient. Good for summarization, Q&A, and everyday tasks.',
  },
  {
    patterns: ['qwen'],
    description: "Alibaba's general model. Strong multilingual support and instruction following.",
  },
  {
    patterns: ['vicuna'],
    description: 'Fine-tuned conversational model. Good for chat and instruction following.',
  },
  {
    patterns: ['falcon'],
    description: 'TII open model. General purpose chat and text generation.',
  },
  {
    patterns: ['neural-chat', 'neuralchat'],
    description: "Intel's conversational model. Optimized for dialogue.",
  },
  {
    patterns: ['solar'],
    description: 'Upstage model. Good general reasoning and instruction following.',
  },
  {
    patterns: ['dolphin'],
    description: 'Uncensored fine-tune. Flexible for creative and open-ended tasks.',
  },
]

const FALLBACK = 'General purpose local model.'

/**
 * Resolve a human-readable description for a model name using fuzzy/partial
 * matching. Returns the fallback string if nothing in the table matches.
 *
 * @param {string} modelName e.g. "llama3.1:8b", "qwen2.5-coder:7b"
 * @returns {string}
 */
export function describeModel(modelName) {
  if (!modelName) return FALLBACK
  const name = modelName.toLowerCase()
  for (const entry of TABLE) {
    if (entry.patterns.some((p) => name.includes(p))) {
      return entry.description
    }
  }
  return FALLBACK
}
