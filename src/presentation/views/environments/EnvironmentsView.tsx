'use client';

import React from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import {
  Globe,
  Plus,
  Copy,
  Check,
  Edit2,
  Trash2,
  X,
  ExternalLink,
  ShieldAlert,
} from 'lucide-react';
import { EnvironmentTypeBadge } from '../../components/shared/EnvironmentTypeBadge';
import { StatusSwitch } from '../../components/shared/StatusSwitch';
import { ConfirmDialog } from '../../components/shared/ConfirmDialog';
import { EmptyState } from '../../components/shared/EmptyState';
import { useEnvironmentsViewModel } from './useEnvironmentsViewModel';

interface EnvironmentsViewProps {
  embeddedProjectId?: string;
}

export const EnvironmentsView: React.FC<EnvironmentsViewProps> = ({ embeddedProjectId }) => {
  const {
    project,
    activeProjectId,
    environments,
    form,
    isFormOpen,
    setIsFormOpen,
    editingEnv,
    deletingEnvId,
    setDeletingEnvId,
    copiedField,
    openAddDialog,
    openEditDialog,
    onSubmitForm,
    handleCopyUrl,
    handleDelete,
    toggleEnvironmentStatus,
  } = useEnvironmentsViewModel(embeddedProjectId);

  const { register, handleSubmit, formState: { errors, isSubmitting } } = form;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100">
            Project Environments
          </h2>
          <p className="text-xs text-slate-500">
            Configure mock server base URLs per environment ({environments.length} total)
          </p>
        </div>

        <button
          type="button"
          onClick={openAddDialog}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded-lg shadow-xs transition-colors"
        >
          <Plus className="w-3.5 h-3.5" />
          Add Environment
        </button>
      </div>

      {/* Environment Cards List */}
      {environments.length === 0 ? (
        <EmptyState
          icon={Globe}
          title="No environments configured"
          description="Add environments like Local, Development, Staging, or Production to test mock responses against different base URLs."
          actionLabel="Add Environment"
          onAction={openAddDialog}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {environments.map((env) => (
            <div
              key={env.id}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-xs space-y-3 relative group"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100">
                      {env.name}
                    </h3>
                    <EnvironmentTypeBadge type={env.environmentType} />
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <StatusSwitch
                    checked={env.status}
                    onCheckedChange={() => toggleEnvironmentStatus(env.id)}
                    size="sm"
                  />
                  <button
                    onClick={() => openEditDialog(env)}
                    className="p-1 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded"
                    title="Edit Environment"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => setDeletingEnvId(env.id)}
                    className="p-1 text-slate-400 hover:text-rose-600 rounded"
                    title="Delete Environment"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Public Base URL */}
              <div className="space-y-1 bg-slate-50 dark:bg-slate-950 p-2.5 rounded-lg border border-slate-100 dark:border-slate-800 font-mono text-xs">
                <div className="flex items-center justify-between text-[10px] text-slate-400 uppercase font-sans">
                  <span>Public Base Mock URL</span>
                  <button
                    type="button"
                    onClick={() => handleCopyUrl(env.publicBaseUrl, `pub-${env.id}`)}
                    className="inline-flex items-center gap-1 text-indigo-600 dark:text-indigo-400 hover:underline"
                  >
                    {copiedField === `pub-${env.id}` ? (
                      <Check className="w-3 h-3 text-emerald-500" />
                    ) : (
                      <Copy className="w-3 h-3" />
                    )}
                    Copy
                  </button>
                </div>
                <p className="font-semibold text-indigo-600 dark:text-indigo-400 truncate">
                  {env.publicBaseUrl}
                </p>
              </div>

              {/* Origin Base URL */}
              {env.originBaseUrl && (
                <div className="space-y-1 bg-slate-50 dark:bg-slate-950 p-2.5 rounded-lg border border-slate-100 dark:border-slate-800 font-mono text-xs">
                  <div className="flex items-center justify-between text-[10px] text-slate-400 uppercase font-sans">
                    <span>Target Origin URL</span>
                    <button
                      type="button"
                      onClick={() => handleCopyUrl(env.originBaseUrl!, `orig-${env.id}`)}
                      className="inline-flex items-center gap-1 text-slate-500 hover:underline"
                    >
                      {copiedField === `orig-${env.id}` ? (
                        <Check className="w-3 h-3 text-emerald-500" />
                      ) : (
                        <Copy className="w-3 h-3" />
                      )}
                      Copy
                    </button>
                  </div>
                  <p className="text-slate-700 dark:text-slate-300 truncate">{env.originBaseUrl}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Form Dialog */}
      <Dialog.Root open={isFormOpen} onOpenChange={setIsFormOpen}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs z-50" />
          <Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-2xl z-50 space-y-4 focus:outline-none">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <Dialog.Title className="text-base font-semibold text-slate-900 dark:text-slate-100">
                {editingEnv ? 'Edit Environment' : 'Add Environment'}
              </Dialog.Title>
              <button onClick={() => setIsFormOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit(onSubmitForm)} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Environment Name *
                </label>
                <input
                  type="text"
                  {...register('name')}
                  placeholder="e.g. Local, Development"
                  className="w-full px-3 py-1.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-900 dark:text-slate-100 focus:outline-none focus:border-indigo-500"
                />
                {errors.name && <p className="text-rose-500 text-[11px] mt-1">{errors.name.message}</p>}
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Environment Type
                </label>
                <select
                  {...register('environmentType')}
                  className="w-full px-3 py-1.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-900 dark:text-slate-100 focus:outline-none focus:border-indigo-500 font-mono"
                >
                  <option value="LOCAL">LOCAL</option>
                  <option value="DEVELOPMENT">DEVELOPMENT</option>
                  <option value="STAGING">STAGING</option>
                  <option value="PRODUCTION">PRODUCTION</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Public Base URL *
                </label>
                <input
                  type="text"
                  {...register('publicBaseUrl')}
                  placeholder="http://localhost:3000"
                  className="w-full px-3 py-1.5 font-mono bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-900 dark:text-slate-100 focus:outline-none focus:border-indigo-500"
                />
                {errors.publicBaseUrl && (
                  <p className="text-rose-500 text-[11px] mt-1">{errors.publicBaseUrl.message}</p>
                )}
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Origin Base URL (Optional)
                </label>
                <input
                  type="text"
                  {...register('originBaseUrl')}
                  placeholder="https://api.example.com"
                  className="w-full px-3 py-1.5 font-mono bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-900 dark:text-slate-100 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="flex items-center justify-between pt-2">
                <label className="font-semibold text-slate-700 dark:text-slate-300">Enabled</label>
                <input
                  type="checkbox"
                  {...register('status')}
                  className="w-4 h-4 text-indigo-600 rounded border-slate-300 dark:border-slate-700"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsFormOpen(false)}
                  className="px-3.5 py-1.5 font-medium text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 rounded-md"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-1.5 font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded-md transition-colors"
                >
                  {editingEnv ? 'Save Changes' : 'Add Environment'}
                </button>
              </div>
            </form>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>

      {/* Confirm Delete */}
      <ConfirmDialog
        isOpen={!!deletingEnvId}
        onClose={() => setDeletingEnvId(null)}
        onConfirm={handleDelete}
        title="Delete Environment?"
        description="Are you sure you want to delete this environment configuration?"
        confirmLabel="Delete"
        variant="danger"
      />
    </div>
  );
};

export default EnvironmentsView;
