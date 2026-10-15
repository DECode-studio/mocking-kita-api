'use client';

import React from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { X, UploadCloud, FileText, FileArchive, Loader2, BookOpen, Sparkles, AlertCircle } from 'lucide-react';
import { useKnowledgeImportModal } from '../hook/useKnowledgeImportModal';
import { ASSISTANT_TEXT, ASSISTANT_SEMANTIC_ID } from '../constant';

interface KnowledgeImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultCategory: 'product' | 'skill';
  onImport: (category: 'product' | 'skill', file: File) => Promise<void>;
}

export const KnowledgeImportModal: React.FC<KnowledgeImportModalProps> = ({
  isOpen,
  onClose,
  defaultCategory,
  onImport,
}) => {
  const {
    category,
    selectCategory,
    selectedFile,
    isSubmitting,
    error,
    fileInputRef,
    acceptedExtensions,
    handleFileChange,
    handleSubmit,
  } = useKnowledgeImportModal({
    isOpen,
    defaultCategory,
    onImport,
    onClose,
  });

  return (
    <Dialog.Root open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs z-50 animate-in fade-in duration-200" />
        <Dialog.Content
          id={ASSISTANT_SEMANTIC_ID.KNOWLEDGE_IMPORT_MODAL}
          className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl z-50 flex flex-col overflow-hidden animate-in zoom-in-95 duration-200"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-5 border-b border-slate-200 dark:border-slate-800 shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-600 dark:text-purple-400">
                <UploadCloud className="w-5 h-5" />
              </div>
              <div>
                <Dialog.Title className="text-base font-bold text-slate-900 dark:text-slate-100">
                  {ASSISTANT_TEXT.CONVERTERS.KNOWLEDGE_IMPORT_MODAL_TITLE}
                </Dialog.Title>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {ASSISTANT_TEXT.CONVERTERS.KNOWLEDGE_IMPORT_MODAL_DESC}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              id={ASSISTANT_SEMANTIC_ID.KNOWLEDGE_IMPORT_CANCEL_BTN}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="p-5 space-y-4 text-xs">
            {error && (
              <div className="flex items-start gap-2 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Target Kategori
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => selectCategory('product')}
                  className={`flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl border font-semibold transition-all cursor-pointer ${
                    category === 'product'
                      ? 'bg-purple-500/15 border-purple-500/40 text-purple-600 dark:text-purple-300'
                      : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50'
                  }`}
                >
                  <BookOpen className="w-3.5 h-3.5" />
                  <span>{ASSISTANT_TEXT.CONVERTERS.KNOWLEDGE_TAB_PRODUCT}</span>
                </button>
                <button
                  type="button"
                  onClick={() => selectCategory('skill')}
                  className={`flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl border font-semibold transition-all cursor-pointer ${
                    category === 'skill'
                      ? 'bg-indigo-500/15 border-indigo-500/40 text-indigo-600 dark:text-indigo-300'
                      : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50'
                  }`}
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>{ASSISTANT_TEXT.CONVERTERS.KNOWLEDGE_TAB_SKILL} (.ZIP)</span>
                </button>
              </div>
            </div>

            {/* Dropzone */}
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Pilih File ({acceptedExtensions})
              </label>
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-purple-500 dark:hover:border-purple-400 rounded-2xl p-6 text-center cursor-pointer transition-colors bg-slate-50/50 dark:bg-slate-900/50"
              >
                <input
                  ref={fileInputRef}
                  id={ASSISTANT_SEMANTIC_ID.KNOWLEDGE_IMPORT_FILE_INPUT}
                  type="file"
                  accept={acceptedExtensions}
                  onChange={handleFileChange}
                  className="hidden"
                />

                {selectedFile ? (
                  <div className="flex flex-col items-center gap-2">
                    {selectedFile.name.endsWith('.zip') ? (
                      <FileArchive className="w-8 h-8 text-indigo-500" />
                    ) : (
                      <FileText className="w-8 h-8 text-purple-500" />
                    )}
                    <span className="font-bold text-slate-800 dark:text-slate-200 break-all">
                      {selectedFile.name}
                    </span>
                    <span className="text-[11px] text-slate-500">
                      {(selectedFile.size / 1024).toFixed(1)} KB
                    </span>
                    <span className="text-[10px] text-purple-600 dark:text-purple-400 font-semibold mt-1">
                      Klik untuk ganti file
                    </span>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-2">
                    <UploadCloud className="w-8 h-8 text-slate-400" />
                    <span className="font-semibold text-slate-700 dark:text-slate-300">
                      Klik untuk memilih file
                    </span>
                    <p className="text-[11px] text-slate-400 max-w-xs">
                      {category === 'skill'
                        ? 'Mendukung dokumen .md, .json, atau paket arsip .zip berisikan folder skill'
                        : 'Mendukung file dokumen .md atau .json'}
                    </p>
                  </div>
                )}
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200 dark:border-slate-800">
              <button
                type="button"
                onClick={onClose}
                disabled={isSubmitting}
                className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 font-semibold transition-all cursor-pointer"
              >
                Batal
              </button>
              <button
                type="submit"
                id={ASSISTANT_SEMANTIC_ID.KNOWLEDGE_IMPORT_SUBMIT_BTN}
                disabled={!selectedFile || isSubmitting}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-semibold shadow-md shadow-purple-500/20 transition-all disabled:opacity-50 cursor-pointer"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Mengimpor...</span>
                  </>
                ) : (
                  <>
                    <UploadCloud className="w-3.5 h-3.5" />
                    <span>Mulai Import</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
};
