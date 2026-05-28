'use client';

import React from 'react';
import ReactMarkdown, { type Components } from 'react-markdown';
import remarkGfm from 'remark-gfm';

const colorMap: Record<string, { bubble: string; avatarBg: string; avatarIcon: string; link: string }> = {
  teal: {
    bubble: 'bg-teal-600 text-white',
    avatarBg: 'bg-teal-100',
    avatarIcon: 'text-teal-600',
    link: 'text-teal-600 hover:text-teal-700',
  },
  indigo: {
    bubble: 'bg-indigo-600 text-white',
    avatarBg: 'bg-indigo-100',
    avatarIcon: 'text-indigo-600',
    link: 'text-indigo-600 hover:text-indigo-700',
  },
};

// Tailwind-styled renderers for the markdown elements Gemini emits.
// Kept as a factory so we can close over the link color per theme.
function makeMarkdownComponents(linkClass: string): Components {
  return {
    // Paragraphs: small vertical rhythm, no extra margin on the last one
    p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
    // Lists: indented with a marker, compact spacing
    ul: ({ children }) => (
      <ul className="list-disc pl-5 mb-2 last:mb-0 space-y-1">{children}</ul>
    ),
    ol: ({ children }) => (
      <ol className="list-decimal pl-5 mb-2 last:mb-0 space-y-1">{children}</ol>
    ),
    li: ({ children }) => <li className="leading-relaxed">{children}</li>,
    // Inline emphasis
    strong: ({ children }) => <strong className="font-bold">{children}</strong>,
    em: ({ children }) => <em className="italic">{children}</em>,
    // Inline code
    code: ({ children }) => (
      <code className="bg-slate-100 text-slate-800 px-1 py-0.5 rounded text-xs font-mono">
        {children}
      </code>
    ),
    // Block quotes
    blockquote: ({ children }) => (
      <blockquote className="border-l-4 border-slate-200 pl-3 italic text-slate-600 mb-2 last:mb-0">
        {children}
      </blockquote>
    ),
    // Headers (Gemini rarely uses them but handle all six)
    h1: ({ children }) => <h1 className="text-base font-bold mb-2">{children}</h1>,
    h2: ({ children }) => <h2 className="text-base font-bold mb-2">{children}</h2>,
    h3: ({ children }) => <h3 className="text-sm font-bold mb-2">{children}</h3>,
    h4: ({ children }) => <h4 className="text-sm font-bold mb-2">{children}</h4>,
    h5: ({ children }) => <h5 className="text-sm font-bold mb-2">{children}</h5>,
    h6: ({ children }) => <h6 className="text-sm font-bold mb-2">{children}</h6>,
    // Links open in a new tab with noopener/noreferrer for safety
    a: ({ href, children }) => (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className={`underline ${linkClass}`}
      >
        {children}
      </a>
    ),
    // Horizontal rules
    hr: () => <hr className="my-3 border-slate-200" />,
    // Tables (GFM). Wrapped in an overflow-x-auto container so wide tables
    // scroll horizontally instead of blowing out the chat bubble width.
    table: ({ children }) => (
      <div className="overflow-x-auto my-2 -mx-1">
        <table className="min-w-full text-xs border-collapse border border-slate-200 rounded-lg">
          {children}
        </table>
      </div>
    ),
    thead: ({ children }) => (
      <thead className="bg-slate-50">{children}</thead>
    ),
    tbody: ({ children }) => <tbody>{children}</tbody>,
    tr: ({ children }) => (
      <tr className="border-b border-slate-200 last:border-b-0">{children}</tr>
    ),
    th: ({ children }) => (
      <th className="px-2 py-1.5 text-left font-bold text-slate-700 border-r border-slate-200 last:border-r-0">
        {children}
      </th>
    ),
    td: ({ children }) => (
      <td className="px-2 py-1.5 text-slate-600 border-r border-slate-200 last:border-r-0 align-top">
        {children}
      </td>
    ),
    // Strikethrough (GFM)
    del: ({ children }) => <del className="line-through">{children}</del>,
  };
}

interface ChatMessageProps {
  role: 'user' | 'assistant';
  content: string;
  createdAt: string;
  accentColor?: string;
  /** When true, render a blinking cursor after the content and hide the timestamp. */
  streaming?: boolean;
}

export default function ChatMessage({
  role,
  content,
  createdAt,
  accentColor = 'teal',
  streaming = false,
}: ChatMessageProps) {
  const isUser = role === 'user';
  const colors = colorMap[accentColor] || colorMap.teal;

  const time = new Date(createdAt).toLocaleTimeString('el-GR', {
    hour: '2-digit',
    minute: '2-digit',
  });

  const markdownComponents = React.useMemo(
    () => makeMarkdownComponents(colors.link),
    [colors.link],
  );

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-4`}>
      {!isUser && (
        <div className={`mr-2 mt-1 flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full sm:mr-3 sm:h-8 sm:w-8 ${colors.avatarBg}`}>
          <svg className={`w-4 h-4 ${colors.avatarIcon}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 3.104v5.714a2.25 2.25 0 01-.659 1.591L5 14.5M9.75 3.104c-.251.023-.501.05-.75.082m.75-.082a24.301 24.301 0 014.5 0m0 0v5.714a2.25 2.25 0 00.659 1.591L19 14.5M14.25 3.104c.251.023.501.05.75.082M19 14.5l-2.47 2.47a2.25 2.25 0 01-1.59.659H9.06a2.25 2.25 0 01-1.591-.659L5 14.5m14 0V5a2 2 0 00-2-2H7a2 2 0 00-2 2v9.5" />
          </svg>
        </div>
      )}
      <div
        className={`max-w-[88%] break-words rounded-2xl px-3 py-2.5 sm:max-w-[75%] sm:px-4 sm:py-3 ${
          isUser
            ? colors.bubble
            : 'bg-white border border-slate-200 text-slate-800'
        }`}
      >
        {isUser ? (
          // User messages: render as plain text. Users don't type markdown
          // and we don't want their literal ** or * to become formatting.
          <p className="text-sm whitespace-pre-wrap leading-relaxed">{content}</p>
        ) : (
          // Assistant messages: render markdown (bold, lists, links, etc.)
          // via react-markdown. react-markdown is safe-by-default — it
          // does NOT render raw HTML, so there's no XSS risk from Gemini.
          <div className="text-sm leading-relaxed">
            {content && (
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={markdownComponents}
              >
                {content}
              </ReactMarkdown>
            )}
            {streaming && (
              <span
                className="inline-block w-1.5 h-4 bg-slate-400 animate-pulse align-middle"
                aria-hidden="true"
              />
            )}
          </div>
        )}
        {!streaming && (
          <p
            className={`text-xs mt-1 ${
              isUser ? 'text-white/70' : 'text-slate-400'
            }`}
          >
            {time}
          </p>
        )}
      </div>
    </div>
  );
}
