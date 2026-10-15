'use client';

import React from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import {
  X,
  Save,
  Loader2,
  BookOpen,
  Sparkles,
  Bold,
  Italic,
  Underline,
  Strikethrough,
  Heading1,
  Heading2,
  Heading3,
  Code,
  FileCode,
  List,
  ListOrdered,
  Quote,
  Link2,
  Table,
  Eye,
  Edit2,
} from 'lucide-react';
import { AssistantKnowledgeItem, SaveKnowledgeInput } from '@/src/client/domain/assistant-knowledge/entity/knowledge_item';
import { useKnowledgeEditModal } from '../hook/useKnowledgeEditModal';
import { ASSISTANT_TEXT, ASSISTANT_SEMANTIC_ID } from '../constant';
import { MarkdownReader } from './MarkdownReader';

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
  const {
    title,
    setTitle,
    category,
    setCategory,
    summary,
    setSummary,
    content,
    setContent,
    format,
    setFormat,
    activeTab,
    setActiveTab,
    isSubmitting,
    error,
    textareaRef,
    handleSubmit,
    tools,
  } = useKnowledgeEditModal({
    isOpen,
    item,
    defaultCategory,
    onSave,
    onClose,
  });

  return (
    <Dialog.Root open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs z-50 animate-in fade-in duration-200" />
        <Dialog.Content
          id={ASSISTANT_SEMANTIC_ID.KNOWLEDGE_EDIT_MODAL}
          className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-3xl max-h-[92vh] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl z-50 flex flex-col overflow-hidden animate-in zoom-in-95 duration-200"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-5 border-b border-slate-200 dark:border-slate-800 shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-600 dark:text-purple-400">
                {category === 'skill' ? <Sparkles className="w-5 h-5" /> : <BookOpen className="w-5 h-5" />}
              </div>
              <div>
                <Dialog.Title className="text-base font-bold text-slate-900 dark:text-slate-100">
                  {item
                    ? ASSISTANT_TEXT.CONVERTERS.KNOWLEDGE_EDIT_MODAL_TITLE_EDIT
                    : ASSISTANT_TEXT.CONVERTERS.KNOWLEDGE_EDIT_MODAL_TITLE_CREATE}
                </Dialog.Title>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {category === 'skill'
                    ? ASSISTANT_TEXT.CONVERTERS.KNOWLEDGE_EDIT_MODAL_DESC_SKILL
                    : ASSISTANT_TEXT.CONVERTERS.KNOWLEDGE_EDIT_MODAL_DESC_PRODUCT}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              id={ASSISTANT_SEMANTIC_ID.KNOWLEDGE_EDIT_CANCEL_BTN}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Form Body */}
          <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 space-y-4 text-xs">
            {error && (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400">
                {error}
              </div>
            )}

            {/* Category and Format Selectors */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Kategori
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setCategory('product')}
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
                    onClick={() => setCategory('skill')}
                    className={`flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl border font-semibold transition-all cursor-pointer ${
                      category === 'skill'
                        ? 'bg-indigo-500/15 border-indigo-500/40 text-indigo-600 dark:text-indigo-300'
                        : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50'
                    }`}
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>{ASSISTANT_TEXT.CONVERTERS.KNOWLEDGE_TAB_SKILL}</span>
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
                    className={`py-2 px-3 rounded-xl border font-semibold transition-all text-center cursor-pointer ${
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
                    className={`py-2 px-3 rounded-xl border font-semibold transition-all text-center cursor-pointer ${
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

            {/* Title Input */}
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Judul Modul / Skill <span className="text-rose-500">*</span>
              </label>
              <input
                id={ASSISTANT_SEMANTIC_ID.KNOWLEDGE_EDIT_TITLE_INPUT}
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Contoh: 09. Advanced GraphQL Simulation"
                className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-purple-500/30"
              />
            </div>

            {/* Summary Input */}
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Ringkasan / Summary
              </label>
              <input
                id={ASSISTANT_SEMANTIC_ID.KNOWLEDGE_EDIT_SUMMARY_INPUT}
                type="text"
                value={summary}
                onChange={(e) => setSummary(e.target.value)}
                placeholder="Deskripsi singkat modul untuk indexing dan pencarian AI..."
                className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-purple-500/30"
              />
            </div>

            {/* Markdown Editor with Toolbar & Tab Switcher */}
            <div className="space-y-2 pt-1">
              {/* Header Editor: Label & Mode Tabs */}
              <div className="flex items-center justify-between">
                <span className="font-semibold text-slate-700 dark:text-slate-300">
                  Konten ({format.toUpperCase()}) <span className="text-rose-500">*</span>
                </span>

                <div className="flex items-center gap-1 p-0.5 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold">
                  <button
                    type="button"
                    id={ASSISTANT_SEMANTIC_ID.KNOWLEDGE_EDIT_TAB_WRITE}
                    onClick={() => setActiveTab('write')}
                    className={`flex items-center gap-1.5 px-3 py-1 rounded-lg transition-all cursor-pointer ${
                      activeTab === 'write'
                        ? 'bg-white dark:bg-slate-900 text-purple-600 dark:text-purple-400 shadow-xs'
                        : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-200'
                    }`}
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                    <span>{ASSISTANT_TEXT.CONVERTERS.KNOWLEDGE_TAB_WRITE}</span>
                  </button>

                  <button
                    type="button"
                    id={ASSISTANT_SEMANTIC_ID.KNOWLEDGE_EDIT_TAB_PREVIEW}
                    onClick={() => setActiveTab('preview')}
                    className={`flex items-center gap-1.5 px-3 py-1 rounded-lg transition-all cursor-pointer ${
                      activeTab === 'preview'
                        ? 'bg-white dark:bg-slate-900 text-purple-600 dark:text-purple-400 shadow-xs'
                        : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-200'
                    }`}
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>{ASSISTANT_TEXT.CONVERTERS.KNOWLEDGE_TAB_PREVIEW}</span>
                  </button>
                </div>
              </div>

              {/* Editor Write Mode */}
              {activeTab === 'write' && (
                <div className="rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden bg-slate-50/50 dark:bg-slate-900/50 focus-within:ring-2 focus-within:ring-purple-500/30">
                  {/* Toolbar */}
                  <div className="flex flex-wrap items-center gap-1 p-2 bg-slate-100/80 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-800 select-none">
                    <button
                      type="button"
                      onClick={tools.applyBold}
                      title="Tebal / Bold (**teks**)"
                      className="p-1.5 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition-colors cursor-pointer"
                    >
                      <Bold className="w-3.5 h-3.5" />
                    </button>

                    <button
                      type="button"
                      onClick={tools.applyItalic}
                      title="Miring / Italic (*teks*)"
                      className="p-1.5 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition-colors cursor-pointer"
                    >
                      <Italic className="w-3.5 h-3.5" />
                    </button>

                    <button
                      type="button"
                      onClick={tools.applyUnderline}
                      title="Garis Bawah / Underline (<u>teks</u>)"
                      className="p-1.5 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition-colors cursor-pointer"
                    >
                      <Underline className="w-3.5 h-3.5" />
                    </button>

                    <button
                      type="button"
                      onClick={tools.applyStrikethrough}
                      title="Coret / Strikethrough (~~teks~~)"
                      className="p-1.5 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition-colors cursor-pointer"
                    >
                      <Strikethrough className="w-3.5 h-3.5" />
                    </button>

                    <div className="w-px h-4 bg-slate-300 dark:bg-slate-700 mx-1" />

                    <button
                      type="button"
                      onClick={tools.applyHeading1}
                      title="Heading 1 (# Judul)"
                      className="p-1.5 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition-colors cursor-pointer"
                    >
                      <Heading1 className="w-3.5 h-3.5" />
                    </button>

                    <button
                      type="button"
                      onClick={tools.applyHeading2}
                      title="Heading 2 (## Sub Judul)"
                      className="p-1.5 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition-colors cursor-pointer"
                    >
                      <Heading2 className="w-3.5 h-3.5" />
                    </button>

                    <button
                      type="button"
                      onClick={tools.applyHeading3}
                      title="Heading 3 (### Bagian)"
                      className="p-1.5 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition-colors cursor-pointer"
                    >
                      <Heading3 className="w-3.5 h-3.5" />
                    </button>

                    <div className="w-px h-4 bg-slate-300 dark:bg-slate-700 mx-1" />

                    <button
                      type="button"
                      onClick={tools.applyInlineCode}
                      title="Kode Inline (`kode`)"
                      className="p-1.5 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition-colors cursor-pointer"
                    >
                      <Code className="w-3.5 h-3.5" />
                    </button>

                    <button
                      type="button"
                      onClick={tools.applyCodeBlock}
                      title="Blok Kode (```lang)"
                      className="p-1.5 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition-colors cursor-pointer"
                    >
                      <FileCode className="w-3.5 h-3.5" />
                    </button>

                    <div className="w-px h-4 bg-slate-300 dark:bg-slate-700 mx-1" />

                    <button
                      type="button"
                      onClick={tools.applyBulletList}
                      title="Daftar Poin (- Item)"
                      className="p-1.5 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition-colors cursor-pointer"
                    >
                      <List className="w-3.5 h-3.5" />
                    </button>

                    <button
                      type="button"
                      onClick={tools.applyNumberedList}
                      title="Daftar Nomor (1. Item)"
                      className="p-1.5 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition-colors cursor-pointer"
                    >
                      <ListOrdered className="w-3.5 h-3.5" />
                    </button>

                    <button
                      type="button"
                      onClick={tools.applyBlockquote}
                      title="Kutipan (> Catatan)"
                      className="p-1.5 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition-colors cursor-pointer"
                    >
                      <Quote className="w-3.5 h-3.5" />
                    </button>

                    <button
                      type="button"
                      onClick={tools.applyLink}
                      title="Tautan / Link ([teks](url))"
                      className="p-1.5 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition-colors cursor-pointer"
                    >
                      <Link2 className="w-3.5 h-3.5" />
                    </button>

                    <button
                      type="button"
                      onClick={tools.applyTable}
                      title="Sisipkan Template Tabel Markdown"
                      className="p-1.5 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition-colors cursor-pointer"
                    >
                      <Table className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Textarea */}
                  <textarea
                    ref={textareaRef}
                    id={ASSISTANT_SEMANTIC_ID.KNOWLEDGE_EDIT_CONTENT_INPUT}
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    rows={14}
                    placeholder={
                      format === 'json'
                        ? '{\n  "instruction": "..."\n}'
                        : '# 1. Judul Panduan\n\n- Fitur 1\n- Fitur 2'
                    }
                    className="w-full p-4 bg-transparent text-slate-900 dark:text-slate-100 font-mono text-xs focus:outline-none leading-relaxed resize-y"
                  />
                </div>
              )}

              {/* Preview Mode */}
              {activeTab === 'preview' && (
                <div className="rounded-2xl border border-slate-200 dark:border-slate-800 p-6 min-h-[300px] max-h-[460px] overflow-y-auto bg-slate-50/40 dark:bg-slate-950/40">
                  {content.trim() ? (
                    <MarkdownReader content={content} />
                  ) : (
                    <div className="flex flex-col items-center justify-center p-12 text-slate-400 space-y-2">
                      <Eye className="w-8 h-8 opacity-40" />
                      <p className="text-xs">
                        Ketik konten markdown di tab editor untuk melihat pratinjaunya secara langsung di sini.
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Modal Footer */}
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
                id={ASSISTANT_SEMANTIC_ID.KNOWLEDGE_EDIT_SAVE_BTN}
                disabled={isSubmitting}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-semibold shadow-md shadow-purple-500/20 transition-all disabled:opacity-50 cursor-pointer"
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
