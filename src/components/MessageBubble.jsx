import { useState } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import remarkMath from 'remark-math'
import rehypeKatex from 'rehype-katex'
import CodeBlock from './CodeBlock.jsx'
import KrangLogo from './KrangLogo.jsx'
import { saveText } from '../lib/fileSave.js'

/**
 * A single chat message. User messages render as plain text (plus any attached
 * images) in a bubble; assistant messages render as markdown with
 * syntax-highlighted code blocks and a copy/save toolbar.
 */
export default function MessageBubble({ role, content, images }) {
  const isUser = role === 'user'

  return (
    <div className={`flex w-full animate-risefade ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div className={`flex max-w-[760px] gap-3 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
        {/* Avatar */}
        <div
          className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-xs font-semibold ${
            isUser
              ? 'bg-void-800 font-mono text-muted'
              : 'bg-void-850 text-krang shadow-[inset_0_0_0_1px_rgb(var(--accent)/0.4)]'
          }`}
        >
          {isUser ? 'YOU' : <KrangLogo size={16} glow={false} />}
        </div>

        {/* Body */}
        <div
          className={`group min-w-0 rounded-lg px-4 py-2.5 text-[15px] ${
            isUser
              ? 'bg-void-800 font-sans text-fg'
              : 'bg-void-850/80 text-fg shadow-hud'
          }`}
        >
          {/* Attached images (user messages) */}
          {images && images.length > 0 && (
            <div className="mb-2 flex flex-wrap gap-2">
              {images.map((src, i) => (
                <img
                  key={i}
                  src={src}
                  alt={`attachment ${i + 1}`}
                  className="max-h-48 rounded-sm object-contain shadow-[inset_0_0_0_1px_rgb(var(--border-2)/0.5)]"
                />
              ))}
            </div>
          )}

          {isUser ? (
            // Preserve user newlines without parsing markdown.
            content && <p className="whitespace-pre-wrap break-words">{content}</p>
          ) : (
            <div className="prose-chat break-words">
              <ReactMarkdown
                remarkPlugins={[remarkGfm, remarkMath]}
                rehypePlugins={[rehypeKatex]}
                components={{ code: CodeBlock, a: SafeLink }}
              >
                {content}
              </ReactMarkdown>
              {content && <MessageToolbar content={content} />}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// Copy / save controls shown on assistant messages (revealed on hover).
function MessageToolbar({ content }) {
  const [copied, setCopied] = useState(false)
  const [saved, setSaved] = useState(false)

  async function copy() {
    try {
      await navigator.clipboard.writeText(content)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch {
      // Clipboard can fail in insecure contexts; ignore.
    }
  }

  async function save() {
    const name = `krang-reply-${new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-')}.md`
    try {
      await saveText(name, content, 'text/markdown')
      setSaved(true)
      setTimeout(() => setSaved(false), 1500)
    } catch {
      // User cancelled the picker or write failed; ignore.
    }
  }

  return (
    <div className="mt-1.5 flex gap-3 opacity-0 transition-opacity group-hover:opacity-100">
      <button
        type="button"
        onClick={copy}
        className="font-mono text-[10px] uppercase tracking-wide text-faint transition-colors hover:text-krang"
      >
        {copied ? 'copied' : 'copy'}
      </button>
      <button
        type="button"
        onClick={save}
        className="font-mono text-[10px] uppercase tracking-wide text-faint transition-colors hover:text-krang"
      >
        {saved ? 'saved' : 'save .md'}
      </button>
    </div>
  )
}

// Open model-generated links in a new tab, hardened against reverse tabnabbing.
function SafeLink({ node, ...props }) {
  return <a {...props} target="_blank" rel="noreferrer noopener" />
}
