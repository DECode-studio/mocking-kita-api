import React, { useState } from 'react';
import {
  Copy,
  Check,
  Edit2,
  Trash2,
  Globe,
  FolderGit2,
  KeyRound,
  Lock,
  ChevronDown,
  ChevronUp,
  Sparkles,
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
import { ENVIRONMENTS_SEMANTIC_ID } from '../constant';

interface EnvironmentCardProps {
  environment: Environment;
  project?: Project;
  onEdit: (env: Environment) => void;
  onDelete: (id: string) => void;
  onToggleStatus: (env: Environment) => void;
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
  { active: string; inactive: string; text: string }
> = {
  LOCAL: {
    active: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800',
    inactive: 'bg-slate-100 text-slate-400 dark:bg-slate-800 dark:text-slate-500 border-slate-200 dark:border-slate-750',
    text: 'text-emerald-600 dark:text-emerald-400',
  },
  DEVELOPMENT: {
    active: 'bg-blue-50 text-blue-700 dark:bg-blue-950/50 dark:text-blue-300 border-blue-200 dark:border-blue-800',
    inactive: 'bg-slate-100 text-slate-400 dark:bg-slate-800 dark:text-slate-500 border-slate-200 dark:border-slate-750',
    text: 'text-blue-600 dark:text-blue-400',
  },
  TESTING: {
    active: 'bg-amber-50 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300 border-amber-200 dark:border-amber-800',
    inactive: 'bg-slate-100 text-slate-400 dark:bg-slate-800 dark:text-slate-500 border-slate-200 dark:border-slate-750',
    text: 'text-amber-600 dark:text-amber-400',
  },
  STAGING: {
    active: 'bg-purple-50 text-purple-700 dark:bg-purple-950/50 dark:text-purple-300 border-purple-200 dark:border-purple-800',
    inactive: 'bg-slate-100 text-slate-400 dark:bg-slate-800 dark:text-slate-500 border-slate-200 dark:border-slate-750',
    text: 'text-purple-600 dark:text-purple-400',
  },
  PRODUCTION: {
    active: 'bg-rose-50 text-rose-700 dark:bg-rose-950/50 dark:text-rose-300 border-rose-200 dark:border-rose-800',
    inactive: 'bg-slate-100 text-slate-400 dark:bg-slate-800 dark:text-slate-500 border-slate-200 dark:border-slate-750',
    text: 'text-rose-600 dark:text-rose-400',
  },
};

export const EnvironmentCard: React.FC<EnvironmentCardProps> = ({
  environment,
  project,
  onEdit,
  onDelete,
  onToggleStatus,
}) => {
  const isBaseUrl = environment.isBaseUrl !== false;
  const values = environment.values || {};
  const variables = Array.isArray(environment.variables) ? environment.variables : [];

  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [showAllStages, setShowAllStages] = useState(false);
  const [showVariables, setShowVariables] = useState(!isBaseUrl || variables.length <= 5);
  const addToast = useUIStore((state) => state.addToast);

  const handleCopy = (text: string, label: string) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedKey(label);
    addToast({ title: `${label} copied to clipboard`, type: 'success' });
    setTimeout(() => setCopiedKey(null), 2000);
  };

  // Compute filled stages
  const filledStages = ALL_ENVIRONMENT_TYPES.filter((stage) => {
    if (stage === 'LOCAL' && isBaseUrl) return false;
    const val = values[stage];
    return val !== undefined && val !== null && String(val).trim().length > 0;
  });

  // Check legacy baseUrl fallback if values is completely empty
  const hasLegacyOnly =
    filledStages.length === 0 &&
    !values.DEVELOPMENT &&
    !values.STAGING &&
    !values.PRODUCTION &&
    !values.TESTING &&
    getEnvironmentBaseUrl(environment);

  return (
    <div
      id={ENVIRONMENTS_SEMANTIC_ID.CARD(environment.id)}
      className="group relative flex flex-col justify-between bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs hover:shadow-md transition-all duration-200 backdrop-blur-xs"
    >
      <div>
        {/* Top Header bar */}
        <div className="flex items-start justify-between gap-3 mb-2">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-base font-bold text-slate-900 dark:text-white truncate">
                {environment.name}
              </h3>

              {isBaseUrl ? (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-semibold text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800/60 rounded-md">
                  <Globe className="w-3 h-3" />
                  Base URL
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-semibold text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 rounded-md">
                  <KeyRound className="w-3 h-3" />
                  Variables
                </span>
              )}
            </div>

            {project && (
              <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 mt-1">
                <FolderGit2 className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                <span className="truncate">{project.name}</span>
              </div>
            )}
          </div>

          <StatusSwitch
            id={ENVIRONMENTS_SEMANTIC_ID.STATUS_SWITCH(environment.id)}
            checked={environment.status}
            onCheckedChange={() => onToggleStatus(environment)}
          />
        </div>

        {/* Stage Status Matrix Bar */}
        <div className="mt-3 p-2 bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 rounded-xl">
          <div className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5 flex items-center justify-between">
            <span>Environment Stages</span>
            <span className="text-[9px] font-normal lowercase">
              {isBaseUrl
                ? `${filledStages.length} configured + local mock`
                : `${filledStages.length + (values.LOCAL ? 1 : 0)} configured`}
            </span>
          </div>

          <div className="grid grid-cols-5 gap-1 text-center">
            {ALL_ENVIRONMENT_TYPES.map((stage) => {
              const isLocalBase = isBaseUrl && stage === 'LOCAL';
              const isFilled =
                isLocalBase ||
                (values[stage] !== undefined &&
                  values[stage] !== null &&
                  String(values[stage]).trim().length > 0) ||
                (hasLegacyOnly && environment.environmentType === stage);

              const color = STAGE_COLORS[stage];

              return (
                <div
                  key={stage}
                  className={`px-1 py-1 rounded-md border text-[10px] font-bold font-mono transition-colors ${
                    isFilled ? color.active : color.inactive
                  }`}
                  title={
                    isLocalBase
                      ? 'LOCAL: Auto handled by Mock Engine'
                      : String(values[stage] || (hasLegacyOnly && environment.environmentType === stage ? getEnvironmentBaseUrl(environment) : 'Not configured'))
                  }
                >
                  <div className="truncate">{STAGE_SHORT_LABELS[stage]}</div>
                  <div className="text-[8px] font-sans font-normal opacity-80 mt-0.5">
                    {isLocalBase ? 'MOCK' : isFilled ? 'SET' : '—'}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* URLs / Values List */}
        <div className="mt-3 space-y-1.5">
          {/* Local Mock Badge for Base URL */}
          {isBaseUrl && (
            <div className="flex items-center justify-between gap-2 px-2.5 py-1.5 bg-emerald-50/60 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900/40 rounded-lg text-xs">
              <div className="flex items-center gap-1.5 font-mono text-[11px] overflow-hidden">
                <span className="font-bold px-1.5 py-0.2 rounded text-[10px] bg-emerald-100 text-emerald-800 dark:bg-emerald-900/60 dark:text-emerald-300">
                  LOCAL
                </span>
                <span className="text-emerald-700 dark:text-emerald-400 truncate flex items-center gap-1 text-[11px]">
                  <Sparkles className="w-3 h-3 shrink-0" />
                  Mock Server Proxy (Internal)
                </span>
              </div>
            </div>
          )}

          {/* Configured Stages URLs */}
          {filledStages.length > 0 ? (
            <div className="space-y-1.5">
              {(showAllStages ? filledStages : filledStages.slice(0, 2)).map((stage) => {
                const urlVal = String(values[stage] || '');
                const label = `${environment.name} (${STAGE_SHORT_LABELS[stage]})`;

                return (
                  <div
                    key={stage}
                    className="flex items-center justify-between gap-2 px-2.5 py-1.5 bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 rounded-lg text-xs"
                  >
                    <div className="flex items-center gap-1.5 font-mono text-[11px] overflow-hidden min-w-0">
                      <span
                        className={`font-bold px-1.5 py-0.2 rounded text-[10px] shrink-0 ${STAGE_COLORS[stage].active}`}
                      >
                        {STAGE_SHORT_LABELS[stage]}
                      </span>
                      <span
                        className="text-slate-800 dark:text-slate-200 truncate"
                        title={urlVal}
                      >
                        {urlVal}
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleCopy(urlVal, label)}
                      className="p-1 text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors cursor-pointer shrink-0"
                      title={`Copy ${label}`}
                    >
                      {copiedKey === label ? (
                        <Check className="w-3.5 h-3.5 text-emerald-500" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </div>
                );
              })}

              {filledStages.length > 2 && (
                <button
                  type="button"
                  onClick={() => setShowAllStages(!showAllStages)}
                  className="w-full text-center py-1 text-[11px] font-medium text-indigo-600 dark:text-indigo-400 hover:underline flex items-center justify-center gap-1 cursor-pointer"
                >
                  {showAllStages ? (
                    <>
                      <ChevronUp className="w-3 h-3" />
                      Tampilkan lebih sedikit
                    </>
                  ) : (
                    <>
                      <ChevronDown className="w-3 h-3" />
                      Lihat {filledStages.length - 2} stage lainnya
                    </>
                  )}
                </button>
              )}
            </div>
          ) : hasLegacyOnly ? (
            <div className="flex items-center justify-between gap-2 px-2.5 py-1.5 bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 rounded-lg text-xs">
              <div className="flex items-center gap-1.5 font-mono text-[11px] overflow-hidden">
                <span className="font-bold px-1.5 py-0.2 rounded text-[10px] bg-blue-100 text-blue-800 dark:bg-blue-900/60 dark:text-blue-300">
                  {STAGE_SHORT_LABELS[environment.environmentType || 'DEVELOPMENT']}
                </span>
                <span className="text-slate-800 dark:text-slate-200 truncate" title={getEnvironmentBaseUrl(environment)}>
                  {getEnvironmentBaseUrl(environment)}
                </span>
              </div>
              <button
                type="button"
                onClick={() => handleCopy(getEnvironmentBaseUrl(environment), 'Base URL')}
                className="p-1 text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors cursor-pointer shrink-0"
              >
                {copiedKey === 'Base URL' ? (
                  <Check className="w-3.5 h-3.5 text-emerald-500" />
                ) : (
                  <Copy className="w-3.5 h-3.5" />
                )}
              </button>
            </div>
          ) : !isBaseUrl ? (
            <div className="p-2 bg-slate-50 dark:bg-slate-950/30 border border-dashed border-slate-200 dark:border-slate-800 rounded-lg text-center text-slate-400 text-xs">
              Belum ada nilai stage yang dikonfigurasi
            </div>
          ) : null}
        </div>

        {/* Custom Variables Section (if any) */}
        {variables.length > 0 && (
          <div className="mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-800">
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-1 text-[11px] font-semibold text-slate-600 dark:text-slate-400">
                <KeyRound className="w-3 h-3 text-amber-500" />
                <span>Custom Variables ({variables.length})</span>
              </div>
              <button
                type="button"
                onClick={() => setShowVariables(!showVariables)}
                className="text-[10px] text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer"
              >
                {showVariables ? 'Sembunyikan' : 'Lihat'}
              </button>
            </div>

            {!showVariables ? (
              <div className="flex flex-wrap gap-1">
                {variables.slice(0, 3).map((v) => (
                  <span
                    key={v.id || v.key}
                    className="inline-flex items-center gap-1 px-1.5 py-0.5 text-[10px] font-mono rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300"
                  >
                    {v.type === 'secret' && <Lock className="w-2.5 h-2.5 text-amber-500" />}
                    {v.key}
                  </span>
                ))}
                {variables.length > 3 && (
                  <span className="text-[10px] text-slate-400">+{variables.length - 3}</span>
                )}
              </div>
            ) : (
              <div className="max-h-28 overflow-y-auto space-y-1 p-1.5 bg-slate-50 dark:bg-slate-950/60 rounded-lg text-xs font-mono">
                {variables.map((v) => (
                  <div key={v.id || v.key} className="flex items-center justify-between text-[11px]">
                    <span className="text-slate-700 dark:text-slate-300 truncate font-medium">
                      {v.key}:
                    </span>
                    <span className="text-slate-500 dark:text-slate-400 truncate">
                      {v.type === 'secret' ? '••••••••' : v.value}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Footer Actions */}
      <div className="flex items-center justify-end gap-2 mt-4 pt-3 border-t border-slate-100 dark:border-slate-800">
        <button
          id={ENVIRONMENTS_SEMANTIC_ID.EDIT_BTN(environment.id)}
          onClick={() => onEdit(environment)}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 bg-slate-100 dark:bg-slate-800 hover:bg-indigo-50 dark:hover:bg-indigo-950/30 rounded-lg transition-colors cursor-pointer"
        >
          <Edit2 className="w-3.5 h-3.5" />
          <span>Edit Matrix</span>
        </button>

        <button
          id={ENVIRONMENTS_SEMANTIC_ID.DELETE_BTN(environment.id)}
          onClick={() => onDelete(environment.id)}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-rose-600 dark:text-rose-400 hover:text-rose-700 bg-rose-50 dark:bg-rose-950/30 hover:bg-rose-100 dark:hover:bg-rose-900/40 rounded-lg transition-colors cursor-pointer"
        >
          <Trash2 className="w-3.5 h-3.5" />
          <span>Delete</span>
        </button>
      </div>
    </div>
  );
};
