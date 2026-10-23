'use client';

import React, { useState } from 'react';
import { Copy, Check } from 'lucide-react';

export interface MarkdownReaderProps {
  content: string;
  className?: string;
  textSize?: 'xs' | 'sm' | 'base';
  preserveNewlines?: boolean;
}

interface ListEntry {
  indent: number;
  isOrdered: boolean;
  bullet: string;
  text: string;
}

type ParsedBlock =
  | { type: 'heading'; level: 1 | 2 | 3 | 4 | 5 | 6; text: string }
  | { type: 'code'; lang: string; code: string }
  | { type: 'hr' }
  | { type: 'blockquote'; lines: string[] }
  | { type: 'table'; headers: string[]; rows: string[][] }
  | { type: 'list'; items: ListEntry[] }
  | { type: 'paragraph'; lines: string[] };

/**
 * Splits a table row into cells, respecting inline backticks
 */
function parseTableRow(line: string): string[] {
  let trimmed = line.trim();
  if (trimmed.startsWith('|')) trimmed = trimmed.slice(1);
  if (trimmed.endsWith('|')) trimmed = trimmed.slice(0, -1);

  const cells: string[] = [];
  let current = '';
  let inBacktick = false;

  for (let c = 0; c < trimmed.length; c++) {
    const char = trimmed[c];
    if (char === '`') {
      inBacktick = !inBacktick;
      current += char;
    } else if (char === '|' && !inBacktick) {
      cells.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  cells.push(current.trim());
  return cells;
}

/**
 * Robust line-by-line Markdown document parser
 */
function parseMarkdownDocument(markdown: string): ParsedBlock[] {
  if (!markdown) return [];

  const rawLines = markdown.split(/\r?\n/);
  const blocks: ParsedBlock[] = [];
  let i = 0;

  const isTableLine = (l: string) => {
    const trimmed = l.trim();
    return trimmed.startsWith('|') && (trimmed.endsWith('|') || trimmed.includes('|'));
  };

  const isStartOfTable = (idx: number) => {
    return (
      idx < rawLines.length &&
      isTableLine(rawLines[idx]) &&
      idx + 1 < rawLines.length &&
      isTableLine(rawLines[idx + 1]) &&
      rawLines[idx + 1].includes('--')
    );
  };

  while (i < rawLines.length) {
    const line = rawLines[i];

    // 1. Fenced Code Block: ```lang ... ```
    if (line.trim().startsWith('```')) {
      const lang = line.trim().slice(3).trim();
      const codeLines: string[] = [];
      i++;
      while (i < rawLines.length && !rawLines[i].trim().startsWith('```')) {
        codeLines.push(rawLines[i]);
        i++;
      }
      if (i < rawLines.length) i++; // skip closing ```
      blocks.push({ type: 'code', lang, code: codeLines.join('\n') });
      continue;
    }

    // 2. Headings: #, ##, ###, ####, #####, ###### (Strictly single line)
    const headingMatch = line.match(/^(#{1,6})\s+(.*)$/);
    if (headingMatch) {
      blocks.push({
        type: 'heading',
        level: headingMatch[1].length as 1 | 2 | 3 | 4 | 5 | 6,
        text: headingMatch[2].trim(),
      });
      i++;
      continue;
    }

    // 3. Horizontal Rule: ---, ***, or ___ (alone on line)
    if (/^(\-{3,}|\*{3,}|_{3,})$/.test(line.trim())) {
      blocks.push({ type: 'hr' });
      i++;
      continue;
    }

    // 4. Blockquote: starts with >
    if (line.trim().startsWith('>')) {
      const quoteLines: string[] = [];
      while (i < rawLines.length && rawLines[i].trim().startsWith('>')) {
        quoteLines.push(rawLines[i].trim().replace(/^>\s?/, ''));
        i++;
      }
      blocks.push({ type: 'blockquote', lines: quoteLines });
      continue;
    }

    // 5. Table: lines starting with | and having a delimiter row below
    if (isStartOfTable(i)) {
      const headerCells = parseTableRow(line);
      i += 2; // skip header and delimiter row
      const rows: string[][] = [];
      while (i < rawLines.length && isTableLine(rawLines[i])) {
        rows.push(parseTableRow(rawLines[i]));
        i++;
      }
      blocks.push({ type: 'table', headers: headerCells, rows });
      continue;
    }

    // 6. List items: bullet (- or * or +) or ordered (1. or 2.)
    const listMatch = line.match(/^(\s*)([-*+]|\d+[.)])\s+(.*)$/);
    if (listMatch) {
      const items: ListEntry[] = [];
      while (i < rawLines.length) {
        const itemMatch = rawLines[i].match(/^(\s*)([-*+]|\d+[.)])\s+(.*)$/);
        if (itemMatch) {
          items.push({
            indent: itemMatch[1].length,
            isOrdered: /\d+[.)]/.test(itemMatch[2]),
            bullet: itemMatch[2],
            text: itemMatch[3],
          });
          i++;
        } else if (
          rawLines[i].trim() &&
          rawLines[i].startsWith('  ') &&
          items.length > 0 &&
          !rawLines[i].match(/^(#{1,6})\s+/) &&
          !rawLines[i].trim().startsWith('```')
        ) {
          // Continuation line of previous list item
          items[items.length - 1].text += ' ' + rawLines[i].trim();
          i++;
        } else {
          break;
        }
      }
      blocks.push({ type: 'list', items });
      continue;
    }

    // 7. Empty lines: skip
    if (!line.trim()) {
      i++;
      continue;
    }

    // 8. Paragraph: collect lines until another block type or blank line
    const paraLines: string[] = [];
    while (
      i < rawLines.length &&
      rawLines[i].trim() &&
      !rawLines[i].match(/^(#{1,6})\s+/) &&
      !rawLines[i].trim().startsWith('```') &&
      !rawLines[i].trim().startsWith('>') &&
      !rawLines[i].match(/^(\s*)([-*+]|\d+[.)])\s+/) &&
      !isStartOfTable(i) &&
      !/^(\-{3,}|\*{3,}|_{3,})$/.test(rawLines[i].trim())
    ) {
      paraLines.push(rawLines[i]);
      i++;
    }
    if (paraLines.length > 0) {
      blocks.push({ type: 'paragraph', lines: paraLines });
    } else {
      // Guaranteed loop advancement to prevent any infinite freeze
      blocks.push({ type: 'paragraph', lines: [rawLines[i]] });
      i++;
    }
  }

  return blocks;
}

export const MarkdownReader: React.FC<MarkdownReaderProps> = ({
  content,
  className = '',
  textSize = 'xs',
  preserveNewlines = false,
}) => {
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  const copyToClipboard = (text: string, index: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  if (!content) return null;

  const blocks = parseMarkdownDocument(content);
  const textSizeClass =
    textSize === 'sm'
      ? 'text-sm'
      : textSize === 'base'
      ? 'text-base'
      : 'text-xs';

  return (
    <div className={`space-y-3.5 ${textSizeClass} leading-relaxed text-slate-800 dark:text-slate-200 ${className}`}>
      {blocks.map((block, index) => {
        switch (block.type) {
          case 'heading': {
            if (block.level === 1) {
              return (
                <h1
                  key={index}
                  className={`${
                    textSize === 'sm' ? 'text-xl' : 'text-lg'
                  } font-black text-slate-900 dark:text-slate-100 border-b border-slate-200 dark:border-slate-800 pb-2 pt-2 mt-4 first:mt-0 tracking-tight`}
                >
                  {renderInline(block.text)}
                </h1>
              );
            }
            if (block.level === 2) {
              return (
                <h2
                  key={index}
                  className={`${
                    textSize === 'sm' ? 'text-lg' : 'text-base'
                  } font-bold text-slate-900 dark:text-slate-100 pt-2 mt-3 first:mt-0 tracking-tight`}
                >
                  {renderInline(block.text)}
                </h2>
              );
            }
            if (block.level === 3) {
              return (
                <h3
                  key={index}
                  className={`${
                    textSize === 'sm' ? 'text-base' : 'text-sm'
                  } font-bold text-purple-700 dark:text-purple-300 pt-1 mt-2.5 first:mt-0`}
                >
                  {renderInline(block.text)}
                </h3>
              );
            }
            return (
              <h4
                key={index}
                className={`${
                  textSize === 'sm' ? 'text-sm' : 'text-xs'
                } font-bold text-slate-800 dark:text-slate-200 pt-1 mt-2 first:mt-0`}
              >
                {renderInline(block.text)}
              </h4>
            );
          }

          case 'code': {
            const isCopied = copiedIndex === index;
            return (
              <div
                key={index}
                className="my-3 rounded-2xl border border-slate-700/60 bg-slate-950 text-slate-100 overflow-hidden shadow-lg shadow-black/20"
              >
                <div className="flex items-center justify-between px-4 py-2 bg-slate-900 border-b border-slate-800 text-[11px] font-mono">
                  <span className="uppercase text-purple-400 font-bold tracking-wider">
                    {(block.lang || 'text').toUpperCase()}
                  </span>
                  <button
                    type="button"
                    onClick={() => copyToClipboard(block.code, index)}
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
                  <code>{block.code}</code>
                </pre>
              </div>
            );
          }

          case 'hr': {
            return (
              <hr key={index} className="my-4 border-slate-200 dark:border-slate-800" />
            );
          }

          case 'blockquote': {
            return (
              <blockquote
                key={index}
                className="pl-4 py-2 border-l-4 border-purple-500/70 bg-purple-500/5 dark:bg-purple-950/20 rounded-r-xl italic text-slate-700 dark:text-slate-300 my-2"
              >
                {block.lines.map((l, lIdx) => (
                  <p key={lIdx}>
                    {preserveNewlines && lIdx > 0 ? <br /> : null}
                    {renderInline(l)}
                  </p>
                ))}
              </blockquote>
            );
          }

          case 'table': {
            return (
              <div
                key={index}
                className="my-3 overflow-x-auto rounded-xl border border-slate-200/80 dark:border-slate-800/80 bg-white/40 dark:bg-slate-950/40 shadow-xs"
              >
                <table className={`w-full text-left ${textSize === 'sm' ? 'text-xs' : 'text-[11px]'} border-collapse`}>
                  <thead>
                    <tr className="bg-slate-100 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-800">
                      {block.headers.map((h, hIdx) => (
                        <th key={hIdx} className="p-2.5 font-bold text-slate-800 dark:text-slate-200 whitespace-nowrap">
                          {renderInline(h)}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                    {block.rows.map((row, rIdx) => (
                      <tr key={rIdx} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition-colors">
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

          case 'list': {
            return (
              <div key={index} className="space-y-1.5 my-2">
                {block.items.map((it, idx) => (
                  <div
                    key={idx}
                    style={{
                      paddingLeft: `${Math.max(0, it.indent * 8 + (it.indent > 0 ? 12 : 2))}px`,
                    }}
                    className="flex items-start gap-2 text-slate-700 dark:text-slate-300 leading-relaxed"
                  >
                    <span className={`font-bold text-purple-500 shrink-0 mt-0.5 select-none ${textSize === 'sm' ? 'text-xs' : 'text-[11px]'}`}>
                      {it.isOrdered ? it.bullet : '•'}
                    </span>
                    <div className="flex-1 min-w-0">{renderInline(it.text)}</div>
                  </div>
                ))}
              </div>
            );
          }

          case 'paragraph': {
            return (
              <p key={index} className="text-slate-700 dark:text-slate-300 leading-relaxed">
                {preserveNewlines ? (
                  block.lines.map((l, lIdx) => (
                    <React.Fragment key={lIdx}>
                      {lIdx > 0 && <br />}
                      {renderInline(l)}
                    </React.Fragment>
                  ))
                ) : (
                  renderInline(block.lines.join(' '))
                )}
              </p>
            );
          }

          default:
            return null;
        }
      })}
    </div>
  );
};

/**
 * Format inline markdown: bold (**text**), italic (*text*), underline (<u>text</u>),
 * strikethrough (~~text~~), code (`code`), and links ([text](url))
 */
function renderInline(text: string): React.ReactNode {
  if (!text) return null;

  const tokens: React.ReactNode[] = [];
  let remaining = text;
  let key = 0;

  // Regex for inline elements
  const regex = /(`[^`]+`|\*\*\*[^*]+\*\*\*|\*\*[^*]+\*\*|\*[^*]+\*|<u>[^<]+<\/u>|~~[^~]+~~|\[[^\]]+\]\([^)]+\))/;

  while (remaining) {
    const match = remaining.match(regex);
    if (!match || match.index === undefined) {
      tokens.push(remaining);
      break;
    }

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
          className="px-1.5 py-0.5 rounded bg-purple-500/15 text-purple-600 dark:text-purple-300 font-mono text-[0.875em] border border-purple-500/20"
        >
          {code}
        </code>
      );
    }
    // Bold & Italic: ***text***
    else if (matchedStr.startsWith('***') && matchedStr.endsWith('***')) {
      const biText = matchedStr.slice(3, -3);
      tokens.push(
        <strong key={key++} className="font-bold italic text-slate-900 dark:text-slate-100">
          {biText}
        </strong>
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
    // Underline: <u>text</u>
    else if (matchedStr.startsWith('<u>') && matchedStr.endsWith('</u>')) {
      const uText = matchedStr.slice(3, -4);
      tokens.push(
        <u key={key++} className="underline underline-offset-2">
          {uText}
        </u>
      );
    }
    // Strikethrough: ~~text~~
    else if (matchedStr.startsWith('~~') && matchedStr.endsWith('~~')) {
      const sText = matchedStr.slice(2, -2);
      tokens.push(
        <s key={key++} className="line-through text-slate-400">
          {sText}
        </s>
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

    const sliceLen = match.index + matchedStr.length;
    if (sliceLen <= 0) {
      tokens.push(remaining);
      break;
    }
    remaining = remaining.slice(sliceLen);
  }

  return <>{tokens}</>;
}
