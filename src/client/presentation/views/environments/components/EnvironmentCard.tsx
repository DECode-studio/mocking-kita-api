import React, { useState } from 'react';
import { Copy, Check, Edit2, Trash2, Globe, FolderGit2 } from 'lucide-react';
import { Environment } from '@/src/client/domain/environment/entity/environment';
import { Project } from '@/src/client/domain/project/entity/project';
import { EnvironmentTypeBadge } from '@/src/client/presentation/components/shared/EnvironmentTypeBadge';
import { StatusSwitch } from '@/src/client/presentation/components/shared/StatusSwitch';
import { useUIStore } from '@/src/client/presentation/stores/uiStore';
import { ENVIRONMENTS_SEMANTIC_ID, ENVIRONMENTS_TEXT } from '../constant';

interface EnvironmentCardProps {
  environment: Environment;
  project?: Project;
  onEdit: (env: Environment) => void;
  onDelete: (id: string) => void;
  onToggleStatus: (env: Environment) => void;
}

export const EnvironmentCard: React.FC<EnvironmentCardProps> = ({
  environment,
  project,
  onEdit,
  onDelete,
  onToggleStatus,
}) => {
  const [copied, setCopied] = useState(false);
  const addToast = useUIStore((state) => state.addToast);

  const handleCopyUrl = () => {
    if (!environment.baseUrl) return;
    navigator.clipboard.writeText(environment.baseUrl);
    setCopied(true);
    addToast({ title: ENVIRONMENTS_TEXT.TOAST.COPIED_URL, type: 'success' });
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div
      id={ENVIRONMENTS_SEMANTIC_ID.CARD(environment.id)}
      className="group relative flex flex-col justify-between bg-white dark:bg-gray-800/60 border border-gray-200/80 dark:border-gray-700/60 rounded-xl p-5 shadow-xs hover:shadow-md transition-all duration-200 backdrop-blur-xs"
    >
      <div>
        {/* Top bar */}
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex items-center gap-2">
            <h3 className="text-base font-semibold text-gray-900 dark:text-white truncate">
              {environment.name}
            </h3>
            <EnvironmentTypeBadge type={environment.environmentType} size="sm" />
          </div>
          <StatusSwitch
            id={ENVIRONMENTS_SEMANTIC_ID.STATUS_SWITCH(environment.id)}
            checked={environment.status}
            onCheckedChange={() => onToggleStatus(environment)}
          />
        </div>

        {/* Project info */}
        {project && (
          <div className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400 mb-4">
            <FolderGit2 className="w-3.5 h-3.5 text-indigo-500" />
            <span className="font-medium truncate">{project.name}</span>
          </div>
        )}

        {/* Base URL Box */}
        <div className="bg-gray-50 dark:bg-gray-900/60 border border-gray-100 dark:border-gray-800 rounded-lg p-3 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 overflow-hidden">
            <Globe className="w-4 h-4 text-gray-400 shrink-0" />
            <span className="text-xs font-mono text-gray-700 dark:text-gray-300 truncate">
              {environment.baseUrl || 'No base URL set'}
            </span>
          </div>

          {environment.baseUrl && (
            <button
              type="button"
              onClick={handleCopyUrl}
              className="p-1 text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors cursor-pointer"
              title="Copy Base URL"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
            </button>
          )}
        </div>
      </div>

      {/* Footer Actions */}
      <div className="flex items-center justify-end gap-2 mt-5 pt-3 border-t border-gray-100 dark:border-gray-800">
        <button
          id={ENVIRONMENTS_SEMANTIC_ID.EDIT_BTN(environment.id)}
          onClick={() => onEdit(environment)}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-700 dark:text-gray-300 hover:text-indigo-600 dark:hover:text-indigo-400 bg-gray-100 dark:bg-gray-700/50 hover:bg-indigo-50 dark:hover:bg-indigo-950/30 rounded-lg transition-colors cursor-pointer"
        >
          <Edit2 className="w-3.5 h-3.5" />
          <span>Edit</span>
        </button>

        <button
          id={ENVIRONMENTS_SEMANTIC_ID.DELETE_BTN(environment.id)}
          onClick={() => onDelete(environment.id)}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-rose-600 dark:text-rose-400 hover:text-rose-700 bg-rose-50 dark:bg-rose-950/30 hover:bg-rose-100 dark:hover:bg-rose-900/40 rounded-lg transition-colors cursor-pointer"
        >
          <Trash2 className="w-3.5 h-3.5" />
          <span>Delete</span>
        </button>
      </div>
    </div>
  );
};
