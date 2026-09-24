'use client';

import React, { useState } from 'react';
import {
  Table2,
  Plus,
  Search,
  FolderGit2,
  Filter,
  Loader2,
  Layers,
} from 'lucide-react';
import { DataSheet } from '@/src/client/domain/data-sheet/entity/data_sheet';
import { useDataSheets } from './hook/useDataSheets';
import { DataSheetCard, DataSheetModal, DataSheetPreviewModal } from './components';
import { DATA_SHEET_TEXT, DATA_SHEET_CATEGORIES, DATA_SHEET_SEMANTIC_ID } from './constant';

interface DataSheetsListViewProps {
  projectId?: string;
}

export const DataSheetsListView: React.FC<DataSheetsListViewProps> = ({ projectId }) => {
  const [previewingSheet, setPreviewingSheet] = useState<DataSheet | null>(null);

  const {
    dataSheets,
    projects,
    isLoading,
    searchQuery,
    setSearchQuery,
    filterProjectId,
    setFilterProjectId,
    filterCategory,
    setFilterCategory,
    isModalOpen,
    setIsModalOpen,
    editingSheet,
    openCreateModal,
    openEditModal,
    handleCreateOrUpdate,
    handleDelete,
    handleToggleStatus,
  } = useDataSheets(projectId);

  return (
    <div id={DATA_SHEET_SEMANTIC_ID.CONTAINER} className="w-full space-y-6 pb-12">
      {/* 1. Header Bar */}
      <div id={DATA_SHEET_SEMANTIC_ID.HEADER} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-xs">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-xl bg-purple-50 dark:bg-purple-950/50 border border-purple-200 dark:border-purple-800/60 text-purple-600 dark:text-purple-400 flex items-center justify-center shadow-xs">
            <Table2 className="w-6 h-6" />
          </div>
          <div>
            <h1 id={DATA_SHEET_SEMANTIC_ID.TITLE} className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
              {DATA_SHEET_TEXT.TITLE}
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300">
                {dataSheets.length}
              </span>
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-2xl">
              {DATA_SHEET_TEXT.SUBTITLE}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            id={DATA_SHEET_SEMANTIC_ID.CREATE_BTN}
            type="button"
            onClick={openCreateModal}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-semibold shadow-xs hover:shadow transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>{DATA_SHEET_TEXT.CREATE_BUTTON}</span>
          </button>
        </div>
      </div>

      {/* 2. Search and Filters */}
      <div className="flex flex-col md:flex-row items-center gap-3">
        {/* Search */}
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            id={DATA_SHEET_SEMANTIC_ID.SEARCH_INPUT}
            type="text"
            placeholder={DATA_SHEET_TEXT.SEARCH_PLACEHOLDER}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full text-xs pl-10 pr-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500 shadow-xs"
          />
        </div>

        {/* Project Filter (if not locked to a specific project) */}
        {!projectId && (
          <div className="w-full md:w-56 shrink-0 relative">
            <FolderGit2 className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <select
              id={DATA_SHEET_SEMANTIC_ID.PROJECT_FILTER}
              value={filterProjectId}
              onChange={(e) => setFilterProjectId(e.target.value)}
              className="w-full text-xs pl-9 pr-8 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-purple-500 shadow-xs appearance-none cursor-pointer"
            >
              <option value="ALL">{DATA_SHEET_TEXT.ALL_PROJECTS}</option>
              <option value="GLOBAL">{DATA_SHEET_TEXT.GLOBAL_SHEET}</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Category Filter */}
        <div className="w-full md:w-48 shrink-0 relative">
          <Filter className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <select
            id={DATA_SHEET_SEMANTIC_ID.CATEGORY_FILTER}
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="w-full text-xs pl-9 pr-8 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-purple-500 shadow-xs appearance-none cursor-pointer"
          >
            <option value="ALL">{DATA_SHEET_TEXT.ALL_CATEGORIES}</option>
            {DATA_SHEET_CATEGORIES.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* 3. Content Grid or Loading/Empty State */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center min-h-[40vh] gap-3">
          <Loader2 className="w-8 h-8 text-purple-600 animate-spin" />
          <p className="text-xs text-slate-500 font-medium">{DATA_SHEET_TEXT.LOADING_DATA_SHEETS}</p>
        </div>
      ) : dataSheets.length === 0 ? (
        <div id={DATA_SHEET_SEMANTIC_ID.EMPTY_STATE} className="flex flex-col items-center justify-center py-16 px-4 bg-white dark:bg-slate-900 border border-dashed border-slate-300 dark:border-slate-800 rounded-2xl text-center space-y-4 shadow-xs">
          <div className="w-14 h-14 rounded-2xl bg-purple-50 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400 flex items-center justify-center">
            <Layers className="w-7 h-7" />
          </div>
          <div className="max-w-sm space-y-1">
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
              {DATA_SHEET_TEXT.EMPTY_STATE_TITLE}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              {DATA_SHEET_TEXT.EMPTY_STATE_SUBTITLE}
            </p>
          </div>
          <button
            id={DATA_SHEET_SEMANTIC_ID.EMPTY_STATE_CREATE_BTN}
            type="button"
            onClick={openCreateModal}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>{DATA_SHEET_TEXT.EMPTY_STATE_CREATE_BTN}</span>
          </button>
        </div>
      ) : (
        <div id={DATA_SHEET_SEMANTIC_ID.GRID} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {dataSheets.map((sheet) => (
            <DataSheetCard
              key={sheet.id}
              sheet={sheet}
              onPreview={setPreviewingSheet}
              onEdit={openEditModal}
              onDelete={handleDelete}
              onToggleStatus={handleToggleStatus}
            />
          ))}
        </div>
      )}

      {/* 4. Create / Edit Modal */}
      <DataSheetModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        editingSheet={editingSheet}
        projects={projects}
        defaultProjectId={projectId || (filterProjectId !== 'ALL' ? filterProjectId : undefined)}
        onSave={handleCreateOrUpdate}
      />

      {/* 5. Preview Modal */}
      <DataSheetPreviewModal
        isOpen={!!previewingSheet}
        sheet={previewingSheet}
        onClose={() => setPreviewingSheet(null)}
        onEdit={openEditModal}
      />
    </div>
  );
};
