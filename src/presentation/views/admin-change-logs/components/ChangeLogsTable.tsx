'use client';

import React from 'react';
import { RefreshCw, Clock, X, ChevronLeft, ChevronRight } from 'lucide-react';
import { ChangeLogEntry } from '../hook/useAdminChangeLogs';
import { ChangeLogListItem } from './ChangeLogListItem';
import { CHANGE_LOGS_ADMIN_TEXT, CHANGE_LOGS_ADMIN_SEMANTIC_ID } from '../constant';

interface ChangeLogsTableProps {
  changeLogs: ChangeLogEntry[];
  loading: boolean;
  error: string | null;
  totalCount: number;
  page: number;
  totalPages: number;
  onPageChange: (fn: (prev: number) => number) => void;
  onViewDetails: (log: ChangeLogEntry) => void;
}

export const ChangeLogsTable: React.FC<ChangeLogsTableProps> = ({
  changeLogs,
  loading,
  error,
  totalCount,
  page,
  totalPages,
  onPageChange,
  onViewDetails,
}) => {
  return (
    <div
      id={CHANGE_LOGS_ADMIN_SEMANTIC_ID.LOG_LIST}
      className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800/80 rounded-xl shadow-sm overflow-hidden transition-colors"
    >
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 space-y-4">
          <RefreshCw className="w-8 h-8 text-indigo-500 animate-spin" />
          <span className="text-sm font-medium text-slate-500 dark:text-slate-400">
            Loading Change Logs...
          </span>
        </div>
      ) : error ? (
        <div className="flex flex-col items-center justify-center py-16 px-4 text-center space-y-3">
          <span className="text-red-500 bg-red-50 dark:bg-red-500/10 p-3 rounded-full">
            <X className="w-6 h-6" />
          </span>
          <h3 className="font-semibold text-slate-950 dark:text-white text-sm">
            Gagal memuat log riwayat
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-xs">{error}</p>
        </div>
      ) : changeLogs.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 px-4 text-center space-y-3">
          <span className="text-slate-400 bg-slate-100 dark:bg-slate-900 p-3 rounded-full">
            <Clock className="w-6 h-6" />
          </span>
          <h3 className="font-semibold text-slate-950 dark:text-white text-sm">
            {CHANGE_LOGS_ADMIN_TEXT.EMPTY_TITLE}
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-xs">
            {CHANGE_LOGS_ADMIN_TEXT.EMPTY_DESC}
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/30 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                <th className="py-3 px-4.5">{CHANGE_LOGS_ADMIN_TEXT.LABEL_TIMESTAMP}</th>
                <th className="py-3 px-4.5">{CHANGE_LOGS_ADMIN_TEXT.LABEL_OPERATOR}</th>
                <th className="py-3 px-4.5">{CHANGE_LOGS_ADMIN_TEXT.LABEL_ACTION}</th>
                <th className="py-3 px-4.5">{CHANGE_LOGS_ADMIN_TEXT.LABEL_ENTITY_TYPE}</th>
                <th className="py-3 px-4.5">{CHANGE_LOGS_ADMIN_TEXT.LABEL_DESCRIPTION}</th>
                <th className="py-3 px-4.5 text-right">{CHANGE_LOGS_ADMIN_TEXT.DETAILS}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800 text-sm text-slate-700 dark:text-slate-300">
              {changeLogs.map((log) => (
                <ChangeLogListItem
                  key={log.id}
                  log={log}
                  onViewDetails={onViewDetails}
                />
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div
          id={CHANGE_LOGS_ADMIN_SEMANTIC_ID.PAGINATION}
          className="flex items-center justify-between border-t border-slate-200 dark:border-slate-800 px-4.5 py-4 bg-slate-50/50 dark:bg-slate-900/10"
        >
          <span className="text-xs text-slate-500 dark:text-slate-400">
            {CHANGE_LOGS_ADMIN_TEXT.TOTAL_COUNT(totalCount)}
          </span>
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => onPageChange((prev) => Math.max(prev - 1, 1))}
              disabled={page === 1}
              className="p-1.5 border border-slate-200 dark:border-slate-800 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-900 text-slate-600 dark:text-slate-400 disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed"
              title={CHANGE_LOGS_ADMIN_TEXT.PREVIOUS}
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 px-2.5">
              {CHANGE_LOGS_ADMIN_TEXT.PAGE_LABEL(page, totalPages)}
            </span>
            <button
              onClick={() => onPageChange((prev) => Math.min(prev + 1, totalPages))}
              disabled={page === totalPages}
              className="p-1.5 border border-slate-200 dark:border-slate-800 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-900 text-slate-600 dark:text-slate-400 disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed"
              title={CHANGE_LOGS_ADMIN_TEXT.NEXT}
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
