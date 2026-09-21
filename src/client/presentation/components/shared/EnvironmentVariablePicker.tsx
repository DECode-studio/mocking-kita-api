'use client';

import React, { useState, useEffect } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { Globe, X, Copy, Check, Plus, Search, Sparkles, KeyRound } from 'lucide-react';
import { Environment, ALL_ENVIRONMENT_TYPES } from '@/src/client/domain/environment/entity/environment';
import { getService, CLIENT_DI_TOKENS } from '@/src/core/di';
import { EnvironmentTypeBadge } from './EnvironmentTypeBadge';

interface EnvironmentVariablePickerProps {
  projectId?: string;
  onInsert?: (token: string) => void;
  triggerClassName?: string;
  buttonLabel?: string;
}

interface EnvVarItem {
  key: string;
  token: string;
  namespacedToken: string;
  environmentName: string;
  isBaseUrl: boolean;
  activeStages: string[];
}

export const EnvironmentVariablePicker: React.FC<EnvironmentVariablePickerProps> = ({
  projectId,
  onInsert,
  triggerClassName = '',
  buttonLabel = 'Env Variables',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [environments, setEnvironments] = useState<Environment[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [copiedToken, setCopiedToken] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    const fetchEnvironments = async () => {
      setIsLoading(true);
      try {
        const useCase = getService(CLIENT_DI_TOKENS.environmentUseCase);
        const list = projectId
          ? await useCase.getByProjectId(projectId)
          : await useCase.getAll();
        setEnvironments(list.filter((e) => e.status && !e.deletedAt));
      } catch (err) {
        console.error('Failed to load environments for picker', err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchEnvironments();
  }, [isOpen, projectId]);

  const handleCopy = (token: string) => {
    navigator.clipboard.writeText(token);
    setCopiedToken(token);
    setTimeout(() => setCopiedToken(null), 1500);
  };

  const handleInsert = (token: string) => {
    if (onInsert) {
      onInsert(token);
      setIsOpen(false);
    } else {
      handleCopy(token);
    }
  };

  // Build selectable items from environments
  const items: EnvVarItem[] = [];
  for (const env of environments) {
    // 1. Matrix variable (isBaseUrl: false) or regular named environment
    if (env.isBaseUrl === false && env.name) {
      const activeStages = ALL_ENVIRONMENT_TYPES.filter(
        (stage) => !!env.values?.[stage]
      );
      items.push({
        key: env.name,
        token: `{{${env.name}}}`,
        namespacedToken: `{{env.${env.name}}}`,
        environmentName: env.name,
        isBaseUrl: false,
        activeStages,
      });
    } else if (env.isBaseUrl) {
      // Base URL environment
      const activeStages = ALL_ENVIRONMENT_TYPES.filter(
        (stage) => !!env.values?.[stage]
      );
      items.push({
        key: 'base_url',
        token: `{{base_url}}`,
        namespacedToken: `{{env.base_url}}`,
        environmentName: env.name || 'Base URL',
        isBaseUrl: true,
        activeStages,
      });
    }

    // 2. Granular variables if configured inside environment
    if (Array.isArray(env.variables)) {
      for (const v of env.variables) {
        if (!v.key) continue;
        const exists = items.some((i) => i.key.toLowerCase() === v.key.toLowerCase());
        if (!exists) {
          items.push({
            key: v.key,
            token: `{{${v.key}}}`,
            namespacedToken: `{{env.${v.key}}}`,
            environmentName: env.name,
            isBaseUrl: false,
            activeStages: [],
          });
        }
      }
    }
  }

  const filteredItems = items.filter((item) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      item.key.toLowerCase().includes(q) ||
      item.environmentName.toLowerCase().includes(q) ||
      item.activeStages.some((s) => s.toLowerCase().includes(q))
    );
  });

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-lg border transition-colors bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/40 dark:hover:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800 cursor-pointer ${triggerClassName}`}
      >
        <Globe className="w-3.5 h-3.5" />
        <span>{buttonLabel}</span>
      </button>

      <Dialog.Root open={isOpen} onOpenChange={setIsOpen}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs z-50 animate-in fade-in" />
          <Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-2xl z-50 max-h-[85vh] flex flex-col space-y-4">
            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                  <KeyRound className="w-4 h-4" />
                </div>
                <div>
                  <Dialog.Title className="text-base font-bold text-slate-900 dark:text-white">
                    Environment Variables
                  </Dialog.Title>
                  <Dialog.Description className="text-xs text-slate-500 dark:text-slate-400">
                    Select an environment token to insert or copy
                  </Dialog.Description>
                </div>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Search */}
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search variables by name or stage..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full text-xs pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto space-y-2.5 pr-1 max-h-[50vh]">
              {isLoading ? (
                <p className="text-xs text-slate-400 text-center py-8">Loading environment variables...</p>
              ) : filteredItems.length === 0 ? (
                <div className="text-center py-8 space-y-1">
                  <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    No active environment variables available
                  </p>
                  <p className="text-[11px] text-slate-400">
                    Add variables in the Environments tab of this project.
                  </p>
                </div>
              ) : (
                filteredItems.map((item) => (
                  <div
                    key={`${item.environmentName}_${item.key}`}
                    className="p-3 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 rounded-xl space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-slate-900 dark:text-slate-100">
                          {item.key}
                        </span>
                        {item.isBaseUrl ? (
                          <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300">
                            Base URL
                          </span>
                        ) : (
                          <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300">
                            Matrix Variable
                          </span>
                        )}
                      </div>
                      {item.activeStages.length > 0 && (
                        <div className="flex items-center gap-1">
                          {item.activeStages.map((stage) => (
                            <EnvironmentTypeBadge key={stage} type={stage} size="sm" />
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-2 flex-wrap pt-1">
                      {/* Standard Token */}
                      <div className="flex items-center rounded-lg border border-emerald-200 dark:border-emerald-800/80 overflow-hidden text-[11px]">
                        <span className="font-mono px-2 py-1 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300">
                          {item.token}
                        </span>
                        {onInsert ? (
                          <button
                            type="button"
                            onClick={() => handleInsert(item.token)}
                            className="px-2 py-1 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold transition-colors flex items-center gap-1 cursor-pointer"
                          >
                            <Plus className="w-3 h-3" /> Insert
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => handleCopy(item.token)}
                            className="px-2 py-1 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold transition-colors flex items-center gap-1 cursor-pointer"
                          >
                            {copiedToken === item.token ? (
                              <Check className="w-3 h-3" />
                            ) : (
                              <Copy className="w-3 h-3" />
                            )}
                            Copy
                          </button>
                        )}
                      </div>

                      {/* Namespaced Token button {{env.KEY}} */}
                      <button
                        type="button"
                        onClick={() =>
                          onInsert ? handleInsert(item.namespacedToken) : handleCopy(item.namespacedToken)
                        }
                        title={`Explicit scope: ${item.namespacedToken}`}
                        className="px-2 py-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-[11px] font-mono hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors cursor-pointer"
                      >
                        {item.namespacedToken}
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Footer */}
            <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-400">
              <span className="flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5 text-emerald-500" />
                <span>Values dynamically resolve based on active test stage (DEV, STG, PROD, etc.)</span>
              </span>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              >
                Close
              </button>
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </>
  );
};
