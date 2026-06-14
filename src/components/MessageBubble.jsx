import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import remarkMath from 'remark-math'
import rehypeKatex from 'rehype-katex'
import CodeBlock from './CodeBlock.jsx'
import KrangLogo from './KrangLogo.jsx'

/**
 * A single chat message. User messages render as plain text in a bubble;
 * assistant messages render as markdown with syntax-highlighted code blocks.
 */
export default function MessageBubble({ role, content }) {
  const isUser = role === 'user'

  return (
    <div className={`flex w-full animate-risefade ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div className={`flex max-w-[760px] gap-3 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
        {/* Avatar */}
        <div
          className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-md border text-xs font-semibold ${
            isUser
              ? 'border-void-600 bg-void-800 font-mono text-muted'
              : 'border-krang/40 bg-void-850 text-krang'
          }`}
        >
          {isUser ? 'YOU' : <KrangLogo size={16} glow={false} />}
        </div>

        {/* Body */}
        <div
          className={`min-w-0 rounded-lg px-4 py-2.5 text-[15px] ${
            isUser
              ? 'border border-void-600 bg-void-800 font-sans text-fg'
              : 'border border-krang/20 bg-void-850/80 text-fg shadow-hud'
          }`}
        >
          {isUser ? (
            // Preserve user newlines without parsing markdown.
            <p className="whitespace-pre-wrap break-words">{content}</p>
          ) : (
            <div className="prose-chat break-words">
              <ReactMarkdown
                remarkPlugins={[remarkGfm, remarkMath]}
                rehypePlugins={[rehypeKatex]}
                components={{ code: CodeBlock }}
              >
                {content}
              </ReactMarkdown>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
