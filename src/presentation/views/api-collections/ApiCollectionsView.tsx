'use client';

import React from 'react';
import { Layers } from 'lucide-react';
import { ConfirmDialog } from '../../components/shared/ConfirmDialog';
import { EmptyState } from '../../components/shared/EmptyState';
import { createApiUseCase } from '@/src/domain/api';
import { useApiCollectionsViewModel } from './view_model/useApiCollectionsViewModel';
import { ROUTES } from '@/src/core/constants/routes';
import {
  ApiCollectionHeader,
  ApiCollectionFilterBar,
  ApiCollectionListItem,
  ApiCollectionFormModal,
} from './components';

interface ApiCollectionsViewProps {
  embeddedProjectId?: string;
  initialApis?: import('@/src/domain/api/entity/api_collection').ApiCollection[];
}

export const ApiCollectionsView: React.FC<ApiCollectionsViewProps> = ({ embeddedProjectId, initialApis = [] }) => {
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
  } = useApiCollectionsViewModel(apiUseCase, embeddedProjectId, initialApis);

  return (
    <div className="space-y-4">
      <ApiCollectionHeader
        totalCount={apis.length}
        activeProjectId={activeProjectId}
        onAddClick={openAddDialog}
      />

      <ApiCollectionFilterBar
        search={search}
        onSearchChange={setSearch}
        methodFilter={methodFilter}
        onMethodFilterChange={setMethodFilter}
        statusFilter={statusFilter}
        onStatusFilterChange={setStatusFilter}
      />

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
            {filteredApis.map((api) => (
              <ApiCollectionListItem
                key={api.id}
                api={api}
                onNavigateDetail={() => router.push(ROUTES.API_DETAIL(api.projectId, api.id))}
                onToggleStatus={toggleApiCollectionStatus}
                onEdit={openEditDialog}
                onDuplicate={handleDuplicate}
                onDeleteRequest={(id) => setDeletingApiId(id)}
              />
            ))}
          </div>
        </div>
      )}

      <ApiCollectionFormModal
        isOpen={isFormOpen}
        onOpenChange={setIsFormOpen}
        editingApi={editingApi}
        form={form}
        onSubmit={onSubmitForm}
      />

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
