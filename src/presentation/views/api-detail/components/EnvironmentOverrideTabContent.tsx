'use client';

import React from 'react';
import { Copy, Check } from 'lucide-react';
import { Environment } from '@/src/domain/environment/entity/environment';
import { ApiEnvironment } from '@/src/domain/api/entity/api_environment';
import { EnvironmentTypeBadge } from '@/src/presentation/components/shared/EnvironmentTypeBadge';
import { StatusSwitch } from '@/src/presentation/components/shared/StatusSwitch';

export interface EnvironmentRow {
  env: Environment;
  apiEnv?: ApiEnvironment;
  isEnabled: boolean;
  pathOverride: string;
  resolvedPath: string;
  resolvedUrl: string;
}

interface EnvironmentOverrideTabContentProps {
  apiPath: string;
  projectEnvs: Environment[];
  environmentRows: EnvironmentRow[];
  copiedUrl: string | null;
  onToggleEnabled: (envId: string, enabled: boolean, pathOverride: string) => void;
  onUpdatePathOverride: (envId: string, enabled: boolean, pathOverride: string) => void;
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
    <div className="p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl space-y-4">
      <div>
        <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
          Environment Availability & Path Overrides
        </h3>
        <p className="text-xs text-slate-500">
          Enable or disable this API endpoint for specific environments or override its path.
        </p>
      </div>

      {projectEnvs.length === 0 ? (
        <p className="text-xs text-slate-500 italic">No environments configured for this project.</p>
      ) : (
        <div className="space-y-3">
          {environmentRows.map(({ env, isEnabled, pathOverride, resolvedUrl }) => (
            <div
              key={env.id}
              className="p-4 border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50/50 dark:bg-slate-950/50 space-y-3"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <EnvironmentTypeBadge type={env.environmentType} />
                  <span className="font-bold text-xs text-slate-900 dark:text-slate-100">
                    {env.name}
                  </span>
                </div>

                <StatusSwitch
                  checked={isEnabled}
                  onCheckedChange={(val) => onToggleEnabled(env.id, val, pathOverride)}
                  label={isEnabled ? 'Enabled' : 'Disabled'}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                <div>
                  <label className="block text-[10px] text-slate-500 uppercase font-semibold mb-1">
                    Path Override (Optional)
                  </label>
                  <input
                    type="text"
                    defaultValue={pathOverride}
                    onBlur={(e) => onUpdatePathOverride(env.id, isEnabled, e.target.value)}
                    placeholder={apiPath}
                    className="w-full px-3 py-1.5 font-mono bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-900 dark:text-slate-100 focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-[10px] text-slate-500 uppercase font-semibold mb-1">
                    Final Resolved Mock URL
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      readOnly
                      value={resolvedUrl}
                      className="w-full px-3 py-1.5 font-mono bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-indigo-600 dark:text-indigo-400 font-semibold focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => onCopyResolvedUrl(resolvedUrl)}
                      className="px-2.5 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:bg-slate-100 rounded-lg shrink-0"
                    >
                      {copiedUrl === resolvedUrl ? (
                        <Check className="w-3.5 h-3.5 text-emerald-500" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
