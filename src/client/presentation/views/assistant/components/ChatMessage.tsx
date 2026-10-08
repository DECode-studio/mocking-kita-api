'use client';

import React, { useState } from 'react';
import {
  User,
  Copy,
  Check,
  Brain,
  ChevronDown,
  ChevronUp,
  Sparkles,
  FileCode,
  FileText,
  RotateCw,
  Lightbulb,
} from 'lucide-react';
import { ChatMessageItem, useAIStore } from '@/src/client/presentation/stores/aiStore';
import { NIM_MODELS } from '@/src/core/constants/ai-models';

export const ChatMessage: React.FC<{
  message: ChatMessageItem;
  isLast?: boolean;
}> = ({ message, isLast = false }) => {
  const isAssistant = message.role === 'assistant';
  const { retryLastMessage, sendMessage, isStreaming } = useAIStore();
  const [copiedCodeId, setCopiedCodeId] = useState<string | null>(null);
  const [isReasoningOpen, setIsReasoningOpen] = useState<boolean>(true);

  const modelDef = message.model ? NIM_MODELS[message.model] : null;

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCodeId(id);
    setTimeout(() => setCopiedCodeId(null), 2000);
  };

  const getFollowUps = (text: string): string[] => {
    if (!text || text.length < 30) return [];
    const lower = text.toLowerCase();
    const suggestions: string[] = [];

    if (lower.includes('scenario flow') || lower.includes('flow') || lower.includes('step')) {
      suggestions.push('🚀 Berikan contoh assertion rule pada step');
      suggestions.push('🔄 Bagaimana cara looping data dengan Data Sheet?');
    } else if (lower.includes('mock') || lower.includes('api') || lower.includes('scenario')) {
      suggestions.push('🎯 Bagaimana cara buat skenario respons error 400 & 500?');
      suggestions.push('⚡ Jelaskan cara kerja path matching & query param');
    } else if (lower.includes('variabel') || lower.includes('variable') || lower.includes('token')) {
      suggestions.push('⚡ Contoh generator token dinamis {{$uuid}} & {{$timestamp}}');
      suggestions.push('🔄 Cara chaining value dari response step sebelumnya');
    } else if (lower.includes('insomnia') || lower.includes('openapi') || lower.includes('convert')) {
      suggestions.push('📦 Bagaimana format JSON template Scenario Flow v1?');
      suggestions.push('🚀 Langkah impor ke project Mocking Kita');
    } else {
      suggestions.push('💡 Berikan contoh cURL atau kode implementasinya');
      suggestions.push('🛠️ Bagaimana panduan langkahnya di menu Studio?');
    }

    return suggestions.slice(0, 2);
  };

  const followUpPills = isAssistant && !isStreaming ? getFollowUps(message.content) : [];

  const renderFormattedContent = (content: string) => {
    if (!content) {
      return (
        <div className="flex items-center gap-2 text-slate-400 dark:text-slate-500 py-1">
          <div className="w-2 h-2 rounded-full bg-purple-500 animate-pulse" />
          <span className="text-xs font-mono">Sedang berpikir & menyusun respons...</span>
        </div>
      );
    }

    const parts = content.split(/(```[\s\S]*?```)/g);

    return (
      <div className="space-y-3 text-sm leading-relaxed">
        {parts.map((part, index) => {
          if (part.startsWith('```') && part.endsWith('```')) {
            const lines = part.slice(3, -3).trim().split('\n');
            const lang = lines[0]?.trim() || 'text';
            const code = lines.slice(1).join('\n') || lines[0] || '';
            const codeId = `code_${message.id}_${index}`;
            const isCopied = copiedCodeId === codeId;

            return (
              <div
                key={index}
                className="my-3 rounded-xl border border-slate-700/60 bg-slate-950/90 text-slate-100 overflow-hidden shadow-lg shadow-black/20"
              >
                <div className="flex items-center justify-between px-3.5 py-1.5 bg-slate-900/90 border-b border-slate-800 text-xs text-slate-400 font-mono">
                  <span className="uppercase text-purple-400 font-semibold">{lang}</span>
                  <button
                    type="button"
                    onClick={() => copyToClipboard(code, codeId)}
                    className="flex items-center gap-1.5 hover:text-white px-2 py-1 rounded bg-slate-800/80 hover:bg-slate-700 transition-colors cursor-pointer"
                  >
                    {isCopied ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                        <span className="text-emerald-400 font-sans">Tersalin!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span className="font-sans">Salin</span>
                      </>
                    )}
                  </button>
                </div>
                <pre className="p-3.5 text-xs font-mono overflow-x-auto selection:bg-purple-500/40 text-slate-200">
                  <code>{code}</code>
                </pre>
              </div>
            );
          }

          const paragraphs = part.split('\n\n');
          return (
            <div key={index} className="space-y-2">
              {paragraphs.map((para, pIdx) => {
                if (!para.trim()) return null;

                if (para.startsWith('### ')) {
                  return (
                    <h4 key={pIdx} className="font-bold text-slate-900 dark:text-slate-100 text-base mt-3 mb-1">
                      {para.replace('### ', '')}
                    </h4>
                  );
                }
                if (para.startsWith('## ')) {
                  return (
                    <h3 key={pIdx} className="font-bold text-slate-900 dark:text-slate-100 text-lg mt-4 mb-1.5">
                      {para.replace('## ', '')}
                    </h3>
                  );
                }

                if (para.includes('\n- ') || para.startsWith('- ') || para.includes('\n* ') || para.startsWith('* ')) {
                  const items = para.split(/\n[-*]\s+/).filter(Boolean);
                  return (
                    <ul key={pIdx} className="list-disc list-inside space-y-1 my-1.5 pl-1 text-slate-700 dark:text-slate-300">
                      {items.map((it, iIdx) => (
                        <li key={iIdx} dangerouslySetInnerHTML={{ __html: formatInlineMarkdown(it) }} />
                      ))}
                    </ul>
                  );
                }

                if (/^\d+\.\s+/.test(para)) {
                  const lines = para.split('\n');
                  return (
                    <ol key={pIdx} className="list-decimal list-inside space-y-1 my-1.5 pl-1 text-slate-700 dark:text-slate-300">
                      {lines.map((line, lIdx) => (
                        <li
                          key={lIdx}
                          dangerouslySetInnerHTML={{
                            __html: formatInlineMarkdown(line.replace(/^\d+\.\s+/, '')),
                          }}
                        />
                      ))}
                    </ol>
                  );
                }

                return (
                  <p
                    key={pIdx}
                    className="text-slate-800 dark:text-slate-200"
                    dangerouslySetInnerHTML={{ __html: formatInlineMarkdown(para) }}
                  />
                );
              })}
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div
      className={`flex gap-3.5 p-4 rounded-2xl transition-colors ${
        isAssistant
          ? 'bg-slate-100/80 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800/80'
          : 'bg-purple-500/10 dark:bg-purple-950/20 border border-purple-500/20 ml-6'
      }`}
    >
      <div
        className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
          isAssistant
            ? 'bg-linear-to-tr from-purple-600 to-indigo-600 text-white shadow-md shadow-purple-500/20'
            : 'bg-slate-800 text-slate-200'
        }`}
      >
        {isAssistant ? <Sparkles className="w-4 h-4" /> : <User className="w-4 h-4" />}
      </div>

      <div className="flex-1 min-w-0 space-y-2">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-slate-900 dark:text-slate-100">
              {isAssistant ? 'Mocking Kita Assistant' : 'Anda'}
            </span>
            {isAssistant && modelDef && (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-purple-500/15 text-purple-600 dark:text-purple-300 border border-purple-500/20">
                {modelDef.name}
              </span>
            )}
          </div>
          <span className="text-[10px] text-slate-400 font-mono">
            {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </span>
        </div>

        {/* Attached Files on User Message */}
        {!isAssistant && message.attachments && message.attachments.length > 0 && (
          <div className="flex flex-wrap gap-2 pt-1 pb-1">
            {message.attachments.map((file, fIdx) => (
              <div
                key={fIdx}
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-purple-500/20 border border-purple-500/30 text-purple-900 dark:text-purple-200 text-xs font-mono"
              >
                {file.type === 'json' ? (
                  <FileCode className="w-3.5 h-3.5 text-purple-500" />
                ) : (
                  <FileText className="w-3.5 h-3.5 text-indigo-500" />
                )}
                <span className="font-semibold">{file.name}</span>
                <span className="text-[10px] opacity-70">
                  ({(file.size / 1024).toFixed(1)} KB)
                </span>
              </div>
            ))}
          </div>
        )}

        {isAssistant && message.reasoning && (
          <div className="rounded-xl border border-indigo-500/30 bg-indigo-950/20 dark:bg-indigo-950/40 overflow-hidden">
            <button
              type="button"
              onClick={() => setIsReasoningOpen(!isReasoningOpen)}
              className="w-full px-3 py-1.5 flex items-center justify-between text-xs font-medium text-indigo-600 dark:text-indigo-300 hover:bg-indigo-500/10 transition-colors cursor-pointer"
            >
              <div className="flex items-center gap-1.5">
                <Brain className="w-3.5 h-3.5 text-indigo-400 animate-pulse" />
                <span>Thinking Process (Reasoning Stream)</span>
              </div>
              {isReasoningOpen ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>
            {isReasoningOpen && (
              <div className="p-3 text-xs font-mono text-slate-600 dark:text-slate-300 border-t border-indigo-500/20 bg-black/20 max-h-48 overflow-y-auto whitespace-pre-wrap leading-relaxed">
                {message.reasoning}
              </div>
            )}
          </div>
        )}

        {renderFormattedContent(message.content)}

        {/* Follow-up Suggestions & Retry Actions for Assistant Message */}
        {isAssistant && message.content && (
          <div className="pt-2 space-y-2">
            {/* Follow-up Question Pills */}
            {followUpPills.length > 0 && (
              <div className="space-y-1.5 pt-1">
                <div className="flex items-center gap-1 text-[11px] font-semibold text-purple-600 dark:text-purple-400">
                  <Lightbulb className="w-3 h-3" />
                  <span>Pertanyaan Lanjutan:</span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {followUpPills.map((pill, pIdx) => (
                    <button
                      key={pIdx}
                      type="button"
                      disabled={isStreaming}
                      onClick={() => sendMessage(pill)}
                      className="text-left px-2.5 py-1 rounded-xl text-xs bg-purple-500/10 hover:bg-purple-500/20 text-purple-700 dark:text-purple-300 border border-purple-500/20 hover:border-purple-500/40 transition-all cursor-pointer disabled:opacity-50"
                    >
                      {pill}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Retry Button */}
            <div className="flex items-center justify-between pt-1 border-t border-slate-200/50 dark:border-slate-800/50 text-[11px]">
              <button
                type="button"
                disabled={isStreaming}
                onClick={retryLastMessage}
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-200/60 dark:bg-slate-800/80 hover:bg-purple-500/15 hover:text-purple-600 dark:hover:text-purple-400 text-slate-600 dark:text-slate-400 transition-all font-medium cursor-pointer disabled:opacity-50"
                title="Regenerate respons terakhir"
              >
                <RotateCw className="w-3 h-3" />
                <span>Coba Lagi / Regenerate</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

function formatInlineMarkdown(text: string): string {
  if (!text) return '';
  return text
    .replace(/\*\*(.*?)\*\*/g, '<strong class="font-semibold text-slate-900 dark:text-white">$1</strong>')
    .replace(/\*(.*?)\*/g, '<em class="italic">$1</em>')
    .replace(
      /`([^`]+)`/g,
      '<code class="px-1.5 py-0.5 rounded bg-purple-500/10 text-purple-600 dark:text-purple-300 font-mono text-[13px] border border-purple-500/20">$1</code>'
    );
}
