// Curated catalog of popular Ollama models for the one-click model browser.
//
// `name` is the exact tag passed to `ollama pull` (and POST /api/pull). Sizes
// are approximate download sizes for the default quantization and are shown to
// help users gauge disk/time cost — they are not exact.
//
// Keep this list reasonably small and well-maintained rather than exhaustive.

export const MODEL_CATEGORIES = ['General', 'Reasoning', 'Coding', 'Vision', 'Compact']

export const MODEL_CATALOG = [
  // ---------------- General ----------------
  {
    name: 'llama3.2:3b',
    label: 'Llama 3.2 3B',
    category: 'General',
    size: '2.0 GB',
    description: "Meta's compact Llama 3.2. Fast, capable general chat that runs well on most machines.",
  },
  {
    name: 'llama3.1:8b',
    label: 'Llama 3.1 8B',
    category: 'General',
    size: '4.7 GB',
    description: "Meta's popular 8B. Excellent all-around model for chat, writing, and reasoning.",
  },
  {
    name: 'llama3.3:70b',
    label: 'Llama 3.3 70B',
    category: 'General',
    size: '43 GB',
    description: "Meta's flagship 70B. Top-tier quality, but needs a powerful machine and lots of RAM.",
  },
  {
    name: 'gemma3:4b',
    label: 'Gemma 3 4B',
    category: 'General',
    size: '3.3 GB',
    description: "Google's Gemma 3. Strong reasoning and multilingual ability in a small footprint.",
  },
  {
    name: 'gemma3:12b',
    label: 'Gemma 3 12B',
    category: 'General',
    size: '8.1 GB',
    description: 'Google Gemma 3, 12B. A great balance of quality and speed for everyday use.',
  },
  {
    name: 'gemma3:27b',
    label: 'Gemma 3 27B',
    category: 'General',
    size: '17 GB',
    description: 'Google Gemma 3, 27B. High quality for demanding tasks on capable hardware.',
  },
  {
    name: 'qwen2.5:7b',
    label: 'Qwen 2.5 7B',
    category: 'General',
    size: '4.7 GB',
    description: "Alibaba's Qwen 2.5. Strong multilingual support and instruction following.",
  },
  {
    name: 'qwen2.5:14b',
    label: 'Qwen 2.5 14B',
    category: 'General',
    size: '9.0 GB',
    description: 'Qwen 2.5 14B. A higher-quality general model with broad knowledge.',
  },
  {
    name: 'mistral:7b',
    label: 'Mistral 7B',
    category: 'General',
    size: '4.1 GB',
    description: 'Mistral 7B. Fast and efficient for summarization, Q&A, and everyday tasks.',
  },
  {
    name: 'mistral-nemo:12b',
    label: 'Mistral Nemo 12B',
    category: 'General',
    size: '7.1 GB',
    description: 'Mistral Nemo. Larger context window and strong general performance.',
  },
  {
    name: 'mixtral:8x7b',
    label: 'Mixtral 8x7B',
    category: 'General',
    size: '26 GB',
    description: 'Mixtral mixture-of-experts. High quality; activates only part of the model per token.',
  },
  {
    name: 'phi4:14b',
    label: 'Phi-4 14B',
    category: 'General',
    size: '9.1 GB',
    description: "Microsoft's Phi-4. Punches above its weight with strong reasoning for its size.",
  },

  // ---------------- Reasoning ----------------
  {
    name: 'deepseek-r1:1.5b',
    label: 'DeepSeek-R1 1.5B',
    category: 'Reasoning',
    size: '1.1 GB',
    description: 'A tiny distilled reasoning model. Great for math and logic on light hardware.',
  },
  {
    name: 'deepseek-r1:7b',
    label: 'DeepSeek-R1 7B',
    category: 'Reasoning',
    size: '4.7 GB',
    description: 'Reasoning-focused. Best for math, logic, and step-by-step problem solving.',
  },
  {
    name: 'deepseek-r1:8b',
    label: 'DeepSeek-R1 8B',
    category: 'Reasoning',
    size: '4.9 GB',
    description: 'Larger R1 distill. Stronger step-by-step reasoning with modest resource needs.',
  },
  {
    name: 'qwq:32b',
    label: 'QwQ 32B',
    category: 'Reasoning',
    size: '20 GB',
    description: "Qwen's QwQ. Deliberate, deep reasoning for hard logic and math problems.",
  },

  // ---------------- Coding ----------------
  {
    name: 'qwen2.5-coder:1.5b',
    label: 'Qwen2.5-Coder 1.5B',
    category: 'Coding',
    size: '1.0 GB',
    description: 'Tiny coding model. Code completion and small tasks on modest hardware.',
  },
  {
    name: 'qwen2.5-coder:7b',
    label: 'Qwen2.5-Coder 7B',
    category: 'Coding',
    size: '4.7 GB',
    description: 'A top open coding model. Best for code generation, debugging, and refactoring.',
  },
  {
    name: 'qwen2.5-coder:14b',
    label: 'Qwen2.5-Coder 14B',
    category: 'Coding',
    size: '9.0 GB',
    description: 'Larger Qwen Coder. Higher-quality code generation and reasoning over code.',
  },
  {
    name: 'codellama:7b',
    label: 'Code Llama 7B',
    category: 'Coding',
    size: '3.8 GB',
    description: "Meta's coding-focused model. Solid code completion and generation.",
  },
  {
    name: 'codegemma:7b',
    label: 'CodeGemma 7B',
    category: 'Coding',
    size: '5.0 GB',
    description: "Google's CodeGemma. Code completion and generation across many languages.",
  },
  {
    name: 'starcoder2:3b',
    label: 'StarCoder2 3B',
    category: 'Coding',
    size: '1.7 GB',
    description: 'Hugging Face StarCoder2. Lightweight code completion across 600+ languages.',
  },
  {
    name: 'devstral:24b',
    label: 'Devstral 24B',
    category: 'Coding',
    size: '14 GB',
    description: "Mistral's coding agent model. Designed for agentic, multi-step coding workflows.",
  },

  // ---------------- Vision ----------------
  {
    name: 'llava:7b',
    label: 'LLaVA 7B',
    category: 'Vision',
    size: '4.7 GB',
    description: 'Multimodal model. Analyze and describe images as well as chat.',
  },
  {
    name: 'llava:13b',
    label: 'LLaVA 13B',
    category: 'Vision',
    size: '8.0 GB',
    description: 'Larger LLaVA. Better image understanding and richer descriptions.',
  },
  {
    name: 'moondream:1.8b',
    label: 'Moondream 1.8B',
    category: 'Vision',
    size: '1.7 GB',
    description: 'Tiny vision model. Fast image description on low-resource hardware.',
  },

  // ---------------- Compact ----------------
  {
    name: 'llama3.2:1b',
    label: 'Llama 3.2 1B',
    category: 'Compact',
    size: '1.3 GB',
    description: 'Ultra-light Llama. Runs almost anywhere; good for quick, simple tasks.',
  },
  {
    name: 'gemma3:1b',
    label: 'Gemma 3 1B',
    category: 'Compact',
    size: '0.8 GB',
    description: 'Very small Google model. Surprisingly coherent for its tiny size.',
  },
  {
    name: 'qwen2.5:0.5b',
    label: 'Qwen 2.5 0.5B',
    category: 'Compact',
    size: '0.4 GB',
    description: 'The smallest general Qwen. Extremely fast for basic tasks and testing.',
  },
  {
    name: 'smollm2:1.7b',
    label: 'SmolLM2 1.7B',
    category: 'Compact',
    size: '1.1 GB',
    description: 'Compact and efficient. A capable small model for constrained devices.',
  },
]
