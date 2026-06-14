import { useState } from 'react'
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism'

/**
 * Renders a fenced code block with a language label and a copy-to-clipboard
 * button. Used as the `code` renderer passed to react-markdown.
 *
 * react-markdown calls this for both inline code and block code; we detect
 * block code by the presence of a `language-xxx` className (set on fenced
 * blocks) or the absence of `inline`.
 */
export default function CodeBlock({ inline, className, children, ...props }) {
  const [copied, setCopied] = useState(false)
  const match = /language-(\w+)/.exec(className || '')
  const code = String(children).replace(/\n$/, '')

  // Inline code (e.g. `foo`) — render simply; styled via index.css.
  if (inline || !match) {
    return (
      <code className={className} {...props}>
        {children}
      </code>
    )
  }

  const language = match[1]

  async function copy() {
    try {
      await navigator.clipboard.writeText(code)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch {
      // Clipboard can fail in insecure contexts; fail silently.
    }
  }

  return (
    <div className="group relative my-3 overflow-hidden rounded-lg border border-white/10 bg-[#0c0c10]">
      <div className="flex items-center justify-between border-b border-white/10 bg-[#15151a] px-3 py-1.5">
        <span className="flex items-center gap-1.5 font-mono text-xs uppercase tracking-wide text-krang/90">
          <span className="h-1.5 w-1.5 rounded-full bg-krang" />
          {language}
        </span>
        <button
          type="button"
          onClick={copy}
          className="flex items-center gap-1 rounded px-2 py-0.5 font-mono text-xs text-white/50 transition-colors hover:bg-white/10 hover:text-krang-bright"
        >
          {copied ? (
            <>
              <svg className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor">
                <path
                  fillRule="evenodd"
                  d="M16.7 5.3a1 1 0 010 1.4l-7.5 7.5a1 1 0 01-1.4 0l-3.5-3.5a1 1 0 011.4-1.4l2.8 2.79 6.8-6.79a1 1 0 011.4 0z"
                  clipRule="evenodd"
                />
              </svg>
              Copied
            </>
          ) : (
            <>
              <svg className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor">
                <path d="M7 5a2 2 0 012-2h6a2 2 0 012 2v8a2 2 0 01-2 2h-1v-1.5h1a.5.5 0 00.5-.5V5a.5.5 0 00-.5-.5H9a.5.5 0 00-.5.5v1H7V5z" />
                <path d="M3 9a2 2 0 012-2h6a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2V9zm2-.5a.5.5 0 00-.5.5v6a.5.5 0 00.5.5h6a.5.5 0 00.5-.5V9a.5.5 0 00-.5-.5H5z" />
              </svg>
              Copy
            </>
          )}
        </button>
      </div>
      <SyntaxHighlighter
        language={language}
        style={oneDark}
        customStyle={{ margin: 0, background: 'transparent', padding: '0.85rem 1rem', fontSize: '0.85rem' }}
        codeTagProps={{ style: { fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace' } }}
      >
        {code}
      </SyntaxHighlighter>
    </div>
  )
}
