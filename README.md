# KRANG · Local AI

A single-page React app for chatting with local models via [Ollama](https://ollama.com).
No backend, no accounts, no telemetry — it talks **directly** to the Ollama API at
`http://localhost:11434`, and every message, model, and conversation stays on your machine.

Industrial "Kinetic Archive" design (Space Grotesk + Inter, sharp edges, precise red accent)
with switchable themes including light mode.

## Features

### Chat
- **Streaming responses** — `POST /api/chat` with `stream: true`, a typing indicator,
  auto-scroll, and a **Stop** button to cancel generation mid-stream.
- **Markdown + code** — assistant replies render as markdown with syntax-highlighted code
  blocks, language labels, and a copy button on each block.
- **Math rendering** — LaTeX (`$…$` inline, `$$…$$` block) is typeset with KaTeX, so
  chemistry/math from models renders properly instead of showing raw source.
- **Input** — auto-growing textarea; Enter to send, Shift+Enter for a newline.

### Models
- **Model selector** — lists every installed model (`GET /api/tags`) with a short,
  human-readable description from a built-in fuzzy lookup table (so version/size tags like
  `llama3.1:8b` or `qwen2.5-coder:7b` resolve correctly).
- **Model browser** — a curated catalog of ~30 popular models across General / Reasoning /
  Coding / Vision / Compact, with one-click install that streams `ollama pull` progress
  (`POST /api/pull`) with live progress bars, cancel, and installed-state badges.
- **Model-switch dividers** — changing the model mid-chat drops a marker in the log.

### Context window & compaction
- **Context gauge** — a ring in the header shows how full the model's context window is
  (used tokens vs. `num_ctx`). Token usage is estimated from characters and then
  **self-calibrated** against Ollama's exact counts (`prompt_eval_count` + `eval_count`)
  after each turn, so it's approximate before the first reply and accurate after.
- **Window control** — pick the `num_ctx` sent to Ollama (capped at the model's max from
  `/api/show`); the gauge denominator reflects the real window in use.
- **Compaction** — summarize older messages into a short system-level note (keeping recent
  turns verbatim) to free up context. Run it manually, or enable **auto-compact** to fire
  automatically near the limit.

### History & data
- **Chat history** — sidebar of saved conversations persisted to `localStorage`, auto-titled
  from the first message, with per-chat delete (confirmation).
- **Settings** (gear, bottom-left of the sidebar):
  - **Appearance** — switch themes (live preview, saved per browser).
  - **Data** — export all conversations to JSON, or delete everything.
  - **About** — app info.

### Themes
Four built-in themes, switchable at runtime (including light mode):

| Theme   | Type  | Accent        |
|---------|-------|---------------|
| Krang   | Dark  | Industrial red (default) |
| Carbon  | Dark  | Electric blue |
| Paper   | Light | Brand red     |
| Arctic  | Light | Blue          |

Colors are CSS variables keyed by `data-theme` on `<html>`, so adding a theme is a few
lines in `src/index.css` + an entry in `src/lib/themes.js` — no component changes.

### Error handling
- Clear banner when **Ollama isn't running** (`ollama serve`), with a Retry button.
- Clear banner when **no models are installed**, with a Browse button to open the catalog.
- Graceful handling of network errors mid-stream.

## Prerequisites

1. Install Ollama and start it:
   ```bash
   ollama serve
   ```
2. Pull at least one model (or use the in-app model browser):
   ```bash
   ollama pull llama3.2      # or gemma3, qwen2.5-coder, deepseek-r1, etc.
   ```

> **CORS note:** browsers block cross-origin requests by default. Ollama allows `localhost`
> origins out of the box, but if you see CORS errors, start Ollama with
> `OLLAMA_ORIGINS=* ollama serve`.

## Run

```bash
npm install
npm run dev      # http://localhost:5173
```

## Build

```bash
npm run build
npm run preview
```

## Tech stack

React 18 · Vite · Tailwind CSS (v3) · react-markdown + remark-gfm · remark-math +
rehype-katex (KaTeX) · react-syntax-highlighter. No backend.

## Project structure

```
src/
  App.jsx                     state, streaming orchestration, localStorage,
                              context/compaction, model install, theme + settings wiring
  components/
    Sidebar.jsx               conversation list, new/delete, settings (gear) button
    ChatWindow.jsx            message log, dividers, summaries, typing indicator, auto-scroll
    MessageBubble.jsx         user text / assistant markdown + math
    CodeBlock.jsx             highlighted code + copy button
    ModelPicker.jsx           model dropdown with descriptions
    InputBar.jsx              auto-growing textarea, send/stop
    ContextGauge.jsx          context-window ring, num_ctx selector, compact controls
    ModelBrowser.jsx          curated catalog modal with one-click install + progress
    SettingsModal.jsx         Appearance (themes) / Data (export, clear) / About
    KrangLogo.jsx             brain-mark logo (SVG)
  lib/
    ollama.js                 API client: /api/tags, streaming /api/chat, /api/pull, /api/show
    modelDescriptions.js      fuzzy model -> description lookup table
    modelCatalog.js           curated install catalog (name, size, category, description)
    tokens.js                 token estimation + formatting for the context gauge
    themes.js                 theme registry + apply/load helpers
  index.css                   theme tokens (CSS variables), base styles, markdown prose
```

## Privacy

Everything runs locally against your own Ollama instance. The app makes no network requests
other than to `http://localhost:11434` (plus Google Fonts / the KaTeX stylesheet for assets).
Conversations live only in your browser's `localStorage`.
