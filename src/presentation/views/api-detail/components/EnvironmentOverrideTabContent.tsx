'use client';

import React from 'react';
import { Copy, Check } from 'lucide-react';
import { Environment } from '@/src/domain/environment/entity/environment';
import { API_DETAIL_TEXT, API_DETAIL_SEMANTIC_ID } from '../constant';

/* eslint-disable @typescript-eslint/no-explicit-any */
interface EnvironmentOverrideTabContentProps {
  apiPath: string;
  projectEnvs: Environment[];
  environmentRows: any[];
  copiedUrl: string | null;
  onToggleEnabled: (envId: string, enabled: boolean, pathOverride?: string) => void;
  onUpdatePathOverride: (envId: string, enabled: boolean, path: string) => void;
  onCopyResolvedUrl: (url: string) => void;
}

export const EnvironmentOverrideTabContent: React.FC<EnvironmentOverrideTabContentProps> = ({
  apiPath,
  projectEnvs,
  environmentRows,
  copiedUrl,
  onToggleEnabled,
  onUpdatePathOverride,
  onCopyResolvedUrl,
}) => {
  return (
    <div id={API_DETAIL_SEMANTIC_ID.ENV_TAB_CONTENT} className="space-y-6">
      <div className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl space-y-1">
        <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
          {API_DETAIL_TEXT.ENV_OVERRIDE_TITLE}
        </h3>
        <p className="text-xs text-slate-500">
          {API_DETAIL_TEXT.ENV_OVERRIDE_SUBTITLE}
        </p>
      </div>

      <div className="space-y-4">
        {projectEnvs.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-400 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl">
            No environments configured for this project. Go to the Environments tab in project settings to add environments.
          </div>
        ) : (
          environmentRows.map((row) => {
            const env = row.env;
            const isEnabled = row.isEnabled ?? row.enabled ?? false;
            const pathOverride = row.pathOverride ?? row.overridePath ?? '';
            const effectivePath = pathOverride.trim() || apiPath;
            const fullPublicUrl = row.resolvedUrl || `${env.publicBaseUrl.replace(/\/+$/, '')}${
              effectivePath.startsWith('/') ? effectivePath : `/${effectivePath}`
            }`;

            return (
              <div
                key={env.id}
                className="p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl space-y-4 shadow-xs"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-xs text-slate-900 dark:text-slate-100">{env.name}</span>
                    <span className="text-[10px] font-mono text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded">
                      {env.publicBaseUrl}
                    </span>
                  </div>

                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isEnabled}
                      onChange={(e) => onToggleEnabled(env.id, e.target.checked, pathOverride)}
                      className="w-4 h-4 text-indigo-600 rounded border-slate-300 dark:border-slate-700"
                    />
                    <span className="text-xs text-slate-600 dark:text-slate-400 font-medium">Enable Override</span>
                  </label>
                </div>

                {isEnabled && (
                  <div className="space-y-3 pt-2 border-t border-slate-100 dark:border-slate-800 text-xs">
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                        Override Path for {env.name}
                      </label>
                      <input
                        type="text"
                        value={pathOverride}
                        onChange={(e) => onUpdatePathOverride(env.id, true, e.target.value)}
                        placeholder={`Default: ${apiPath}`}
                        className="w-full px-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-900 dark:text-slate-100 font-mono focus:outline-none focus:border-indigo-500"
                      />
                    </div>

                    <div className="p-3 bg-slate-50 dark:bg-slate-950 rounded-lg border border-slate-200/60 dark:border-slate-800 flex items-center justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 block font-sans">
                          Resolved Endpoint URL
                        </span>
                        <span className="font-mono text-xs font-bold text-indigo-600 dark:text-indigo-400 truncate block">
                          {fullPublicUrl}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => onCopyResolvedUrl(fullPublicUrl)}
                        className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-md hover:bg-slate-100 shrink-0"
                      >
                        {copiedUrl === fullPublicUrl ? (
                          <>
                            <Check className="w-3.5 h-3.5 text-emerald-500" /> Copied
                          </>
                        ) : (
                          <>
                            <Copy className="w-3.5 h-3.5" /> Copy URL
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
