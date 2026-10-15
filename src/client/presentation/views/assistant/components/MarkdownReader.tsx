'use client';

import React, { useState } from 'react';
import { Copy, Check } from 'lucide-react';

interface MarkdownReaderProps {
  content: string;
  className?: string;
}

export const MarkdownReader: React.FC<MarkdownReaderProps> = ({
  content,
  className = '',
}) => {
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  const copyToClipboard = (text: string, index: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  if (!content) return null;

  // Split into code blocks vs non-code blocks
  const parts = content.split(/(```[\s\S]*?```)/g);

  return (
    <div className={`space-y-4 text-xs leading-relaxed text-slate-800 dark:text-slate-200 ${className}`}>
      {parts.map((part, index) => {
        // Fenced code block
        if (part.startsWith('```') && part.endsWith('```')) {
          const lines = part.slice(3, -3).trim().split('\n');
          const lang = lines[0]?.trim() || 'text';
          const code = lines.slice(1).join('\n') || lines[0] || '';
          const isCopied = copiedIndex === index;

          return (
            <div
              key={index}
              className="my-3 rounded-2xl border border-slate-700/60 bg-slate-950 text-slate-100 overflow-hidden shadow-lg shadow-black/20"
            >
              <div className="flex items-center justify-between px-4 py-2 bg-slate-900 border-b border-slate-800 text-[11px] font-mono">
                <span className="uppercase text-purple-400 font-bold tracking-wider">
                  {lang.toUpperCase()}
                </span>
                <button
                  type="button"
                  onClick={() => copyToClipboard(code, index)}
                  className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-all cursor-pointer font-sans"
                >
                  {isCopied ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                      <span className="text-emerald-400 font-semibold">Tersalin!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Salin</span>
                    </>
                  )}
                </button>
              </div>
              <pre className="p-4 text-xs font-mono overflow-x-auto selection:bg-purple-500/40 text-slate-200 leading-normal">
                <code>{code}</code>
              </pre>
            </div>
          );
        }

        // Render markdown blocks
        return <MarkdownBlock key={index} text={part} />;
      })}
    </div>
  );
};

const MarkdownBlock: React.FC<{ text: string }> = ({ text }) => {
  const paragraphs = text.split(/\n\s*\n/);

  return (
    <div className="space-y-3">
      {paragraphs.map((para, pIdx) => {
        const trimmed = para.trim();
        if (!trimmed) return null;

        // Headings
        if (trimmed.startsWith('# ')) {
          return (
            <h1
              key={pIdx}
              className="text-lg font-black text-slate-900 dark:text-slate-100 border-b border-slate-200 dark:border-slate-800 pb-2 pt-2 mt-4 first:mt-0 tracking-tight"
            >
              {renderInline(trimmed.replace(/^#\s+/, ''))}
            </h1>
          );
        }

        if (trimmed.startsWith('## ')) {
          return (
            <h2
              key={pIdx}
              className="text-base font-bold text-slate-900 dark:text-slate-100 pt-2 mt-4 first:mt-0 tracking-tight"
            >
              {renderInline(trimmed.replace(/^##\s+/, ''))}
            </h2>
          );
        }

        if (trimmed.startsWith('### ')) {
          return (
            <h3
              key={pIdx}
              className="text-sm font-bold text-purple-700 dark:text-purple-300 pt-1 mt-3 first:mt-0"
            >
              {renderInline(trimmed.replace(/^###\s+/, ''))}
            </h3>
          );
        }

        if (trimmed.startsWith('#### ')) {
          return (
            <h4
              key={pIdx}
              className="text-xs font-bold text-slate-800 dark:text-slate-200 pt-1 mt-2 first:mt-0"
            >
              {renderInline(trimmed.replace(/^####\s+/, ''))}
            </h4>
          );
        }

        // Horizontal Rule
        if (/^(\-{3,}|\*{3,}|_{3,})$/.test(trimmed)) {
          return (
            <hr key={pIdx} className="my-4 border-slate-200 dark:border-slate-800" />
          );
        }

        // Blockquotes
        if (trimmed.startsWith('>')) {
          const quoteLines = trimmed
            .split('\n')
            .map((l) => l.replace(/^>\s?/, ''))
            .join('\n');
          return (
            <blockquote
              key={pIdx}
              className="pl-4 py-2 border-l-4 border-purple-500/70 bg-purple-500/5 dark:bg-purple-950/20 rounded-r-xl italic text-slate-700 dark:text-slate-300 my-2"
            >
              {renderInline(quoteLines)}
            </blockquote>
          );
        }

        // Tables: simple detection (lines start and end with |)
        const lines = trimmed.split('\n');
        if (lines.length >= 2 && lines.every((l) => l.trim().startsWith('|') && l.trim().endsWith('|'))) {
          const headerCells = lines[0]
            .split('|')
            .slice(1, -1)
            .map((c) => c.trim());
          const rows = lines.slice(2).map((l) =>
            l
              .split('|')
              .slice(1, -1)
              .map((c) => c.trim())
          );

          return (
            <div key={pIdx} className="my-3 overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-100 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-800">
                    {headerCells.map((h, hIdx) => (
                      <th key={hIdx} className="p-2.5 font-bold text-slate-800 dark:text-slate-200">
                        {renderInline(h)}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                  {rows.map((row, rIdx) => (
                    <tr key={rIdx} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                      {row.map((cell, cIdx) => (
                        <td key={cIdx} className="p-2.5 text-slate-700 dark:text-slate-300">
                          {renderInline(cell)}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          );
        }

        // List item handling (supporting bullet points and numbered lists with indentation)
        if (lines.some((l) => /^\s*([-*]|\d+\.)\s+/.test(l))) {
          return (
            <div key={pIdx} className="space-y-1.5 my-2">
              {lines.map((line, lIdx) => {
                const matchBullet = line.match(/^(\s*)([-*]|\d+\.)\s+(.+)$/);
                if (matchBullet) {
                  const indent = matchBullet[1].length;
                  const isOrdered = /\d+\./.test(matchBullet[2]);
                  const content = matchBullet[3];
                  return (
                    <div
                      key={lIdx}
                      style={{ paddingLeft: `${Math.max(0, indent * 10 + (indent > 0 ? 12 : 4))}px` }}
                      className="flex items-start gap-2"
                    >
                      <span className="font-bold text-purple-500 shrink-0 mt-0.5 select-none">
                        {isOrdered ? matchBullet[2] : '•'}
                      </span>
                      <div className="flex-1 min-w-0 text-slate-700 dark:text-slate-300">
                        {renderInline(content)}
                      </div>
                    </div>
                  );
                }

                return (
                  <p key={lIdx} className="text-slate-700 dark:text-slate-300 pl-4">
                    {renderInline(line)}
                  </p>
                );
              })}
            </div>
          );
        }

        // Regular paragraph
        return (
          <p key={pIdx} className="text-slate-700 dark:text-slate-300 leading-relaxed">
            {renderInline(trimmed)}
          </p>
        );
      })}
    </div>
  );
};

/**
 * Format inline markdown: bold (**text**), italic (*text*), code (`code`), and links ([text](url))
 */
function renderInline(text: string): React.ReactNode {
  if (!text) return null;

  // Tokenize string for code, bold, italic, links
  const tokens: React.ReactNode[] = [];
  let remaining = text;
  let key = 0;

  // Regex to match inline elements
  const regex = /(`[^`]+`|\*\*[^*]+\*\*|\*[^*]+\*|\[[^\]]+\]\([^)]+\))/;

  while (remaining) {
    const match = remaining.match(regex);
    if (!match || match.index === undefined) {
      tokens.push(remaining);
      break;
    }

    // Add text before match
    if (match.index > 0) {
      tokens.push(remaining.slice(0, match.index));
    }

    const matchedStr = match[0];

    // Inline Code: `code`
    if (matchedStr.startsWith('`') && matchedStr.endsWith('`')) {
      const code = matchedStr.slice(1, -1);
      tokens.push(
        <code
          key={key++}
          className="px-1.5 py-0.5 rounded bg-purple-500/10 text-purple-600 dark:text-purple-300 font-mono text-[11px] border border-purple-500/20"
        >
          {code}
        </code>
      );
    }
    // Bold: **text**
    else if (matchedStr.startsWith('**') && matchedStr.endsWith('**')) {
      const boldText = matchedStr.slice(2, -2);
      tokens.push(
        <strong key={key++} className="font-bold text-slate-900 dark:text-slate-100">
          {boldText}
        </strong>
      );
    }
    // Italic: *text*
    else if (matchedStr.startsWith('*') && matchedStr.endsWith('*')) {
      const italicText = matchedStr.slice(1, -1);
      tokens.push(
        <em key={key++} className="italic text-slate-800 dark:text-slate-200">
          {italicText}
        </em>
      );
    }
    // Link: [label](url)
    else if (matchedStr.startsWith('[')) {
      const linkMatch = matchedStr.match(/^\[([^\]]+)\]\(([^)]+)\)$/);
      if (linkMatch) {
        tokens.push(
          <a
            key={key++}
            href={linkMatch[2]}
            target="_blank"
            rel="noopener noreferrer"
            className="text-purple-600 dark:text-purple-400 font-semibold underline underline-offset-2 hover:text-purple-500"
          >
            {linkMatch[1]}
          </a>
        );
      } else {
        tokens.push(matchedStr);
      }
    } else {
      tokens.push(matchedStr);
    }

    remaining = remaining.slice(match.index + matchedStr.length);
  }

  return <>{tokens}</>;
}
