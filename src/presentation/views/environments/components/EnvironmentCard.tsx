'use client';

import React from 'react';
import { Globe, Copy, Check, Edit2, Trash2 } from 'lucide-react';
import { Environment } from '@/src/domain/environment/entity/environment';
import { StatusBadge } from '@/src/presentation/components/shared/StatusBadge';
import { StatusSwitch } from '@/src/presentation/components/shared/StatusSwitch';
import { ENVIRONMENTS_TEXT } from '../constant';

interface EnvironmentCardProps {
  env: Environment;
  copiedField: string | null;
  onToggleStatus: (id: string) => void;
  onEdit: (env: Environment) => void;
  onDeleteRequest: (id: string) => void;
  onCopyUrl: (text: string, fieldId: string) => void;
}

export const EnvironmentCard: React.FC<EnvironmentCardProps> = ({
  env,
  copiedField,
  onToggleStatus,
  onEdit,
  onDeleteRequest,
  onCopyUrl,
}) => {
  return (
    <div className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl space-y-3 shadow-xs">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 flex items-center justify-center">
            <Globe className="w-3.5 h-3.5" />
          </div>
          <span className="font-bold text-xs text-slate-900 dark:text-slate-100">{env.name}</span>
          <StatusBadge status={env.status} />
        </div>

        <div className="flex items-center gap-2">
          <StatusSwitch
            checked={env.status}
            onCheckedChange={() => onToggleStatus(env.id)}
            size="sm"
          />
          <button
            type="button"
            onClick={() => onEdit(env)}
            className="p-1 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
            title="Edit Environment"
          >
            <Edit2 className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => onDeleteRequest(env.id)}
            className="p-1 text-rose-500 hover:text-rose-700"
            title="Delete Environment"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      <div className="space-y-2 text-xs font-mono pt-1">
        <div className="p-2 bg-slate-50 dark:bg-slate-950 rounded-md border border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2">
          <div className="min-w-0">
            <span className="text-[10px] text-slate-400 block font-sans">{ENVIRONMENTS_TEXT.CARD_PUBLIC_URL}</span>
            <span className="text-slate-800 dark:text-slate-200 truncate block">{env.publicBaseUrl}</span>
          </div>
          <button
            type="button"
            onClick={() => onCopyUrl(env.publicBaseUrl, `${env.id}-pub`)}
            className="text-slate-400 hover:text-slate-600 shrink-0"
          >
            {copiedField === `${env.id}-pub` ? (
              <Check className="w-3.5 h-3.5 text-emerald-500" />
            ) : (
              <Copy className="w-3.5 h-3.5" />
            )}
          </button>
        </div>

        {env.originBaseUrl && (
          <div className="p-2 bg-slate-50 dark:bg-slate-950 rounded-md border border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2">
            <div className="min-w-0">
              <span className="text-[10px] text-slate-400 block font-sans">{ENVIRONMENTS_TEXT.CARD_ORIGIN_URL}</span>
              <span className="text-slate-800 dark:text-slate-200 truncate block">{env.originBaseUrl}</span>
            </div>
            <button
              type="button"
              onClick={() => onCopyUrl(env.originBaseUrl!, `${env.id}-orig`)}
              className="text-slate-400 hover:text-slate-600 shrink-0"
            >
              {copiedField === `${env.id}-orig` ? (
                <Check className="w-3.5 h-3.5 text-emerald-500" />
              ) : (
                <Copy className="w-3.5 h-3.5" />
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
