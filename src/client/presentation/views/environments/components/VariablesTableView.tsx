'use client';

import React, { useState } from 'react';
import {
  KeyRound,
  Lock,
  FileText,
  FolderGit2,
  Copy,
  Check,
  Edit2,
  Globe,
} from 'lucide-react';
import { Environment } from '@/src/client/domain/environment/entity/environment';
import { useUIStore } from '@/src/client/presentation/stores/uiStore';
import { EmptyState } from '@/src/client/presentation/components/shared/EmptyState';
import { ENVIRONMENTS_TEXT, ENVIRONMENTS_SEMANTIC_ID } from '../constant';

export interface FlattenedVariableItem {
  id: string;
  key: string;
  type: 'plain' | 'secret';
  enabled?: boolean;
  description?: string;
  envId: string;
  envName: string;
  envIsBaseUrl: boolean;
  projectId: string;
  projectName: string;
  environment: Environment;
}

interface VariablesTableViewProps {
  variables: FlattenedVariableItem[];
  onEditEnvironment: (env: Environment) => void;
  onCreateClick: () => void;
}

export const VariablesTableView: React.FC<VariablesTableViewProps> = ({
  variables,
  onEditEnvironment,
  onCreateClick,
}) => {
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const addToast = useUIStore((state) => state.addToast);

  const handleCopyKey = (key: string) => {
    const formatted = `{{${key}}}`;
    navigator.clipboard.writeText(formatted);
    setCopiedKey(key);
    addToast({
      title: `${formatted} ${ENVIRONMENTS_TEXT.CARD_COPIED}`,
      type: 'success',
    });
    setTimeout(() => setCopiedKey(null), 2000);
  };

  if (variables.length === 0) {
    return (
      <div
        id={ENVIRONMENTS_SEMANTIC_ID.EMPTY_STATE}
        className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-12 text-center"
      >
        <EmptyState
          icon={KeyRound}
          title={ENVIRONMENTS_TEXT.NO_VARS_MATCH}
          description={ENVIRONMENTS_TEXT.NO_VARS_MATCH_DESC}
          actionLabel={ENVIRONMENTS_TEXT.CREATE_BUTTON}
          onAction={onCreateClick}
        />
      </div>
    );
  }

  return (
    <div
      id={ENVIRONMENTS_SEMANTIC_ID.VARS_TABLE}
      className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xs overflow-hidden transition-colors"
    >
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-950/40 text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              <th className="py-3.5 px-4.5 min-w-55">{ENVIRONMENTS_TEXT.TABLE.COL_VAR_KEY}</th>
              <th className="py-3.5 px-3 min-w-25">{ENVIRONMENTS_TEXT.TABLE.COL_VAR_TYPE}</th>
              <th className="py-3.5 px-4 min-w-50">{ENVIRONMENTS_TEXT.TABLE.COL_VAR_PARENT_ENV}</th>
              <th className="py-3.5 px-4 min-w-37.5">{ENVIRONMENTS_TEXT.TABLE.COL_PROJECT}</th>
              <th className="py-3.5 px-4 min-w-50">{ENVIRONMENTS_TEXT.TABLE.COL_VAR_DESC}</th>
              <th className="py-3.5 px-4 text-right min-w-25">{ENVIRONMENTS_TEXT.TABLE.COL_ACTIONS}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200/80 dark:divide-slate-800/80 text-sm text-slate-700 dark:text-slate-300">
            {variables.map((item) => {
              const isCopied = copiedKey === item.key;

              return (
                <tr
                  key={`${item.envId}-${item.id}-${item.key}`}
                  id={ENVIRONMENTS_SEMANTIC_ID.VARS_TABLE_ROW(item.envId, item.key)}
                  className="hover:bg-slate-50/70 dark:hover:bg-slate-800/30 transition-colors group"
                >
                  {/* Variable Key */}
                  <td className="py-3.5 px-4.5">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-semibold px-2.5 py-1 rounded-md bg-indigo-50 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800/60 flex items-center gap-1.5">
                        <span className="text-indigo-400 select-none">{'{'}{'{'}</span>
                        <span>{item.key}</span>
                        <span className="text-indigo-400 select-none">{'}'}{'}'}</span>
                      </span>

                      <button
                        type="button"
                        onClick={() => handleCopyKey(item.key)}
                        className="p-1 text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors cursor-pointer"
                        title="Copy {{variable}}"
                      >
                        {isCopied ? (
                          <Check className="w-3.5 h-3.5 text-emerald-500" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                      </button>
                    </div>
                  </td>

                  {/* Type */}
                  <td className="py-3.5 px-3">
                    {item.type === 'secret' ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[11px] font-medium text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 rounded-md">
                        <Lock className="w-3 h-3" />
                        Secret
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[11px] font-medium text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700/60 rounded-md">
                        <FileText className="w-3 h-3 text-slate-400" />
                        Plain
                      </span>
                    )}
                  </td>

                  {/* Parent Environment */}
                  <td className="py-3.5 px-4">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-slate-800 dark:text-slate-200 text-xs">
                        {item.envName}
                      </span>
                      {item.envIsBaseUrl ? (
                        <span className="inline-flex items-center gap-0.5 px-1.5 py-0.2 text-[9px] font-medium text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-950/30 rounded border border-indigo-200 dark:border-indigo-800/40">
                          <Globe className="w-2.5 h-2.5" />
                          Base
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-0.5 px-1.5 py-0.2 text-[9px] font-medium text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/30 rounded border border-amber-200 dark:border-amber-800/40">
                          <KeyRound className="w-2.5 h-2.5" />
                          Vars
                        </span>
                      )}
                    </div>
                  </td>

                  {/* Project */}
                  <td className="py-3.5 px-4">
                    {item.projectName ? (
                      <div className="flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-400">
                        <FolderGit2 className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                        <span className="truncate max-w-32.5" title={item.projectName}>
                          {item.projectName}
                        </span>
                      </div>
                    ) : (
                      <span className="text-xs text-slate-400 italic">—</span>
                    )}
                  </td>

                  {/* Description */}
                  <td className="py-3.5 px-4">
                    {item.description ? (
                      <span className="text-xs text-slate-600 dark:text-slate-400 truncate max-w-55 block" title={item.description}>
                        {item.description}
                      </span>
                    ) : (
                      <span className="text-xs text-slate-400 dark:text-slate-500 italic">—</span>
                    )}
                  </td>

                  {/* Actions */}
                  <td className="py-3.5 px-4 text-right">
                    <button
                      type="button"
                      onClick={() => onEditEnvironment(item.environment)}
                      className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 bg-indigo-50 dark:bg-indigo-950/40 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 rounded-lg transition-colors cursor-pointer"
                      title="Edit Parent Environment"
                    >
                      <Edit2 className="w-3 h-3" />
                      <span>Edit</span>
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
