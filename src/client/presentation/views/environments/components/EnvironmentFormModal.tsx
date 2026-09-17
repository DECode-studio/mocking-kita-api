import React, { useState, useEffect } from 'react';
import { X, Server, Globe, FolderGit2 } from 'lucide-react';
import { Environment } from '@/src/client/domain/environment/entity/environment';
import { Project } from '@/src/client/domain/project/entity/project';
import { EnvironmentType } from '@/src/core/utils/types';
import { StatusSwitch } from '@/src/client/presentation/components/shared/StatusSwitch';
import { EnvironmentFormData } from '../hook/useEnvironments';
import { ENVIRONMENTS_SEMANTIC_ID, ENVIRONMENTS_TEXT } from '../constant';

interface EnvironmentFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: EnvironmentFormData) => Promise<void>;
  editingEnvironment: Environment | null;
  projects: Project[];
  defaultProjectId?: string;
}

const ENVIRONMENT_TYPES: EnvironmentType[] = [
  'LOCAL',
  'DEVELOPMENT',
  'TESTING',
  'STAGING',
  'PRODUCTION',
];

export const EnvironmentFormModal: React.FC<EnvironmentFormModalProps> = ({
  isOpen,
  onClose,
  onSave,
  editingEnvironment,
  projects,
  defaultProjectId,
}) => {
  const [name, setName] = useState('');
  const [projectId, setProjectId] = useState('');
  const [environmentType, setEnvironmentType] = useState<EnvironmentType>('DEVELOPMENT');
  const [baseUrl, setBaseUrl] = useState('');
  const [status, setStatus] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (editingEnvironment) {
      setName(editingEnvironment.name);
      setProjectId(editingEnvironment.projectId);
      setEnvironmentType(editingEnvironment.environmentType);
      setBaseUrl(editingEnvironment.baseUrl || '');
      setStatus(editingEnvironment.status);
    } else {
      setName('');
      setProjectId(defaultProjectId || (projects.length > 0 ? projects[0].id : ''));
      setEnvironmentType('DEVELOPMENT');
      setBaseUrl('');
      setStatus(true);
    }
  }, [editingEnvironment, projects, defaultProjectId, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !projectId) return;

    setIsSubmitting(true);
    try {
      await onSave({
        name: name.trim(),
        projectId,
        environmentType,
        baseUrl: baseUrl.trim(),
        status,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-xs">
      <div
        id={ENVIRONMENTS_SEMANTIC_ID.FORM_MODAL}
        className="relative w-full max-w-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700/60 rounded-2xl shadow-xl overflow-hidden"
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-gray-700/60">
          <div className="flex items-center gap-2">
            <Server className="w-5 h-5 text-indigo-500" />
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              {editingEnvironment ? ENVIRONMENTS_TEXT.EDIT_BUTTON : ENVIRONMENTS_TEXT.CREATE_BUTTON}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-lg cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Name */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
              {ENVIRONMENTS_TEXT.FORM.NAME_LABEL} <span className="text-rose-500">*</span>
            </label>
            <input
              id={ENVIRONMENTS_SEMANTIC_ID.FORM_NAME_INPUT}
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={ENVIRONMENTS_TEXT.FORM.NAME_PLACEHOLDER}
              className="w-full px-3 py-2 text-sm bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 dark:text-white"
            />
          </div>

          {/* Project Select */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
              {ENVIRONMENTS_TEXT.FORM.PROJECT_LABEL} <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <FolderGit2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <select
                id={ENVIRONMENTS_SEMANTIC_ID.FORM_PROJECT_SELECT}
                required
                value={projectId}
                onChange={(e) => setProjectId(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-sm bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 dark:text-white cursor-pointer"
              >
                <option value="" disabled>
                  {ENVIRONMENTS_TEXT.FORM.SELECT_PROJECT}
                </option>
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Environment Type Select */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
              {ENVIRONMENTS_TEXT.FORM.TYPE_LABEL}
            </label>
            <select
              id={ENVIRONMENTS_SEMANTIC_ID.FORM_TYPE_SELECT}
              value={environmentType}
              onChange={(e) => setEnvironmentType(e.target.value as EnvironmentType)}
              className="w-full px-3 py-2 text-sm bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 dark:text-white cursor-pointer"
            >
              {ENVIRONMENT_TYPES.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>

          {/* Base URL Input */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
              {ENVIRONMENTS_TEXT.FORM.BASE_URL_LABEL}
            </label>
            <div className="relative">
              <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                id={ENVIRONMENTS_SEMANTIC_ID.FORM_BASE_URL_INPUT}
                type="text"
                value={baseUrl}
                onChange={(e) => setBaseUrl(e.target.value)}
                placeholder={ENVIRONMENTS_TEXT.FORM.BASE_URL_PLACEHOLDER}
                className="w-full pl-9 pr-3 py-2 text-sm font-mono bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 dark:text-white"
              />
            </div>
          </div>

          {/* Status Switch */}
          <div className="flex items-center justify-between pt-2">
            <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">
              {ENVIRONMENTS_TEXT.FORM.STATUS_LABEL}
            </span>
            <StatusSwitch checked={status} onCheckedChange={setStatus} />
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100 dark:border-gray-700/60">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors cursor-pointer"
            >
              {ENVIRONMENTS_TEXT.FORM.CANCEL}
            </button>
            <button
              id={ENVIRONMENTS_SEMANTIC_ID.FORM_SUBMIT_BTN}
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600 rounded-lg shadow-sm transition-colors cursor-pointer disabled:opacity-50"
            >
              {isSubmitting ? 'Saving...' : ENVIRONMENTS_TEXT.FORM.SAVE}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
