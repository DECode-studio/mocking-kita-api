'use client';

import React from 'react';
import {
  BookOpen,
  Search,
  ChevronRight,
  Sparkles,
  Plus,
  UploadCloud,
  FileArchive,
  Download,
  Edit3,
  Trash2,
  FileText,
  FolderArchive,
  Loader2,
} from 'lucide-react';
import { useKnowledgeBaseExplorer } from '../hook/useKnowledgeBaseExplorer';
import { ASSISTANT_TEXT, ASSISTANT_SEMANTIC_ID } from '../constant';
import { KnowledgeEditModal } from './KnowledgeEditModal';
import { KnowledgeImportModal } from './KnowledgeImportModal';
import { MarkdownReader } from './MarkdownReader';

export const KnowledgeBaseExplorer: React.FC = () => {
  const {
    items,
    loading,
    searchQuery,
    setSearchQuery,
    activeCategory,
    setActiveCategory,
    selectedSection,
    setSelectedSection,
    filteredSections,
    // Modals
    isEditModalOpen,
    setIsEditModalOpen,
    itemToEdit,
    openCreateModal,
    openEditModal,
    handleSaveItem,
    handleDeleteItem,
    // Import / Export
    isImportModalOpen,
    setIsImportModalOpen,
    handleImportFile,
    handleExportSingle,
    handleExportAllSkillsZip,
    // AI Chat
    askAboutSection,
  } = useKnowledgeBaseExplorer();

  return (
    <div id={ASSISTANT_SEMANTIC_ID.KNOWLEDGE_CONTAINER} className="space-y-4">
      {/* Top Banner & Main Actions */}
      <div className="p-5 rounded-2xl bg-linear-to-r from-purple-900/20 via-indigo-900/20 to-slate-900/40 border border-purple-500/20 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-purple-400" />
            <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <span>{ASSISTANT_TEXT.CONVERTERS.KNOWLEDGE_TITLE}</span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-purple-500/15 text-purple-600 dark:text-purple-300 border border-purple-500/20">
                Router AI
              </span>
            </h3>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Tersinkronisasi langsung dengan Router AI Gateway (Project: <code className="font-mono text-purple-600 dark:text-purple-400">mock-api-studio</code>) dengan Vector RAG & Project Skills.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          {/* Action Buttons */}
          <button
            type="button"
            id={ASSISTANT_SEMANTIC_ID.KNOWLEDGE_CREATE_BTN}
            onClick={openCreateModal}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold shadow-xs transition-all cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>{ASSISTANT_TEXT.CONVERTERS.KNOWLEDGE_ADD_NEW}</span>
          </button>

          <button
            type="button"
            id={ASSISTANT_SEMANTIC_ID.KNOWLEDGE_IMPORT_BTN}
            onClick={() => setIsImportModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-purple-400 text-slate-700 dark:text-slate-200 text-xs font-semibold shadow-xs transition-all cursor-pointer"
          >
            <UploadCloud className="w-3.5 h-3.5 text-purple-500" />
            <span>{ASSISTANT_TEXT.CONVERTERS.KNOWLEDGE_IMPORT}</span>
          </button>

          <button
            type="button"
            id={ASSISTANT_SEMANTIC_ID.KNOWLEDGE_EXPORT_ALL_ZIP_BTN}
            onClick={handleExportAllSkillsZip}
            title="Download seluruh Skills dalam satu arsip ZIP"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-xs transition-all cursor-pointer"
          >
            <FileArchive className="w-3.5 h-3.5" />
            <span>{ASSISTANT_TEXT.CONVERTERS.KNOWLEDGE_EXPORT_SKILLS_ZIP}</span>
          </button>
        </div>
      </div>

      {/* Filter Tabs & Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pb-1">
        {/* Category Tabs */}
        <div className="flex items-center gap-1.5 p-1 rounded-2xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-semibold w-full sm:w-auto">
          <button
            type="button"
            id={ASSISTANT_SEMANTIC_ID.KNOWLEDGE_TAB_ALL}
            onClick={() => setActiveCategory('all')}
            className={`px-3 py-1 rounded-xl transition-all cursor-pointer ${
              activeCategory === 'all'
                ? 'bg-white dark:bg-slate-800 text-purple-600 dark:text-purple-400 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
            }`}
          >
            {ASSISTANT_TEXT.CONVERTERS.KNOWLEDGE_TAB_ALL} ({items.length})
          </button>

          <button
            type="button"
            id={ASSISTANT_SEMANTIC_ID.KNOWLEDGE_TAB_PRODUCT}
            onClick={() => setActiveCategory('product')}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-xl transition-all cursor-pointer ${
              activeCategory === 'product'
                ? 'bg-white dark:bg-slate-800 text-purple-600 dark:text-purple-400 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>{ASSISTANT_TEXT.CONVERTERS.KNOWLEDGE_TAB_PRODUCT} ({items.filter((i) => i.category === 'product').length})</span>
          </button>

          <button
            type="button"
            id={ASSISTANT_SEMANTIC_ID.KNOWLEDGE_TAB_SKILL}
            onClick={() => setActiveCategory('skill')}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-xl transition-all cursor-pointer ${
              activeCategory === 'skill'
                ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>{ASSISTANT_TEXT.CONVERTERS.KNOWLEDGE_TAB_SKILL} ({items.filter((i) => i.category === 'skill').length})</span>
          </button>
        </div>

        {/* Search Input */}
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            id={ASSISTANT_SEMANTIC_ID.KNOWLEDGE_SEARCH_INPUT}
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={ASSISTANT_TEXT.CONVERTERS.KNOWLEDGE_SEARCH_PLACEHOLDER}
            className="w-full pl-9 pr-3 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white/80 dark:bg-slate-900/80 text-xs focus:outline-none focus:ring-2 focus:ring-purple-500/30"
          />
        </div>
      </div>

      {/* Main Grid Content */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Items List */}
        <div className="lg:col-span-4 space-y-2 max-h-150 overflow-y-auto pr-1">
          {loading ? (
            <div className="flex flex-col items-center justify-center p-12 text-slate-400 gap-2">
              <Loader2 className="w-6 h-6 animate-spin text-purple-500" />
              <span className="text-xs">Memuat data...</span>
            </div>
          ) : filteredSections.length === 0 ? (
            <div className="p-8 text-center rounded-2xl border border-dashed border-slate-300 dark:border-slate-800 text-slate-400 space-y-2">
              <p className="text-xs font-semibold">Tidak ada modul ditemukan</p>
              <button
                type="button"
                onClick={openCreateModal}
                className="text-xs text-purple-500 hover:underline"
              >
                + Tambah item baru
              </button>
            </div>
          ) : (
            filteredSections.map((sec) => {
              const isSelected = selectedSection?.id === sec.id && selectedSection?.category === sec.category;
              return (
                <button
                  key={`${sec.category}-${sec.id}`}
                  type="button"
                  onClick={() => setSelectedSection(sec)}
                  className={`w-full text-left p-3.5 rounded-2xl border transition-all flex items-start justify-between gap-2 ${
                    isSelected
                      ? 'bg-purple-500/15 border-purple-500/40 text-purple-900 dark:text-purple-100 shadow-xs'
                      : 'bg-white dark:bg-slate-900/60 border-slate-200 dark:border-slate-800/80 hover:border-slate-300 dark:hover:border-slate-700 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5 mb-1">
                      <span
                        className={`text-[10px] px-2 py-0.2 rounded-full font-semibold uppercase ${
                          sec.category === 'product'
                            ? 'bg-purple-500/20 text-purple-600 dark:text-purple-300'
                            : 'bg-indigo-500/20 text-indigo-600 dark:text-indigo-300'
                        }`}
                      >
                        {sec.category}
                      </span>
                      {sec.isFolder ? (
                        <span className="text-[10px] px-1.5 py-0.2 rounded bg-amber-500/15 text-amber-600 dark:text-amber-400 font-mono">
                          folder
                        </span>
                      ) : (
                        <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-mono">
                          .{sec.format}
                        </span>
                      )}
                    </div>
                    <h4 className="text-xs font-bold truncate">{sec.title}</h4>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-2 mt-1">
                      {sec.summary}
                    </p>
                  </div>
                  <ChevronRight
                    className={`w-4 h-4 shrink-0 mt-1 text-slate-400 ${
                      isSelected ? 'text-purple-500' : ''
                    }`}
                  />
                </button>
              );
            })
          )}
        </div>

        {/* Right: Selected Item Detail */}
        <div className="lg:col-span-8 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xl shadow-slate-950/5 space-y-4 max-h-150 overflow-y-auto">
          {selectedSection ? (
            <>
              {/* Detail Header & Action Toolbar */}
              <div className="flex flex-col sm:flex-row items-start justify-between pb-4 border-b border-slate-200 dark:border-slate-800 gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] px-2 py-0.5 rounded-full font-semibold uppercase bg-purple-500/15 text-purple-600 dark:text-purple-300">
                      {selectedSection.category} {ASSISTANT_TEXT.CONVERTERS.KNOWLEDGE_MODULE_SUFFIX}
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono">
                      ID: {selectedSection.id}
                    </span>
                  </div>
                  <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 mt-1.5">
                    {selectedSection.title}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    {selectedSection.summary}
                  </p>
                  {selectedSection.keywords && selectedSection.keywords.length > 0 && (
                    <div className="flex flex-wrap items-center gap-1 mt-2">
                      <span className="text-[10px] font-semibold text-slate-400">Triggers:</span>
                      {selectedSection.keywords.map((kw, i) => (
                        <span
                          key={i}
                          className="px-2 py-0.5 rounded-md text-[10px] font-mono bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20"
                        >
                          {kw}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Toolbar for selected item */}
                <div className="flex flex-wrap items-center gap-1.5 shrink-0">
                  <button
                    id={ASSISTANT_SEMANTIC_ID.KNOWLEDGE_ASK_AI_BTN}
                    type="button"
                    onClick={() => askAboutSection(selectedSection)}
                    title="Tanyakan isi panduan ini ke Mocking AI Assistant"
                    className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-linear-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs font-semibold shadow-md shadow-purple-500/20 transition-all shrink-0 cursor-pointer"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>{ASSISTANT_TEXT.CONVERTERS.KNOWLEDGE_ASK_AI_BTN}</span>
                  </button>

                  <button
                    type="button"
                    id={ASSISTANT_SEMANTIC_ID.KNOWLEDGE_EDIT_BTN}
                    onClick={() => openEditModal(selectedSection)}
                    title="Edit konten dan metadata modul ini"
                    className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-semibold transition-all cursor-pointer"
                  >
                    <Edit3 className="w-3.5 h-3.5 text-purple-500" />
                    <span>{ASSISTANT_TEXT.CONVERTERS.KNOWLEDGE_EDIT}</span>
                  </button>

                  {/* Export raw button */}
                  <button
                    type="button"
                    id={ASSISTANT_SEMANTIC_ID.KNOWLEDGE_EXPORT_RAW_BTN}
                    onClick={() => handleExportSingle(selectedSection, false)}
                    title={`Export sebagai .${selectedSection.format}`}
                    className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-semibold transition-all cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5 text-slate-500" />
                    <span>.{selectedSection.format}</span>
                  </button>

                  {/* Export ZIP button (skills only) */}
                  {selectedSection.category === 'skill' && (
                    <button
                      type="button"
                      id={ASSISTANT_SEMANTIC_ID.KNOWLEDGE_EXPORT_ZIP_BTN}
                      onClick={() => handleExportSingle(selectedSection, true)}
                      title="Export skill ini sebagai .ZIP"
                      className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-indigo-500/10 border border-indigo-500/20 hover:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 text-xs font-semibold transition-all cursor-pointer"
                    >
                      <FolderArchive className="w-3.5 h-3.5" />
                      <span>.ZIP</span>
                    </button>
                  )}

                  {/* Delete button */}
                  <button
                    type="button"
                    id={ASSISTANT_SEMANTIC_ID.KNOWLEDGE_DELETE_BTN}
                    onClick={() => handleDeleteItem(selectedSection)}
                    title={ASSISTANT_TEXT.CONVERTERS.KNOWLEDGE_DELETE}
                    className="p-1.5 rounded-xl border border-rose-200 dark:border-rose-900/50 hover:bg-rose-500/10 text-rose-500 transition-all cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Detail Content Body */}
              <div className="pt-2">
                <MarkdownReader content={selectedSection.content} />
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center justify-center p-12 text-slate-400 space-y-2">
              <BookOpen className="w-8 h-8 opacity-40" />
              <p className="text-xs">{ASSISTANT_TEXT.CONVERTERS.KNOWLEDGE_SELECT_PROMPT}</p>
            </div>
          )}
        </div>
      </div>

      {/* Edit / Create Modal */}
      <KnowledgeEditModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        item={itemToEdit}
        defaultCategory={activeCategory === 'skill' ? 'skill' : 'product'}
        onSave={handleSaveItem}
      />

      {/* Import Modal */}
      <KnowledgeImportModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        defaultCategory={activeCategory === 'skill' ? 'skill' : 'product'}
        onImport={handleImportFile}
      />
    </div>
  );
};

export const KnowledgeBaseExplorerView = KnowledgeBaseExplorer;
