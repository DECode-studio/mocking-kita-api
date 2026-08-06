'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useEffect } from 'react';
import { useUIStore } from '@/src/presentation/stores/uiStore';
import { ApiCollection } from '@/src/domain/api/entity/api_collection';
import { ApiUseCase } from '@/src/domain/api/usecase/api_usecase';
import { Collection } from '@/src/domain/collection/entity/collection';
import { CollectionUseCase } from '@/src/domain/collection/usecase/collection_usecase';
import { getErrorMessage } from '@/src/core/utils/error';

const apiSchema = z.object({
  name: z.string().min(2, 'Endpoint name is required'),
  description: z.string().optional(),
  path: z.string().min(1, 'Path is required').refine((p) => p.startsWith('/'), {
    message: 'Path must start with a slash (e.g. /api/users)',
  }),
  methodRequest: z.enum(['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS', 'HEAD']),
  status: z.boolean(),
  collectionId: z.string().nullable().optional(),
});

type ApiFormValues = z.infer<typeof apiSchema>;

export function useApiCollectionsViewModel(
  apiUseCase: ApiUseCase,
  collectionUseCase: CollectionUseCase,
  embeddedProjectId?: string,
  initialApis: ApiCollection[] = [],
  initialCollections: Collection[] = []
) {
  const { addToast } = useUIStore();
  const router = useRouter();

  const activeProjectId = embeddedProjectId;
  const [apis, setApis] = useState<ApiCollection[]>(initialApis);
  const [collections, setCollections] = useState<Collection[]>(initialCollections);
  const [search, setSearch] = useState('');
  const [methodFilter, setMethodFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'INACTIVE'>('ALL');
  
  // Api Dialog States
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingApi, setEditingApi] = useState<ApiCollection | null>(null);
  const [deletingApiId, setDeletingApiId] = useState<string | null>(null);

  // Collection Dialog States
  const [isCollectionFormOpen, setIsCollectionFormOpen] = useState(false);
  const [editingCollection, setEditingCollection] = useState<Collection | null>(null);
  const [deletingCollectionId, setDeletingCollectionId] = useState<string | null>(null);
  const [collectionName, setCollectionName] = useState('');
  const [collectionDesc, setCollectionDesc] = useState('');

  const form = useForm<ApiFormValues>({
    resolver: zodResolver(apiSchema),
    defaultValues: {
      name: '',
      description: '',
      path: '/api/',
      methodRequest: 'GET',
      status: true,
      collectionId: null,
    },
  });

  const openAddDialog = () => {
    setEditingApi(null);
    form.reset({
      name: '',
      description: '',
      path: '/api/',
      methodRequest: 'GET',
      status: true,
      collectionId: null,
    });
    setIsFormOpen(true);
  };

  const openEditDialog = (api: ApiCollection) => {
    setEditingApi(api);
    form.reset({
      name: api.name,
      description: api.description || '',
      path: api.path,
      methodRequest: api.methodRequest,
      status: api.status,
      collectionId: api.collectionId || null,
    });
    setIsFormOpen(true);
  };

  const reloadApis = async () => {
    if (!activeProjectId) return;
    try {
      const data = await apiUseCase.load(activeProjectId);
      setApis(data.apis);
    } catch {
      // fallback
    }
  };

  const reloadCollections = async () => {
    if (!activeProjectId) return;
    try {
      const list = await collectionUseCase.getByProjectId(activeProjectId);
      setCollections(list);
    } catch {
      // fallback
    }
  };

  useEffect(() => {
    if (activeProjectId) {
      reloadApis();
      reloadCollections();
    }
  }, [activeProjectId]);

  const toggleApiCollectionStatus = async (id: string) => {
    await apiUseCase.toggleStatus(id);
    await reloadApis();
  };

  const onSubmitForm = async (data: ApiFormValues) => {
    if (!activeProjectId) return;

    const duplicate = apis.find(
      (a) => a.path.toLowerCase() === data.path.toLowerCase() && a.methodRequest === data.methodRequest && a.id !== editingApi?.id
    );

    if (duplicate) {
      addToast({
        type: 'error',
        title: 'Duplicate Endpoint Definition',
        description: `An endpoint with ${data.methodRequest} ${data.path} already exists in this project.`,
      });
      return;
    }

    try {
      if (editingApi) {
        await apiUseCase.update(editingApi.id, {
          name: data.name,
          description: data.description,
          path: data.path,
          methodRequest: data.methodRequest,
          status: data.status,
          collectionId: data.collectionId || null,
        });
        addToast({ type: 'success', title: 'API Updated', description: `Updated ${data.methodRequest} ${data.path}` });
      } else {
        await apiUseCase.create({
          projectId: activeProjectId,
          name: data.name,
          description: data.description,
          path: data.path,
          methodRequest: data.methodRequest,
          status: data.status,
          collectionId: data.collectionId || null,
        });
        addToast({ type: 'success', title: 'API Endpoint Added', description: `Created ${data.methodRequest} ${data.path}` });
      }
      await reloadApis();
      setIsFormOpen(false);
    } catch (error: unknown) {
      addToast({
        type: 'error',
        title: 'Error',
        description: getErrorMessage(error, 'Failed to save API'),
      });
    }
  };

  const handleDuplicate = async (api: ApiCollection) => {
    try {
      const dup = await apiUseCase.duplicate(api.id);
      if (!dup) return;
      await reloadApis();
      addToast({ type: 'success', title: 'API Duplicated', description: `Created copy "${dup.name}"` });
    } catch (error: unknown) {
      addToast({ type: 'error', title: 'Duplicate Error', description: getErrorMessage(error) });
    }
  };

  const handleDelete = async () => {
    if (!deletingApiId) return;
    await apiUseCase.softDelete(deletingApiId);
    await reloadApis();
    addToast({ type: 'success', title: 'API Endpoint Deleted', description: 'Removed API collection.' });
    setDeletingApiId(null);
  };

  // Collection CRUD Handlers
  const openAddCollectionDialog = () => {
    setEditingCollection(null);
    setCollectionName('');
    setCollectionDesc('');
    setIsCollectionFormOpen(true);
  };

  const openEditCollectionDialog = (col: Collection) => {
    setEditingCollection(col);
    setCollectionName(col.name);
    setCollectionDesc(col.description || '');
    setIsCollectionFormOpen(true);
  };

  const onSubmitCollectionForm = async () => {
    if (!activeProjectId) return;
    if (!collectionName.trim()) {
      addToast({ type: 'error', title: 'Validation Error', description: 'Folder name is required' });
      return;
    }

    try {
      if (editingCollection) {
        await collectionUseCase.update(editingCollection.id, {
          name: collectionName,
          description: collectionDesc,
        });
        addToast({ type: 'success', title: 'Folder Updated', description: `Folder "${collectionName}" updated` });
      } else {
        await collectionUseCase.create({
          projectId: activeProjectId,
          name: collectionName,
          description: collectionDesc,
          status: true,
        });
        addToast({ type: 'success', title: 'Folder Created', description: `Folder "${collectionName}" created` });
      }
      await reloadCollections();
      setIsCollectionFormOpen(false);
    } catch (error) {
      addToast({ type: 'error', title: 'Error', description: getErrorMessage(error, 'Failed to save Folder') });
    }
  };

  const handleDeleteCollection = async () => {
    if (!deletingCollectionId) return;
    try {
      await collectionUseCase.softDelete(deletingCollectionId);
      await reloadCollections();
      await reloadApis();
      addToast({ type: 'success', title: 'Folder Deleted', description: 'Folder has been removed.' });
      setDeletingCollectionId(null);
    } catch (error) {
      addToast({ type: 'error', title: 'Error', description: getErrorMessage(error) });
    }
  };

  const filteredApis = apis.filter((api) => {
    const matchesSearch =
      api.name.toLowerCase().includes(search.toLowerCase()) ||
      api.path.toLowerCase().includes(search.toLowerCase());

    const matchesMethod = methodFilter === 'ALL' || api.methodRequest === methodFilter;
    const matchesStatus =
      statusFilter === 'ALL' ||
      (statusFilter === 'ACTIVE' && api.status) ||
      (statusFilter === 'INACTIVE' && !api.status);

    return matchesSearch && matchesMethod && matchesStatus;
  });

  return {
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

    // Collection Exports
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
  };
}
