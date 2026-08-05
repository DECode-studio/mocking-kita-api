'use client';

import React from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import {
  Layers,
  Plus,
  Search,
  MoreVertical,
  Copy,
  Trash2,
  Edit2,
  X,
  ArrowRight,
  Code2,
  FileCode,
} from 'lucide-react';
import { HttpMethodBadge } from '../../components/shared/HttpMethodBadge';
import { StatusBadge } from '../../components/shared/StatusBadge';
import { StatusSwitch } from '../../components/shared/StatusSwitch';
import { ConfirmDialog } from '../../components/shared/ConfirmDialog';
import { EmptyState } from '../../components/shared/EmptyState';
import { createApiUseCase } from '@/src/domain/api';
import { useApiCollectionsViewModel } from './useApiCollectionsViewModel';
import { ROUTES } from '@/src/core/constants/routes';

interface ApiCollectionsViewProps {
  embeddedProjectId?: string;
}

export const ApiCollectionsView: React.FC<ApiCollectionsViewProps> = ({ embeddedProjectId }) => {
  const apiUseCase = createApiUseCase();
  const {
    router,
    activeProjectId,
    search,
    setSearch,
    methodFilter,
    setMethodFilter,
    statusFilter,
    setStatusFilter,
    isFormOpen,
    setIsFormOpen,
    editingApi,
    deletingApiId,
    setDeletingApiId,
    form,
    apis,
    filteredApis,
    openAddDialog,
    openEditDialog,
    onSubmitForm,
    handleDuplicate,
    handleDelete,
    toggleApiCollectionStatus,
  } = useApiCollectionsViewModel(apiUseCase, embeddedProjectId);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = form;

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100">
            API Collections & Endpoints
          </h2>
          <p className="text-xs text-slate-500">
            Define mock endpoint contracts and route parameters ({apis.length} total)
          </p>
        </div>

        <button
          type="button"
          onClick={openAddDialog}
          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded-lg shadow-xs transition-colors shrink-0"
        >
          <Plus className="w-4 h-4" />
          Add API Collection
        </button>
      </div>

      <div className="p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search endpoint name or path..."
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 rounded-lg border border-slate-200 dark:border-slate-800 focus:outline-none focus:border-indigo-500 font-mono"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <select
            value={methodFilter}
            onChange={(e) => setMethodFilter(e.target.value)}
            className="px-2.5 py-1 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-700 dark:text-slate-300 focus:outline-none font-mono"
          >
            <option value="ALL">Method: ALL</option>
            <option value="GET">GET</option>
            <option value="POST">POST</option>
            <option value="PUT">PUT</option>
            <option value="PATCH">PATCH</option>
            <option value="DELETE">DELETE</option>
            <option value="OPTIONS">OPTIONS</option>
            <option value="HEAD">HEAD</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) =>
              setStatusFilter(
                e.target.value === 'ACTIVE'
                  ? 'ACTIVE'
                  : e.target.value === 'INACTIVE'
                    ? 'INACTIVE'
                    : 'ALL'
              )
            }
            className="px-2.5 py-1 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-700 dark:text-slate-300 focus:outline-none font-medium"
          >
            <option value="ALL">Status: ALL</option>
            <option value="ACTIVE">Active Only</option>
            <option value="INACTIVE">Inactive Only</option>
          </select>
        </div>
      </div>

      {filteredApis.length === 0 ? (
        <EmptyState
          icon={Layers}
          title="No API collections found"
          description={
            search
              ? `No API endpoint definitions matching "${search}"`
              : 'Add an API Collection endpoint (e.g. GET /api/products) to configure request matching & response payloads.'
          }
          actionLabel="Add API Collection"
          onAction={openAddDialog}
        />
      ) : (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-xs">
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {filteredApis.map((api) => {
              return (
                <div
                  key={api.id}
                  className="p-3.5 hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors flex items-center justify-between gap-4 group"
                >
                  <div className="flex items-center gap-3.5 min-w-0 flex-1">
                    <HttpMethodBadge method={api.methodRequest} size="md" />

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span
                          onClick={() => router.push(ROUTES.API_DETAIL(api.projectId, api.id))}
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
                      onCheckedChange={() => toggleApiCollectionStatus(api.id)}
                      size="sm"
                    />

                    <button
                      onClick={() => router.push(ROUTES.API_DETAIL(api.projectId, api.id))}
                      className="inline-flex items-center gap-1 px-3 py-1 text-xs font-semibold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/60 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 rounded-md transition-colors"
                    >
                      Configure
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>

                    <DropdownMenu.Root>
                      <DropdownMenu.Trigger asChild>
                        <button className="p-1 text-slate-400 hover:text-slate-600 rounded">
                          <MoreVertical className="w-4 h-4" />
                        </button>
                      </DropdownMenu.Trigger>
                      <DropdownMenu.Portal>
                        <DropdownMenu.Content
                          align="end"
                          className="w-40 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-1 shadow-xl z-50 text-xs text-slate-700 dark:text-slate-300 space-y-0.5"
                        >
                          <DropdownMenu.Item
                            onClick={() => openEditDialog(api)}
                            className="flex items-center gap-2 px-2.5 py-1.5 rounded hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                            <span>Edit Endpoint</span>
                          </DropdownMenu.Item>
                          <DropdownMenu.Item
                            onClick={() => handleDuplicate(api)}
                            className="flex items-center gap-2 px-2.5 py-1.5 rounded hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                          >
                            <Copy className="w-3.5 h-3.5" />
                            <span>Duplicate API</span>
                          </DropdownMenu.Item>
                          <DropdownMenu.Separator className="h-px bg-slate-100 dark:bg-slate-800 my-1" />
                          <DropdownMenu.Item
                            onClick={() => setDeletingApiId(api.id)}
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
            })}
          </div>
        </div>
      )}

      <Dialog.Root open={isFormOpen} onOpenChange={setIsFormOpen}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs z-50" />
          <Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-2xl z-50 space-y-4 focus:outline-none">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <Dialog.Title className="text-base font-semibold text-slate-900 dark:text-slate-100">
                {editingApi ? 'Edit API Collection' : 'Add API Collection'}
              </Dialog.Title>
              <button onClick={() => setIsFormOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit(onSubmitForm)} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  API Name *
                </label>
                <input
                  type="text"
                  {...register('name')}
                  placeholder="e.g. Get User Profile"
                  className="w-full px-3 py-1.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-900 dark:text-slate-100 focus:outline-none focus:border-indigo-500"
                />
                {errors.name && <p className="text-rose-500 text-[11px] mt-1">{errors.name.message}</p>}
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    HTTP Method
                  </label>
                  <select
                    {...register('methodRequest')}
                    className="w-full px-2.5 py-1.5 font-mono bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-900 dark:text-slate-100 focus:outline-none focus:border-indigo-500"
                  >
                    <option value="GET">GET</option>
                    <option value="POST">POST</option>
                    <option value="PUT">PUT</option>
                    <option value="PATCH">PATCH</option>
                    <option value="DELETE">DELETE</option>
                    <option value="OPTIONS">OPTIONS</option>
                    <option value="HEAD">HEAD</option>
                  </select>
                </div>

                <div className="col-span-2">
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Endpoint Path *
                  </label>
                  <input
                    type="text"
                    {...register('path')}
                    placeholder="/api/users/:id"
                    className="w-full px-3 py-1.5 font-mono bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-900 dark:text-slate-100 focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>
              {errors.path && <p className="text-rose-500 text-[11px]">{errors.path.message}</p>}

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Description
                </label>
                <textarea
                  {...register('description')}
                  rows={2}
                  placeholder="Optional endpoint notes..."
                  className="w-full px-3 py-1.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-900 dark:text-slate-100 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="flex items-center justify-between pt-2">
                <label className="font-semibold text-slate-700 dark:text-slate-300">Enabled Status</label>
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
                  {editingApi ? 'Save Changes' : 'Create API'}
                </button>
              </div>
            </form>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>

      <ConfirmDialog
        isOpen={!!deletingApiId}
        onClose={() => setDeletingApiId(null)}
        onConfirm={handleDelete}
        title="Delete API Endpoint?"
        description="Are you sure you want to delete this API endpoint? All associated request and response scenarios will be deleted."
        confirmLabel="Delete"
        variant="danger"
      />
    </div>
  );
};

export default ApiCollectionsView;
