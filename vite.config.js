import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Standard Vite + React setup. The app talks to Ollama directly from the
// browser at http://localhost:11434, so no dev proxy is required as long as
// Ollama allows the request origin (default localhost is fine).
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
  },
})
