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
  Play,
  Compass,
} from 'lucide-react';
import { ChatMessageItem, useAIStore } from '@/src/client/presentation/stores/aiStore';
import { inferModelMetadata } from '@/src/core/constants/ai-models';
import { useOnboardingStore, TourTrackId } from '@/src/client/presentation/stores/onboardingStore';
import { MarkdownReader } from './MarkdownReader';

export const ChatMessage: React.FC<{
  message: ChatMessageItem;
  isLast?: boolean;
}> = ({ message, isLast = false }) => {
  const isAssistant = message.role === 'assistant';
  const { retryLastMessage, sendMessage, isStreaming } = useAIStore();
  const [isReasoningOpen, setIsReasoningOpen] = useState<boolean>(false);
  const [isCopied, setIsCopied] = useState<boolean>(false);

  const modelDef = message.model ? inferModelMetadata(message.model) : null;

  // Extract interactive tour action triggers: [action:start-tour:TRACK_ID|Button Label]
  const tourActions: Array<{ trackId: string; label: string }> = [];
  const cleanContent = (message.content || '').replace(
    /\[action:start-tour:([a-zA-Z0-9_-]+)(?:\|([^\]]*))?\]/g,
    (_, trackId, label) => {
      tourActions.push({
        trackId: trackId.trim(),
        label: label ? label.trim() : 'Mulai Tur Interaktif',
      });
      return '';
    }
  );

  const handleCopyBubble = () => {
    if (!cleanContent) return;
    navigator.clipboard.writeText(cleanContent);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  const handleStartTour = (trackId: string) => {
    useAIStore.getState().closeDrawer();
    useOnboardingStore.getState().startTourTrack(trackId as TourTrackId);
  };

  const getFollowUps = (text: string): string[] => {
    if (!text || text.length < 30) return [];
    const lower = text.toLowerCase();
    const suggestions: string[] = [];

    if (lower.includes('scenario flow') || lower.includes('flow') || lower.includes('step')) {
      suggestions.push('🚀 Berikan panduan dan tur interaktif Scenario Flow');
      suggestions.push('🔄 Bagaimana cara looping data dengan Data Sheet?');
    } else if (lower.includes('mock') || lower.includes('api') || lower.includes('scenario')) {
      suggestions.push('🎯 Tuntun saya membuat Mock API dan Response Scenario');
      suggestions.push('⚡ Jelaskan cara kerja path matching & query param');
    } else if (lower.includes('variabel') || lower.includes('variable') || lower.includes('token')) {
      suggestions.push('⚡ Contoh generator token dinamis {{$uuid}} & {{$timestamp}}');
      suggestions.push('🔄 Cara chaining value dari response step sebelumnya');
    } else if (lower.includes('insomnia') || lower.includes('openapi') || lower.includes('convert')) {
      suggestions.push('📦 Bagaimana cara konversi spesifikasi OpenAPI & Insomnia?');
      suggestions.push('🚀 Langkah impor ke project Mocking Kita');
    } else if (lower.includes('database') || lower.includes('backup') || lower.includes('admin')) {
      suggestions.push('🛠️ Bagaimana cara backup snapshot database dan audit Change Logs?');
    } else {
      suggestions.push('🧭 Buka tur interaktif panduan sistem Mocking Kita');
      suggestions.push('💡 Bagaimana panduan langkahnya di menu Studio?');
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

    return <MarkdownReader content={content} textSize="sm" preserveNewlines />;
  };

  return (
    <div
      className={`flex gap-3.5 p-4 rounded-2xl transition-colors overflow-hidden ${
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
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] text-slate-400 font-mono">
              {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
            {cleanContent && (
              <button
                type="button"
                onClick={handleCopyBubble}
                className="p-1 rounded-md text-slate-400 hover:text-purple-600 dark:hover:text-purple-400 hover:bg-slate-200/60 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                title={isCopied ? 'Tersalin!' : 'Salin isi pesan'}
                aria-label="Salin pesan"
              >
                {isCopied ? (
                  <Check className="w-3.5 h-3.5 text-emerald-500" />
                ) : (
                  <Copy className="w-3.5 h-3.5" />
                )}
              </button>
            )}
          </div>
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

        {renderFormattedContent(cleanContent)}

        {/* Interactive Tour Action Cards */}
        {isAssistant && tourActions.length > 0 && (
          <div className="space-y-2 pt-1">
            {tourActions.map((action, aIdx) => (
              <div
                key={aIdx}
                className="p-3.5 rounded-2xl bg-gradient-to-r from-purple-500/10 via-indigo-500/10 to-purple-500/10 border border-purple-500/30 flex flex-col gap-3 shadow-xs overflow-hidden"
              >
                <div className="flex items-start gap-3 min-w-0">
                  <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-purple-600 to-indigo-600 text-white flex items-center justify-center shrink-0 shadow-md shadow-purple-500/20 mt-0.5">
                    <Compass className="w-5 h-5 animate-spin-slow" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-xs font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5 flex-wrap">
                      <span>Tutorial Interaktif Tersedia</span>
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-purple-500/20 text-purple-600 dark:text-purple-300">
                        Coach Mark
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5 leading-relaxed">
                      Klik tombol untuk meluncurkan tur interaktif langkah demi langkah di aplikasi.
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => handleStartTour(action.trackId)}
                  className="w-full inline-flex items-center justify-center gap-2 px-3.5 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs font-semibold shadow-md shadow-purple-600/30 hover:shadow-purple-600/50 transition-all cursor-pointer min-w-0"
                >
                  <Play className="w-3.5 h-3.5 fill-current shrink-0" />
                  <span className="truncate">{action.label || 'Mulai Tur Interaktif'}</span>
                </button>
              </div>
            ))}
          </div>
        )}

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
