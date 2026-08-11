'use client';

import React from 'react';
import { Layers, Folder, Edit3, Trash2, ChevronDown, ChevronRight } from 'lucide-react';
import { ConfirmDialog } from '../../components/shared/ConfirmDialog';
import { EmptyState } from '../../components/shared/EmptyState';
import {  createApiUseCase  } from '@/src/di/usecase_provider';
import {  createCollectionUseCase  } from '@/src/di/usecase_provider';
import { Collection } from '@/src/domain/collection/entity/collection';
import { useApiCollections } from './useApiCollections';
import { ROUTES } from '@/src/core/constants/routes';
import { API_COLLECTIONS_TEXT, API_COLLECTIONS_SEMANTIC_ID } from './constant';
import {
  ApiCollectionHeader,
  ApiCollectionFilterBar,
  ApiCollectionListItem,
  ApiCollectionFormModal,
  CollectionFormModal,
} from './components';

interface ApiCollectionsViewProps {
  embeddedProjectId?: string;
  initialApis?: import('@/src/domain/api/entity/api_collection').ApiCollection[];
  initialCollections?: Collection[];
}

export const ApiCollectionsView: React.FC<ApiCollectionsViewProps> = ({
  embeddedProjectId,
  initialApis = [],
  initialCollections = [],
}) => {
  const apiUseCase = createApiUseCase();
  const collectionUseCase = createCollectionUseCase();

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

    // Collection States & Handlers
    collections,
    isCollectionFormOpen,
    setIsCollectionFormOpen,
    editingCollection,
    deletingCollectionId,
    setDeletingCollectionId,
    collectionName,
    setCollectionName,
    collectionDesc,
    setCollectionDesc,
    openAddCollectionDialog,
    openEditCollectionDialog,
    onSubmitCollectionForm,
    handleDeleteCollection,
  } = useApiCollections(apiUseCase, collectionUseCase, embeddedProjectId, initialApis, initialCollections);

  const [collapsedCollections, setCollapsedCollections] = React.useState<Record<string, boolean>>({});

  const toggleCollectionCollapse = (id: string) => {
    setCollapsedCollections((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  // Group APIs by Collection ID
  const groupedApisMap = new Map<string, typeof filteredApis>();
  const ungroupedApis: typeof filteredApis = [];

  filteredApis.forEach((api) => {
    if (api.collectionId) {
      const group = groupedApisMap.get(api.collectionId) || [];
      group.push(api);
      groupedApisMap.set(api.collectionId, group);
    } else {
      ungroupedApis.push(api);
    }
  });

  const hasNoItems = filteredApis.length === 0 && collections.length === 0;

  return (
    <div id={API_COLLECTIONS_SEMANTIC_ID.CONTAINER} className="space-y-6">
      <ApiCollectionHeader
        totalCount={apis.length}
        activeProjectId={activeProjectId}
        onAddClick={openAddDialog}
        onAddCollectionClick={openAddCollectionDialog}
      />

      <ApiCollectionFilterBar
        search={search}
        onSearchChange={setSearch}
        methodFilter={methodFilter}
        onMethodFilterChange={setMethodFilter}
        statusFilter={statusFilter}
        onStatusFilterChange={setStatusFilter}
      />

      {hasNoItems ? (
        <EmptyState
          icon={Layers}
          title={API_COLLECTIONS_TEXT.NO_ENDPOINTS}
          description={
            search
              ? `No API endpoint definitions matching "${search}"`
              : 'Add an API Collection endpoint or create a Folder to organize your project endpoints.'
          }
          actionLabel={API_COLLECTIONS_TEXT.ADD_COLLECTION_BTN}
          onAction={openAddDialog}
        />
      ) : (
        <div id={API_COLLECTIONS_SEMANTIC_ID.LIST} className="space-y-6">
          {/* Grouped Folders/Collections */}
          {collections.map((col) => {
            const apisForCol = groupedApisMap.get(col.id) || [];
            const isCollapsed = collapsedCollections[col.id];
            
            // If filtering/searching, skip empty folders
            if (search && apisForCol.length === 0) return null;

            return (
              <div
                key={col.id}
                className="bg-slate-50 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800/80 rounded-xl p-4 space-y-3"
              >
                <div 
                  onClick={() => toggleCollectionCollapse(col.id)}
                  className="flex items-center justify-between cursor-pointer select-none hover:bg-slate-100/50 dark:hover:bg-slate-800/30 p-1.5 rounded-lg transition-colors"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="p-1 bg-indigo-50 dark:bg-indigo-950/50 rounded flex items-center justify-center shrink-0">
                      {isCollapsed ? (
                        <ChevronRight className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                      ) : (
                        <ChevronDown className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <Folder className="w-4 h-4 text-slate-400 dark:text-slate-500 shrink-0" />
                      <div>
                        <h3 className="text-xs font-bold text-slate-800 dark:text-slate-200">
                          {col.name}
                        </h3>
                        {col.description && (
                          <p className="text-[10px] text-slate-500 dark:text-slate-400">
                            {col.description}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        openEditCollectionDialog(col);
                      }}
                      className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded transition-colors"
                      title="Edit Folder"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setDeletingCollectionId(col.id);
                      }}
                      className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/20 rounded transition-colors"
                      title="Delete Folder"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {!isCollapsed && (
                  <div className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800/60 rounded-lg overflow-hidden divide-y divide-slate-100 dark:divide-slate-800">
                    {apisForCol.length === 0 ? (
                      <div className="py-6 text-center text-xs text-slate-400 italic">
                        Empty Folder. Edit an endpoint to add it here.
                      </div>
                    ) : (
                      apisForCol.map((api) => (
                        <ApiCollectionListItem
                          key={api.id}
                          api={api}
                          onNavigateDetail={() => router.push(ROUTES.API_DETAIL(api.projectId, api.id))}
                          onToggleStatus={toggleApiCollectionStatus}
                          onEdit={openEditDialog}
                          onDuplicate={handleDuplicate}
                          onDeleteRequest={(id) => setDeletingApiId(id)}
                        />
                      ))
                    )}
                  </div>
                )}
              </div>
            );
          })}

          {/* Ungrouped Endpoints Section */}
          {ungroupedApis.length > 0 && (
            <div className="space-y-2">
              {collections.length > 0 && (
                <h4 className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider pl-1">
                  Ungrouped Endpoints
                </h4>
              )}
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-xs">
                <div className="divide-y divide-slate-100 dark:divide-slate-800">
                  {ungroupedApis.map((api) => (
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
            </div>
          )}

          {/* Fallback if all endpoints are filtered out but empty folders are hidden */}
          {filteredApis.length === 0 && (
            <EmptyState
              icon={Layers}
              title={API_COLLECTIONS_TEXT.NO_ENDPOINTS}
              description={`No API endpoint definitions matching "${search}"`}
              actionLabel={API_COLLECTIONS_TEXT.ADD_COLLECTION_BTN}
              onAction={openAddDialog}
            />
          )}
        </div>
      )}

      {/* Endpoint Form Modal */}
      <ApiCollectionFormModal
        isOpen={isFormOpen}
        onOpenChange={setIsFormOpen}
        editingApi={editingApi}
        form={form}
        onSubmit={onSubmitForm}
        collections={collections}
      />

      {/* Collection Form Modal */}
      <CollectionFormModal
        isOpen={isCollectionFormOpen}
        onOpenChange={setIsCollectionFormOpen}
        editingCollection={editingCollection}
        name={collectionName}
        onNameChange={setCollectionName}
        description={collectionDesc}
        onDescriptionChange={setCollectionDesc}
        onSubmit={onSubmitCollectionForm}
      />

      {/* Delete API Confirm */}
      <ConfirmDialog
        isOpen={!!deletingApiId}
        onClose={() => setDeletingApiId(null)}
        onConfirm={handleDelete}
        title={API_COLLECTIONS_TEXT.DELETE_DIALOG_TITLE}
        description={API_COLLECTIONS_TEXT.DELETE_DIALOG_DESC}
        confirmLabel={API_COLLECTIONS_TEXT.DELETE_DIALOG_CONFIRM}
        variant="danger"
      />

      {/* Delete Collection Confirm */}
      <ConfirmDialog
        isOpen={!!deletingCollectionId}
        onClose={() => setDeletingCollectionId(null)}
        onConfirm={handleDeleteCollection}
        title="Delete Folder"
        description="Are you sure you want to delete this folder? The APIs inside will not be deleted, but will become ungrouped."
        confirmLabel="Delete Folder"
        variant="danger"
      />
    </div>
  );
};

export default ApiCollectionsView;
