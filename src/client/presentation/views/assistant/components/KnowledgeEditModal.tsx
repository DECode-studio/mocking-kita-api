'use client';

import React, { useState, useEffect } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { X, Save, FileText, Sparkles, Loader2, BookOpen, Layers } from 'lucide-react';
import { AssistantKnowledgeItem, SaveKnowledgeInput } from '@/src/client/domain/assistant-knowledge/entity/knowledge_item';

interface KnowledgeEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  item: AssistantKnowledgeItem | null;
  defaultCategory: 'product' | 'skill';
  onSave: (data: SaveKnowledgeInput) => Promise<void>;
}

export const KnowledgeEditModal: React.FC<KnowledgeEditModalProps> = ({
  isOpen,
  onClose,
  item,
  defaultCategory,
  onSave,
}) => {
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<'product' | 'skill'>('product');
  const [summary, setSummary] = useState('');
  const [content, setContent] = useState('');
  const [format, setFormat] = useState<'md' | 'json'>('md');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      if (item) {
        setTitle(item.title);
        setCategory(item.category);
        setSummary(item.summary || '');
        setContent(item.content || '');
        setFormat(item.format || 'md');
      } else {
        setTitle('');
        setCategory(defaultCategory);
        setSummary('');
        setContent('');
        setFormat('md');
      }
      setError(null);
    }
  }, [isOpen, item, defaultCategory]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError('Judul tidak boleh kosong');
      return;
    }
    if (!content.trim()) {
      setError('Konten tidak boleh kosong');
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);
      await onSave({
        id: item?.id,
        title: title.trim(),
        category,
        summary: summary.trim(),
        content: content.trim(),
        format,
      });
      onClose();
    } catch (err: any) {
      setError(err?.message || 'Gagal menyimpan data');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog.Root open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs z-50 animate-in fade-in duration-200" />
        <Dialog.Content className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-2xl max-h-[90vh] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl z-50 flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
          {/* Header */}
          <div className="flex items-center justify-between p-5 border-b border-slate-200 dark:border-slate-800 shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-600 dark:text-purple-400">
                {category === 'skill' ? <Sparkles className="w-5 h-5" /> : <BookOpen className="w-5 h-5" />}
              </div>
              <div>
                <Dialog.Title className="text-base font-bold text-slate-900 dark:text-slate-100">
                  {item ? 'Edit Knowledge / Skill' : 'Tambah Knowledge / Skill Baru'}
                </Dialog.Title>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {category === 'skill' ? 'Tersimpan di direktori SKILLS_PATH' : 'Tersimpan di direktori PRODUCT_KNOWLEDGE_PATH'}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 space-y-4 text-xs">
            {error && (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400">
                {error}
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Kategori
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setCategory('product')}
                    className={`flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl border font-semibold transition-all ${
                      category === 'product'
                        ? 'bg-purple-500/15 border-purple-500/40 text-purple-600 dark:text-purple-300'
                        : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50'
                    }`}
                  >
                    <BookOpen className="w-3.5 h-3.5" />
                    <span>Product Knowledge</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setCategory('skill')}
                    className={`flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl border font-semibold transition-all ${
                      category === 'skill'
                        ? 'bg-indigo-500/15 border-indigo-500/40 text-indigo-600 dark:text-indigo-300'
                        : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50'
                    }`}
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Skill</span>
                  </button>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Format Penyimpanan
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setFormat('md')}
                    className={`py-2 px-3 rounded-xl border font-semibold transition-all text-center ${
                      format === 'md'
                        ? 'bg-purple-500/15 border-purple-500/40 text-purple-600 dark:text-purple-300'
                        : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    Markdown (.md)
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormat('json')}
                    disabled={category === 'product'}
                    className={`py-2 px-3 rounded-xl border font-semibold transition-all text-center ${
                      category === 'product'
                        ? 'opacity-40 cursor-not-allowed border-slate-200 dark:border-slate-800 text-slate-400'
                        : format === 'json'
                        ? 'bg-purple-500/15 border-purple-500/40 text-purple-600 dark:text-purple-300'
                        : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400'
                    }`}
                    title={category === 'product' ? 'Product knowledge selalu berformat Markdown' : ''}
                  >
                    JSON (.json)
                  </button>
                </div>
              </div>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Judul Modul / Skill <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Contoh: 09. Advanced GraphQL Simulation"
                className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-purple-500/30"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Ringkasan / Summary
              </label>
              <input
                type="text"
                value={summary}
                onChange={(e) => setSummary(e.target.value)}
                placeholder="Deskripsi singkat modul untuk indexing dan pencarian AI..."
                className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-purple-500/30"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="font-semibold text-slate-700 dark:text-slate-300">
                  Konten Instruksi / Dokumentasi ({format.toUpperCase()}) <span className="text-rose-500">*</span>
                </label>
                <span className="text-[11px] text-slate-400">
                  Mendukung Markdown lengkap
                </span>
              </div>
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                rows={12}
                placeholder={
                  format === 'json'
                    ? '{\n  "instruction": "..."\n}'
                    : '# Judul Panduan\n\n- Langkah 1\n- Langkah 2'
                }
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 text-slate-900 dark:text-slate-100 font-mono text-xs focus:outline-none focus:ring-2 focus:ring-purple-500/30 leading-relaxed"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200 dark:border-slate-800">
              <button
                type="button"
                onClick={onClose}
                disabled={isSubmitting}
                className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 font-semibold transition-all"
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-semibold shadow-md shadow-purple-500/20 transition-all disabled:opacity-50"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Menyimpan...</span>
                  </>
                ) : (
                  <>
                    <Save className="w-3.5 h-3.5" />
                    <span>Simpan</span>
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

