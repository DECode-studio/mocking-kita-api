'use client';

import React, { useState } from 'react';
import {
  Globe,
  KeyRound,
  FolderGit2,
  Edit2,
  Trash2,
  Copy,
  Check,
  Sparkles,
  Server,
} from 'lucide-react';
import {
  Environment,
  ALL_ENVIRONMENT_TYPES,
  getEnvironmentBaseUrl,
} from '@/src/client/domain/environment/entity/environment';
import { Project } from '@/src/client/domain/project/entity/project';
import { EnvironmentType } from '@/src/core/utils/types';
import { StatusSwitch } from '@/src/client/presentation/components/shared/StatusSwitch';
import { useUIStore } from '@/src/client/presentation/stores/uiStore';
import { EmptyState } from '@/src/client/presentation/components/shared/EmptyState';
import { ENVIRONMENTS_TEXT, ENVIRONMENTS_SEMANTIC_ID } from '../constant';

interface EnvironmentsTableViewProps {
  environments: Environment[];
  projectMap: Map<string, Project>;
  selectedCategory: 'ALL' | EnvironmentType;
  onEdit: (env: Environment) => void;
  onDelete: (id: string) => void;
  onToggleStatus: (env: Environment) => void;
  onCreateClick: () => void;
}

const STAGE_SHORT_LABELS: Record<EnvironmentType, string> = {
  LOCAL: 'LOCAL',
  DEVELOPMENT: 'DEV',
  TESTING: 'TEST',
  STAGING: 'STG',
  PRODUCTION: 'PROD',
};

const STAGE_COLORS: Record<
  EnvironmentType,
  { active: string; inactive: string }
> = {
  LOCAL: {
    active: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800',
    inactive: 'bg-slate-100 text-slate-400 dark:bg-slate-800/60 dark:text-slate-500 border-slate-200 dark:border-slate-800',
  },
  DEVELOPMENT: {
    active: 'bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border-blue-200 dark:border-blue-800',
    inactive: 'bg-slate-100 text-slate-400 dark:bg-slate-800/60 dark:text-slate-500 border-slate-200 dark:border-slate-800',
  },
  TESTING: {
    active: 'bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 border-amber-200 dark:border-amber-800',
    inactive: 'bg-slate-100 text-slate-400 dark:bg-slate-800/60 dark:text-slate-500 border-slate-200 dark:border-slate-800',
  },
  STAGING: {
    active: 'bg-purple-50 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300 border-purple-200 dark:border-purple-800',
    inactive: 'bg-slate-100 text-slate-400 dark:bg-slate-800/60 dark:text-slate-500 border-slate-200 dark:border-slate-800',
  },
  PRODUCTION: {
    active: 'bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 border-rose-200 dark:border-rose-800',
    inactive: 'bg-slate-100 text-slate-400 dark:bg-slate-800/60 dark:text-slate-500 border-slate-200 dark:border-slate-800',
  },
};

export const EnvironmentsTableView: React.FC<EnvironmentsTableViewProps> = ({
  environments,
  projectMap,
  selectedCategory,
  onEdit,
  onDelete,
  onToggleStatus,
  onCreateClick,
}) => {
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const addToast = useUIStore((state) => state.addToast);

  const handleCopy = (text: string, id: string) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    addToast({ title: ENVIRONMENTS_TEXT.TOAST.COPIED_URL, type: 'success' });
    setTimeout(() => setCopiedId(null), 2000);
  };

  if (environments.length === 0) {
    return (
      <div
        id={ENVIRONMENTS_SEMANTIC_ID.EMPTY_STATE}
        className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-12 text-center"
      >
        <EmptyState
          icon={Server}
          title={ENVIRONMENTS_TEXT.NO_ENVIRONMENTS}
          description={ENVIRONMENTS_TEXT.NO_ENVIRONMENTS_SUBTITLE}
          actionLabel={ENVIRONMENTS_TEXT.CREATE_BUTTON}
          onAction={onCreateClick}
        />
      </div>
    );
  }

  return (
    <div
      id={ENVIRONMENTS_SEMANTIC_ID.TABLE}
      className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xs overflow-hidden transition-colors"
    >
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-950/40 text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              <th className="py-3.5 px-4.5 min-w-50">{ENVIRONMENTS_TEXT.TABLE.COL_NAME}</th>
              <th className="py-3.5 px-4 min-w-37.5">{ENVIRONMENTS_TEXT.TABLE.COL_PROJECT}</th>
              <th className="py-3.5 px-4 min-w-65">{ENVIRONMENTS_TEXT.TABLE.COL_STAGE_URL}</th>
              <th className="py-3.5 px-4 min-w-45">{ENVIRONMENTS_TEXT.TABLE.COL_MATRIX}</th>
              <th className="py-3.5 px-3 text-center min-w-20">{ENVIRONMENTS_TEXT.TABLE.COL_STATUS}</th>
              <th className="py-3.5 px-4 text-right min-w-30">{ENVIRONMENTS_TEXT.TABLE.COL_ACTIONS}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200/80 dark:divide-slate-800/80 text-sm text-slate-700 dark:text-slate-300">
            {environments.map((env) => {
              const project = projectMap.get(env.projectId);
              const isBaseUrl = env.isBaseUrl !== false;
              const values = env.values || {};
              const variables = Array.isArray(env.variables) ? env.variables : [];

              // Resolve display URL according to active category or default
              let displayUrl = '';
              let isLocalAuto = false;

              if (selectedCategory === 'LOCAL' && isBaseUrl) {
                isLocalAuto = true;
              } else if (selectedCategory !== 'ALL') {
                displayUrl = String(values[selectedCategory] || '');
                if (!displayUrl && env.environmentType === selectedCategory) {
                  displayUrl = getEnvironmentBaseUrl(env);
                }
              } else {
                displayUrl = getEnvironmentBaseUrl(env);
              }

              return (
                <tr
                  key={env.id}
                  id={ENVIRONMENTS_SEMANTIC_ID.TABLE_ROW(env.id)}
                  className="hover:bg-slate-50/70 dark:hover:bg-slate-800/30 transition-colors group"
                >
                  {/* Environment Name & Type */}
                  <td className="py-3.5 px-4.5">
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-slate-900 dark:text-white text-sm">
                          {env.name}
                        </span>
                        {isBaseUrl ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-medium text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800/60 rounded-md">
                            <Globe className="w-3 h-3" />
                            Base URL
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-medium text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 rounded-md">
                            <KeyRound className="w-3 h-3" />
                            Variables
                          </span>
                        )}
                      </div>
                    </div>
                  </td>

                  {/* Project */}
                  <td className="py-3.5 px-4">
                    {project ? (
                      <div className="flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-400">
                        <FolderGit2 className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                        <span className="truncate max-w-35" title={project.name}>
                          {project.name}
                        </span>
                      </div>
                    ) : (
                      <span className="text-xs text-slate-400 italic">—</span>
                    )}
                  </td>

                  {/* Stage Endpoint / Value */}
                  <td className="py-3.5 px-4 font-mono text-xs">
                    {isLocalAuto ? (
                      <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 rounded-lg text-emerald-700 dark:text-emerald-300 text-xs">
                        <Sparkles className="w-3 h-3 text-emerald-500" />
                        <span>{ENVIRONMENTS_TEXT.TABLE.LOCAL_MOCK_HINT}</span>
                      </div>
                    ) : displayUrl ? (
                      <div className="flex items-center gap-2 max-w-70">
                        <span
                          className="truncate text-slate-800 dark:text-slate-200 bg-slate-100 dark:bg-slate-800/80 px-2 py-0.5 rounded border border-slate-200 dark:border-slate-700/60"
                          title={displayUrl}
                        >
                          {displayUrl}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleCopy(displayUrl, `url-${env.id}`)}
                          className="p-1 text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors cursor-pointer shrink-0"
                          title="Copy URL"
                        >
                          {copiedId === `url-${env.id}` ? (
                            <Check className="w-3.5 h-3.5 text-emerald-500" />
                          ) : (
                            <Copy className="w-3.5 h-3.5" />
                          )}
                        </button>
                      </div>
                    ) : (
                      <span className="text-slate-400 dark:text-slate-500 text-xs italic">
                        {ENVIRONMENTS_TEXT.TABLE.STAGE_NOT_SET}
                      </span>
                    )}
                  </td>

                  {/* Stages Matrix */}
                  <td className="py-3.5 px-4">
                    <div className="flex items-center gap-1">
                      {ALL_ENVIRONMENT_TYPES.map((stage) => {
                        const isLocalBase = isBaseUrl && stage === 'LOCAL';
                        const isFilled =
                          isLocalBase ||
                          (values[stage] !== undefined &&
                            values[stage] !== null &&
                            String(values[stage]).trim().length > 0) ||
                          env.environmentType === stage;

                        const color = STAGE_COLORS[stage];
                        const isCurrentCategory = selectedCategory === stage;

                        return (
                          <span
                            key={stage}
                            className={`px-1.5 py-0.5 rounded text-[10px] font-bold font-mono border transition-all ${
                              isFilled ? color.active : color.inactive
                            } ${isCurrentCategory ? 'ring-2 ring-indigo-500 ring-offset-1 dark:ring-offset-slate-900' : ''}`}
                            title={`${stage}: ${
                              isLocalBase
                                ? 'Auto Mock'
                                : values[stage] || (env.environmentType === stage ? displayUrl : 'Not set')
                            }`}
                          >
                            {STAGE_SHORT_LABELS[stage]}
                          </span>
                        );
                      })}
                    </div>
                  </td>

                  {/* Status Switch */}
                  <td className="py-3.5 px-3 text-center">
                    <div className="flex justify-center">
                      <StatusSwitch
                        id={ENVIRONMENTS_SEMANTIC_ID.STATUS_SWITCH(env.id)}
                        checked={env.status}
                        onCheckedChange={() => onToggleStatus(env)}
                      />
                    </div>
                  </td>

                  {/* Actions */}
                  <td className="py-3.5 px-4 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        id={ENVIRONMENTS_SEMANTIC_ID.EDIT_BTN(env.id)}
                        onClick={() => onEdit(env)}
                        className="p-1.5 text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                        title={ENVIRONMENTS_TEXT.EDIT_BUTTON}
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        id={ENVIRONMENTS_SEMANTIC_ID.DELETE_BTN(env.id)}
                        onClick={() => onDelete(env.id)}
                        className="p-1.5 text-slate-500 dark:text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-lg transition-colors cursor-pointer"
                        title={ENVIRONMENTS_TEXT.CARD_DELETE_BTN}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
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
