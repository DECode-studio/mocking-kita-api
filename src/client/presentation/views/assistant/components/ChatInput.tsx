'use client';

import React, { useState, useRef, useEffect } from 'react';
import {
  Send,
  Square,
  Trash2,
  Paperclip,
  X,
  FileCode,
  FileText,
  AlertCircle,
} from 'lucide-react';
import { useAIStore, AttachedFileItem } from '@/src/client/presentation/stores/aiStore';
import { ASSISTANT_TEXT, ASSISTANT_SUGGESTIONS, ASSISTANT_SEMANTIC_ID } from '../constant';

const ALLOWED_EXTENSIONS = ['.json', '.md', '.txt', '.yaml', '.yml', '.csv'];
const MAX_FILE_SIZE_BYTES = 1.5 * 1024 * 1024; // 1.5MB text limit

export const ChatInput: React.FC<{ compact?: boolean }> = ({ compact = false }) => {
  const { sendMessage, isStreaming, stopStreaming, clearActiveSession } = useAIStore();
  const [input, setInput] = useState('');
  const [attachedFiles, setAttachedFiles] = useState<AttachedFileItem[]>([]);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 160)}px`;
    }
  }, [input]);

  const processFiles = (files: FileList | File[]) => {
    setUploadError(null);
    const validFiles = Array.from(files);

    for (const file of validFiles) {
      const ext = '.' + file.name.split('.').pop()?.toLowerCase();
      if (!ALLOWED_EXTENSIONS.includes(ext)) {
        setUploadError(`Format file "${file.name}" tidak didukung. Harap unggah file .json, .md, .txt, atau .yaml.`);
        continue;
      }

      if (file.size > MAX_FILE_SIZE_BYTES) {
        setUploadError(`Ukuran file "${file.name}" melebihi batas maksimal 1.5 MB.`);
        continue;
      }

      const reader = new FileReader();
      reader.onload = (e) => {
        const text = e.target?.result as string;
        if (typeof text === 'string') {
          let detectedType = 'text';
          if (ext === '.json') detectedType = 'json';
          else if (ext === '.md') detectedType = 'markdown';
          else if (ext === '.yaml' || ext === '.yml') detectedType = 'yaml';

          setAttachedFiles((prev) => [
            ...prev.filter((f) => f.name !== file.name),
            {
              name: file.name,
              size: file.size,
              type: detectedType,
              content: text,
            },
          ]);
        }
      };
      reader.readAsText(file);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      processFiles(e.target.files);
      e.target.value = '';
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processFiles(e.dataTransfer.files);
    }
  };

  const removeAttachment = (fileName: string) => {
    setAttachedFiles((prev) => prev.filter((f) => f.name !== fileName));
  };

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if ((!input.trim() && attachedFiles.length === 0) || isStreaming) return;
    const textToSend = input.trim();
    const currentAttachments = [...attachedFiles];

    setInput('');
    setAttachedFiles([]);
    setUploadError(null);
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }

    sendMessage(textToSend, { attachments: currentAttachments });
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div className="space-y-2.5">
      {!compact && (
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none text-xs">
          {ASSISTANT_SUGGESTIONS.map((pill, idx) => (
            <button
              key={idx}
              type="button"
              disabled={isStreaming}
              onClick={() => {
                setInput(pill.prompt);
                textareaRef.current?.focus();
              }}
              className="shrink-0 px-2.5 py-1 rounded-full border border-slate-200 dark:border-slate-800 bg-white/70 dark:bg-slate-900/70 hover:border-purple-500/40 hover:bg-purple-500/10 text-slate-700 dark:text-slate-300 transition-all flex items-center gap-1.5 shadow-xs cursor-pointer"
            >
              <span>{pill.label}</span>
            </button>
          ))}
        </div>
      )}

      {/* Upload Error Banner */}
      {uploadError && (
        <div className="flex items-center justify-between px-3 py-2 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-600 dark:text-rose-400 text-xs">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{uploadError}</span>
          </div>
          <button
            type="button"
            onClick={() => setUploadError(null)}
            className="p-1 hover:bg-rose-500/20 rounded"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      <form
        id={ASSISTANT_SEMANTIC_ID.INPUT_FORM}
        onSubmit={handleSubmit}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`relative rounded-2xl border bg-white dark:bg-slate-900 shadow-xl shadow-slate-950/5 dark:shadow-black/40 overflow-hidden focus-within:border-purple-500 focus-within:ring-2 focus-within:ring-purple-500/20 transition-all ${
          isDragOver
            ? 'border-purple-500 ring-2 ring-purple-500/30 bg-purple-50/50 dark:bg-purple-950/20'
            : 'border-slate-300 dark:border-slate-700/80'
        }`}
      >
        {/* Attached Files Chips Bar */}
        {attachedFiles.length > 0 && (
          <div className="flex items-center gap-2 px-3.5 pt-3 pb-1 overflow-x-auto flex-wrap border-b border-slate-100 dark:border-slate-800/60 bg-slate-50/70 dark:bg-slate-950/50">
            {attachedFiles.map((file) => (
              <div
                key={file.name}
                className="flex items-center gap-2 px-2.5 py-1 rounded-lg bg-purple-500/15 border border-purple-500/30 text-purple-700 dark:text-purple-300 text-xs font-mono"
              >
                {file.type === 'json' ? (
                  <FileCode className="w-3.5 h-3.5 text-purple-500" />
                ) : (
                  <FileText className="w-3.5 h-3.5 text-indigo-500" />
                )}
                <span className="max-w-40 truncate font-semibold">{file.name}</span>
                <span className="text-[10px] text-slate-400">
                  ({(file.size / 1024).toFixed(1)} KB)
                </span>
                <button
                  type="button"
                  onClick={() => removeAttachment(file.name)}
                  className="p-0.5 hover:bg-rose-500/20 rounded text-slate-400 hover:text-rose-500 transition-colors"
                  title="Hapus Lampiran"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        )}

        <textarea
          id={ASSISTANT_SEMANTIC_ID.INPUT_TEXTAREA}
          ref={textareaRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={
            attachedFiles.length > 0
              ? 'Tambahkan instruksi untuk file terlampir...'
              : ASSISTANT_TEXT.PLACEHOLDER
          }
          rows={1}
          className="w-full resize-none px-4 pt-3.5 pb-12 bg-transparent text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none max-h-40 leading-relaxed font-sans"
        />

        {/* Hidden File Input */}
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept=".json,.md,.txt,.yaml,.yml,.csv"
          onChange={handleFileInputChange}
          className="hidden"
        />

        <div className="absolute bottom-2.5 left-3 right-3 flex items-center justify-between pointer-events-none">
          <div className="flex items-center gap-2 pointer-events-auto">
            <button
              id={ASSISTANT_SEMANTIC_ID.CLEAR_SESSION_BTN}
              type="button"
              onClick={clearActiveSession}
              title={ASSISTANT_TEXT.CLEAR_SESSION}
              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <Trash2 className="w-4 h-4" />
            </button>

            {/* File Attachment Button */}
            <button
              type="button"
              disabled={isStreaming}
              onClick={() => fileInputRef.current?.click()}
              title="Lampirkan File (.json, .md, .txt, .yaml)"
              className="flex items-center gap-1 px-2 py-1 rounded-lg text-slate-500 dark:text-slate-400 hover:text-purple-600 dark:hover:text-purple-300 hover:bg-purple-500/10 border border-transparent hover:border-purple-500/20 text-xs font-medium transition-colors cursor-pointer disabled:opacity-50"
            >
              <Paperclip className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Lampirkan File</span>
            </button>

            <span className="text-[11px] text-slate-400 hidden md:inline">
              <kbd className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-[10px] font-mono">
                Enter
              </kbd>{' '}
              kirim,{' '}
              <kbd className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-[10px] font-mono">
                Shift + Enter
              </kbd>{' '}
              baris baru
            </span>
          </div>

          <div className="pointer-events-auto">
            {isStreaming ? (
              <button
                id={ASSISTANT_SEMANTIC_ID.STOP_BTN}
                type="button"
                onClick={stopStreaming}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-500 hover:bg-rose-600 text-white text-xs font-semibold shadow-md shadow-rose-500/20 transition-all active:scale-95 cursor-pointer"
              >
                <Square className="w-3.5 h-3.5 fill-current" />
                <span>{ASSISTANT_TEXT.STOP_BUTTON}</span>
              </button>
            ) : (
              <button
                id={ASSISTANT_SEMANTIC_ID.SEND_BTN}
                type="submit"
                disabled={!input.trim() && attachedFiles.length === 0}
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-linear-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 disabled:opacity-40 disabled:cursor-not-allowed text-white text-xs font-semibold shadow-md shadow-purple-500/25 transition-all active:scale-95 cursor-pointer"
              >
                <span>{ASSISTANT_TEXT.SEND_BUTTON}</span>
                <Send className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      </form>
    </div>
  );
};
