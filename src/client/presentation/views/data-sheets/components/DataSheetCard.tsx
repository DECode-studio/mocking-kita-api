'use client';

import React from 'react';
import { Table2, Edit2, Trash2, FolderGit2, Hash, Layers, Eye } from 'lucide-react';
import { DataSheet } from '@/src/client/domain/data-sheet/entity/data_sheet';
import { DataSheetVariableTagBadge } from './DataSheetVariableTagBadge';
import { DATA_SHEET_SEMANTIC_ID, DATA_SHEET_TEXT } from '../constant';

interface DataSheetCardProps {
  sheet: DataSheet;
  onPreview: (sheet: DataSheet) => void;
  onEdit: (sheet: DataSheet) => void;
  onDelete: (id: string, name: string) => void;
  onToggleStatus: (id: string) => void;
}

export const DataSheetCard: React.FC<DataSheetCardProps> = ({
  sheet,
  onPreview,
  onEdit,
  onDelete,
  onToggleStatus,
}) => {
  const itemCount = Array.isArray(sheet.data) ? sheet.data.length : 0;
  const sampleItems = Array.isArray(sheet.data) ? sheet.data.slice(0, 3) : [];

  return (
    <div
      id={DATA_SHEET_SEMANTIC_ID.CARD_PREFIX(sheet.id)}
      className="group relative bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-purple-300 dark:hover:border-purple-700/60 rounded-xl p-5 shadow-xs hover:shadow-md transition-all space-y-4"
    >
      {/* Top Header: Title, Category, Status Switch */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3 min-w-0">
          <div className="w-10 h-10 rounded-xl bg-purple-50 dark:bg-purple-950/50 border border-purple-100 dark:border-purple-800/60 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0">
            <Table2 className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 truncate">
                {sheet.name}
              </h3>
              {sheet.category && (
                <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                  {sheet.category}
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-1 mt-0.5">
              {sheet.description || DATA_SHEET_TEXT.NO_DESCRIPTION}
            </p>
          </div>
        </div>

        {/* Status Toggle & Actions */}
        <div className="flex items-center gap-1.5 shrink-0">
          <button
            id={DATA_SHEET_SEMANTIC_ID.CARD_TOGGLE_PREFIX(sheet.id)}
            type="button"
            onClick={() => onToggleStatus(sheet.id)}
            className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border transition-colors cursor-pointer ${
              sheet.status
                ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800'
                : 'bg-slate-100 text-slate-500 border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700'
            }`}
          >
            {sheet.status ? DATA_SHEET_TEXT.STATUS_ACTIVE : DATA_SHEET_TEXT.STATUS_INACTIVE}
          </button>
          <button
            id={DATA_SHEET_SEMANTIC_ID.CARD_PREVIEW_BTN_PREFIX(sheet.id)}
            type="button"
            onClick={() => onPreview(sheet)}
            className="p-1.5 text-slate-400 hover:text-purple-600 dark:hover:text-purple-400 rounded-lg hover:bg-purple-50 dark:hover:bg-purple-950/40 transition-colors cursor-pointer"
            title={DATA_SHEET_TEXT.INSPECT_TOOLTIP}
          >
            <Eye className="w-3.5 h-3.5" />
          </button>
          <button
            id={DATA_SHEET_SEMANTIC_ID.CARD_EDIT_BTN_PREFIX(sheet.id)}
            type="button"
            onClick={() => onEdit(sheet)}
            className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            title={DATA_SHEET_TEXT.EDIT_TOOLTIP}
          >
            <Edit2 className="w-3.5 h-3.5" />
          </button>
          <button
            id={DATA_SHEET_SEMANTIC_ID.CARD_DELETE_BTN_PREFIX(sheet.id)}
            type="button"
            onClick={() => onDelete(sheet.id, sheet.name)}
            className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
            title={DATA_SHEET_TEXT.DELETE_TOOLTIP}
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Meta Bar: Project & Code */}
      <div className="flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400 flex-wrap">
        <div className="flex items-center gap-1">
          <FolderGit2 className="w-3.5 h-3.5 text-slate-400" />
          <span>{sheet.project?.name || DATA_SHEET_TEXT.GLOBAL_SHEET}</span>
        </div>
        <div className="flex items-center gap-1">
          <Hash className="w-3.5 h-3.5 text-slate-400" />
          <span className="font-mono">{sheet.code}</span>
        </div>
        <div className="flex items-center gap-1">
          <Layers className="w-3.5 h-3.5 text-slate-400" />
          <span>
            {DATA_SHEET_TEXT.ITEMS_COUNT(itemCount)} ({sheet.format})
          </span>
        </div>
      </div>

      {/* Sample Items Preview */}
      <div
        onClick={() => onPreview(sheet)}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') onPreview(sheet);
        }}
        className="bg-slate-50 dark:bg-slate-950/60 hover:bg-purple-50/40 dark:hover:bg-purple-950/20 rounded-lg p-2.5 border border-slate-100 dark:border-slate-800/80 hover:border-purple-200 dark:hover:border-purple-800/60 space-y-1.5 cursor-pointer transition-all group/preview"
      >
        <div className="flex items-center justify-between text-[11px] text-slate-400 font-medium">
          <span className="group-hover/preview:text-purple-600 dark:group-hover/preview:text-purple-400 transition-colors flex items-center gap-1">
            <Eye className="w-3 h-3" /> {DATA_SHEET_TEXT.DATA_PREVIEW}
          </span>
          <span>{DATA_SHEET_TEXT.ITEMS_STORED(itemCount)}</span>
        </div>
        <div className="flex flex-wrap gap-1.5 max-h-16 overflow-hidden">
          {itemCount === 0 ? (
            <span className="text-xs text-slate-400 italic">{DATA_SHEET_TEXT.EMPTY_DATASET}</span>
          ) : (
            sampleItems.map((item, idx) => (
              <span
                key={idx}
                className="inline-flex items-center text-[11px] font-mono bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-2 py-0.5 rounded text-slate-700 dark:text-slate-300 max-w-50 truncate"
              >
                {typeof item === 'object' ? JSON.stringify(item) : String(item)}
              </span>
            ))
          )}
          {itemCount > 3 && (
            <span className="text-[11px] text-purple-600 dark:text-purple-400 font-medium self-center px-1">
              {DATA_SHEET_TEXT.MORE_ITEMS_CLICK(itemCount - 3)}
            </span>
          )}
        </div>
      </div>

      {/* Bottom: Quick Copy Variable Tags */}
      <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2">
        <span className="text-[11px] font-medium text-slate-400">{DATA_SHEET_TEXT.TOKENS_LABEL}</span>
        <div className="flex items-center gap-1.5 flex-wrap">
          <DataSheetVariableTagBadge code={sheet.code} mode="asc" />
          <DataSheetVariableTagBadge code={sheet.code} mode="desc" />
          <DataSheetVariableTagBadge code={sheet.code} mode="random" />
          <DataSheetVariableTagBadge code={sheet.code} mode="index" index={0} />
        </div>
      </div>
    </div>
  );
};
