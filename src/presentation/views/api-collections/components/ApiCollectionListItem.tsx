'use client';

import React from 'react';
import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import { MoreVertical, Copy, Trash2, Edit2, ArrowRight } from 'lucide-react';
import { ApiCollection } from '@/src/domain/api/entity/api_collection';
import { HttpMethodBadge } from '@/src/presentation/components/shared/HttpMethodBadge';
import { StatusBadge } from '@/src/presentation/components/shared/StatusBadge';
import { StatusSwitch } from '@/src/presentation/components/shared/StatusSwitch';

interface ApiCollectionListItemProps {
  api: ApiCollection;
  onNavigateDetail: () => void;
  onToggleStatus: (id: string) => void;
  onEdit: (api: ApiCollection) => void;
  onDuplicate: (api: ApiCollection) => void;
  onDeleteRequest: (id: string) => void;
}

export const ApiCollectionListItem: React.FC<ApiCollectionListItemProps> = ({
  api,
  onNavigateDetail,
  onToggleStatus,
  onEdit,
  onDuplicate,
  onDeleteRequest,
}) => {
  return (
    <div className="p-3.5 hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors flex items-center justify-between gap-4 group">
      <div className="flex items-center gap-3.5 min-w-0 flex-1">
        <HttpMethodBadge method={api.methodRequest} size="md" />

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span
              onClick={onNavigateDetail}
              className="font-mono font-bold text-sm text-slate-900 dark:text-slate-100 hover:text-indigo-600 dark:hover:text-indigo-400 cursor-pointer truncate"
            >
              {api.path}
            </span>
            <StatusBadge status={api.status} />
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
            {api.name} {api.description ? `• ${api.description}` : ''}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-4 shrink-0">
        <StatusSwitch
          checked={api.status}
          onCheckedChange={() => onToggleStatus(api.id)}
          size="sm"
        />

        <button
          type="button"
          onClick={onNavigateDetail}
          className="inline-flex items-center gap-1 px-3 py-1 text-xs font-semibold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/60 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 rounded-md transition-colors"
        >
          Configure
          <ArrowRight className="w-3.5 h-3.5" />
        </button>

        <DropdownMenu.Root>
          <DropdownMenu.Trigger asChild>
            <button type="button" className="p-1 text-slate-400 hover:text-slate-600 rounded">
              <MoreVertical className="w-4 h-4" />
            </button>
          </DropdownMenu.Trigger>
          <DropdownMenu.Portal>
            <DropdownMenu.Content
              align="end"
              className="w-40 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-1 shadow-xl z-50 text-xs text-slate-700 dark:text-slate-300 space-y-0.5"
            >
              <DropdownMenu.Item
                onClick={() => onEdit(api)}
                className="flex items-center gap-2 px-2.5 py-1.5 rounded hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
              >
                <Edit2 className="w-3.5 h-3.5" />
                <span>Edit Endpoint</span>
              </DropdownMenu.Item>
              <DropdownMenu.Item
                onClick={() => onDuplicate(api)}
                className="flex items-center gap-2 px-2.5 py-1.5 rounded hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
              >
                <Copy className="w-3.5 h-3.5" />
                <span>Duplicate API</span>
              </DropdownMenu.Item>
              <DropdownMenu.Separator className="h-px bg-slate-100 dark:bg-slate-800 my-1" />
              <DropdownMenu.Item
                onClick={() => onDeleteRequest(api.id)}
                className="flex items-center gap-2 px-2.5 py-1.5 rounded text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 cursor-pointer font-medium"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Delete</span>
              </DropdownMenu.Item>
            </DropdownMenu.Content>
          </DropdownMenu.Portal>
        </DropdownMenu.Root>
      </div>
    </div>
  );
};
