'use client';

import { useEffect, useState } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useUIStore } from '@/src/presentation/stores/uiStore';
import { Project } from '@/src/domain/project/entity/project';
import { ProjectUseCase } from '@/src/domain/project/usecase/project_usecase';
import { getErrorMessage } from '@/src/core/utils/error';

const projectSchema = z.object({
  name: z.string().min(3, 'Project name must be at least 3 characters'),
  description: z.string().optional(),
  status: z.boolean(),
});

type ProjectFormValues = z.infer<typeof projectSchema>;

export function useProjects(projectUseCase: ProjectUseCase, initialProjects: Project[] = []) {
  const [projects, setProjects] = useState<Project[]>(initialProjects);
  const { addToast } = useUIStore();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const reloadProjects = async () => {
    try {
      const data = await projectUseCase.getAll();
      setProjects(data);
    } catch {
      // fallback
    }
  };

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'INACTIVE' | 'DELETED'>('ALL');
  const [sortBy, setSortBy] = useState<'name' | 'date'>('date');
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [deletingProject, setDeletingProject] = useState<{ id: string; name: string; isPermanent: boolean } | null>(null);

  const form = useForm<ProjectFormValues>({
    resolver: zodResolver(projectSchema),
    defaultValues: {
      name: '',
      description: '',
      status: true,
    },
  });

  useEffect(() => {
    if (searchParams.get('new') === 'true') {
      openAddDialog();
      router.replace(pathname);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname, router, searchParams]);

  const openAddDialog = () => {
    setEditingProject(null);
    form.reset({ name: '', description: '', status: true });
    setIsFormOpen(true);
  };

  const openEditDialog = (p: Project) => {
    setEditingProject(p);
    form.reset({ name: p.name, description: p.description || '', status: p.status });
    setIsFormOpen(true);
  };

  const onSubmitForm = async (data: ProjectFormValues) => {
    try {
      if (editingProject) {
        await projectUseCase.update(editingProject.id, {
          name: data.name,
          description: data.description,
          status: data.status,
        });
        addToast({ type: 'success', title: 'Project Updated', description: `Updated project "${data.name}"` });
      } else {
        const created = await projectUseCase.create({
          name: data.name,
          description: data.description,
          status: data.status,
        });
        addToast({ type: 'success', title: 'Project Created', description: `Created new project "${created.name}"` });
      }
      await reloadProjects();
      setIsFormOpen(false);
    } catch (error: unknown) {
      addToast({
        type: 'error',
        title: 'Operation Failed',
        description: getErrorMessage(error, 'Failed to save project'),
      });
    }
  };

  const handleDuplicate = async (p: Project) => {
    try {
      const dup = await projectUseCase.duplicate(p.id);
      if (!dup) return;
      await reloadProjects();
      addToast({ type: 'success', title: 'Project Duplicated', description: `Created copy "${dup.name}"` });
    } catch (error: unknown) {
      addToast({ type: 'error', title: 'Duplicate Failed', description: getErrorMessage(error) });
    }
  };

  const handleSoftDelete = async (id: string) => {
    await projectUseCase.softDelete(id);
    await reloadProjects();
    addToast({ type: 'info', title: 'Project Moved to Trash', description: 'Project has been soft deleted.' });
  };

  const handleRestore = async (id: string) => {
    await projectUseCase.restore(id);
    await reloadProjects();
    addToast({ type: 'success', title: 'Project Restored', description: 'Project restored successfully.' });
  };

  const handleConfirmHardDelete = async () => {
    if (!deletingProject) return;
    try {
      await projectUseCase.hardDelete(deletingProject.id);
      await reloadProjects();
      addToast({ type: 'success', title: 'Project Permanently Deleted', description: 'Project and all endpoints removed.' });
    } catch (error: unknown) {
      addToast({
        type: 'error',
        title: 'Delete Failed',
        description: getErrorMessage(error, 'Failed to permanently delete project'),
      });
    } finally {
      setDeletingProject(null);
    }
  };

  const toggleProjectStatus = async (id: string) => {
    await projectUseCase.toggleStatus(id);
    await reloadProjects();
  };

  const filteredProjects = projects
    .filter((p) => {
      const matchesSearch =
        p.name.toLowerCase().includes(search.toLowerCase()) ||
        (p.description && p.description.toLowerCase().includes(search.toLowerCase()));

      if (statusFilter === 'DELETED') return matchesSearch && !!p.deletedAt;
      if (p.deletedAt) return false;

      if (statusFilter === 'ACTIVE') return matchesSearch && p.status;
      if (statusFilter === 'INACTIVE') return matchesSearch && !p.status;
      return matchesSearch;
    })
    .sort((a, b) => {
      if (sortBy === 'name') return a.name.localeCompare(b.name);
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

  return {
    router,
    search,
    setSearch,
    statusFilter,
    setStatusFilter,
    sortBy,
    setSortBy,
    viewMode,
    setViewMode,
    isFormOpen,
    setIsFormOpen,
    editingProject,
    deletingProject,
    setDeletingProject,
    form,
    openAddDialog,
    openEditDialog,
    onSubmitForm,
    handleDuplicate,
    handleSoftDelete,
    handleRestore,
    handleConfirmHardDelete,
    filteredProjects,
    toggleProjectStatus,
  };
}
