'use client';

import React from 'react';
import { Clock, X } from 'lucide-react';
import { formatDate } from '@/src/core/utils/date';
import { ChangeLogEntry } from '../useAdminChangeLogs';
import { ChangeLogActionBadge } from './ChangeLogActionBadge';
import { CHANGE_LOGS_ADMIN_TEXT, CHANGE_LOGS_ADMIN_SEMANTIC_ID } from '../constant';

interface ChangeLogDetailModalProps {
  log: ChangeLogEntry | null;
  onClose: () => void;
}

export const ChangeLogDetailModal: React.FC<ChangeLogDetailModalProps> = ({
  log,
  onClose,
}) => {
  if (!log) return null;

  const parseJSON = (str: string | null) => {
    if (!str) return null;
    try {
      return JSON.parse(str);
    } catch {
      return str;
    }
  };

  return (
    <div
      id={CHANGE_LOGS_ADMIN_SEMANTIC_ID.DETAIL_MODAL}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm transition-opacity"
    >
      <div className="relative w-full max-w-4xl bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800/90 shadow-2xl flex flex-col max-h-[85vh] overflow-hidden">
        {/* Modal Header */}
        <div className="flex justify-between items-center px-6 py-4.5 border-b border-slate-200 dark:border-slate-800">
          <div>
            <h3 className="text-lg font-bold text-slate-950 dark:text-white flex items-center gap-2">
              <Clock className="w-5 h-5 text-indigo-500" />
              {CHANGE_LOGS_ADMIN_TEXT.MODAL_TITLE}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              ID: <span className="font-mono text-[10px] select-all">{log.id}</span>
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Log Meta Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 bg-slate-50 dark:bg-slate-950/40 p-4 rounded-xl border border-slate-200/50 dark:border-slate-800/50">
            <div>
              <span className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">
                {CHANGE_LOGS_ADMIN_TEXT.LABEL_TIMESTAMP}
              </span>
              <p className="text-xs font-semibold text-slate-900 dark:text-white mt-0.5">
                {formatDate(log.created_at)}
              </p>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">
                {CHANGE_LOGS_ADMIN_TEXT.LABEL_OPERATOR}
              </span>
              <p className="text-xs font-semibold text-slate-900 dark:text-white mt-0.5">
                {log.operator}
              </p>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">
                {CHANGE_LOGS_ADMIN_TEXT.LABEL_ACTION}
              </span>
              <div className="mt-0.5">
                <ChangeLogActionBadge action={log.action} />
              </div>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">
                {CHANGE_LOGS_ADMIN_TEXT.LABEL_ENTITY_TYPE}
              </span>
              <p className="text-xs font-semibold text-slate-900 dark:text-white mt-0.5 capitalize">
                {log.entity_type.replace('_', ' ')}
              </p>
            </div>
          </div>

          <div>
            <span className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">
              {CHANGE_LOGS_ADMIN_TEXT.LABEL_DESCRIPTION}
            </span>
            <p className="text-sm font-semibold text-slate-950 dark:text-white mt-1 border-l-3 border-indigo-500 pl-3 py-0.5">
              {log.description}
            </p>
          </div>

          {/* State snapshots view */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Before State */}
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                  {CHANGE_LOGS_ADMIN_TEXT.LABEL_BEFORE_STATE}
                </span>
                {!log.before_state && (
                  <span className="text-[10px] font-medium text-slate-400">N/A</span>
                )}
              </div>
              <div className="bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-200/80 dark:border-slate-900 overflow-hidden">
                <pre className="p-4 overflow-auto font-mono text-xs max-h-80 text-slate-700 dark:text-slate-300 leading-relaxed select-all">
                  {log.before_state
                    ? JSON.stringify(parseJSON(log.before_state), null, 2)
                    : '// NULL'}
                </pre>
              </div>
            </div>

            {/* After State */}
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                  {CHANGE_LOGS_ADMIN_TEXT.LABEL_AFTER_STATE}
                </span>
                {!log.after_state && (
                  <span className="text-[10px] font-medium text-slate-400">N/A</span>
                )}
              </div>
              <div className="bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-200/80 dark:border-slate-900 overflow-hidden">
                <pre className="p-4 overflow-auto font-mono text-xs max-h-80 text-slate-700 dark:text-slate-300 leading-relaxed select-all">
                  {log.after_state
                    ? JSON.stringify(parseJSON(log.after_state), null, 2)
                    : '// NULL'}
                </pre>
              </div>
            </div>
          </div>

          {/* Metadata if present */}
          {log.metadata && (
            <div className="space-y-2">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                {CHANGE_LOGS_ADMIN_TEXT.LABEL_METADATA}
              </span>
              <div className="bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-200/80 dark:border-slate-900 p-4">
                <pre className="font-mono text-xs text-slate-700 dark:text-slate-300">
                  {JSON.stringify(parseJSON(log.metadata), null, 2)}
                </pre>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="flex justify-end gap-3 px-6 py-4 bg-slate-50 dark:bg-slate-900/60 border-t border-slate-200 dark:border-slate-800 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-200/50 dark:hover:bg-slate-800 rounded-lg cursor-pointer transition"
          >
            {CHANGE_LOGS_ADMIN_TEXT.CLOSE_BTN}
          </button>
        </div>
      </div>
    </div>
  );
};
