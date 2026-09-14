'use client';


import { useEffect, useState } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useUIStore } from '@/src/client/presentation/stores/uiStore';
import { usePageLoadingOverlay } from '@/src/client/presentation/components/shared/PageLoadingOverlay';
import { Project } from '@/src/client/domain/project/entity/project';
import { ProjectUseCase } from '@/src/client/domain/project/usecase/project_usecase';
import { getService, CLIENT_DI_TOKENS } from '@/src/core/di';
import { getErrorMessage } from '@/src/core/utils/error';

import { Account } from '@/src/client/domain/account/entity/account';

const projectSchema = z.object({
  name: z.string().min(3, 'Project name must be at least 3 characters'),
  description: z.string().optional(),
  picIds: z.array(z.string()).optional(),
  status: z.boolean(),
});

type ProjectFormValues = z.infer<typeof projectSchema>;

export function useProjects(customUseCase?: ProjectUseCase, initialProjects: Project[] = []) {
  const projectUseCase = customUseCase || getService(CLIENT_DI_TOKENS.projectUseCase);
  const [projects, setProjects] = useState<Project[]>(initialProjects);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const { addToast } = useUIStore();
  const pageLoading = usePageLoadingOverlay();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const shouldOpenAddDialog = searchParams.get('new') === 'true';

  const reloadProjects = async () => {
    try {
      const data = await projectUseCase.getAll();
      setProjects(data);
    } catch {
      // fallback
    }
  };

  const loadAccounts = async () => {
    if (accounts.length > 0) return;
    try {
      const res = await fetch('/api/accounts');
      if (res.ok) {
        const data = await res.json();
        if (data.accounts) {
          setAccounts(data.accounts);
        }
      }
    } catch {
      // ignore
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
      picIds: [],
      status: true,
    },
  });

  useEffect(() => {
    if (shouldOpenAddDialog) {
      openAddDialog();
      router.replace(pathname);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname, shouldOpenAddDialog]);

  const openAddDialog = () => {
    void loadAccounts();
    setEditingProject(null);
    form.reset({ name: '', description: '', picIds: [], status: true });
    setIsFormOpen(true);
  };

  const openEditDialog = (p: Project) => {
    void loadAccounts();
    setEditingProject(p);
    const picIds = p.picIds || (p.pics ? p.pics.map((x) => x.id) : []);
    form.reset({ name: p.name, description: p.description || '', picIds, status: p.status });
    setIsFormOpen(true);
  };

  const onSubmitForm = async (data: ProjectFormValues) => {
    await pageLoading.run(
      {
        title: editingProject ? `Menyimpan perubahan "${data.name}"` : `Membuat project "${data.name}"`,
        description: editingProject
          ? 'Nama, deskripsi, dan status project sedang diperbarui.'
          : 'Project baru sedang dibuat dan akan muncul di daftar project.',
      },
      async () => {
        try {
          if (editingProject) {
            await projectUseCase.update(editingProject.id, {
              name: data.name,
              description: data.description,
              picIds: data.picIds || [],
              status: data.status,
            });
            addToast({ type: 'success', title: 'Project Updated', description: `Updated project "${data.name}"` });
          } else {
            const created = await projectUseCase.create({
              name: data.name,
              description: data.description,
              picIds: data.picIds || [],
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
      }
    );
  };

  const handleDuplicate = async (p: Project) => {
    await pageLoading.run(
      {
        title: `Menyalin project "${p.name}"`,
        description: 'Salinan project beserta konfigurasinya sedang dibuat.',
      },
      async () => {
        try {
          const dup = await projectUseCase.duplicate(p.id);
          if (!dup) return;
          await reloadProjects();
          addToast({ type: 'success', title: 'Project Duplicated', description: `Created copy "${dup.name}"` });
        } catch (error: unknown) {
          addToast({ type: 'error', title: 'Duplicate Failed', description: getErrorMessage(error) });
        }
      }
    );
  };

  const handleSoftDelete = async (id: string) => {
    const targetProject = projects.find((project) => project.id === id);
    await pageLoading.run(
      {
        title: `Memindahkan${targetProject ? ` "${targetProject.name}"` : ' project'} ke trash`,
        description: 'Project masih bisa dipulihkan dari filter Deleted.',
      },
      async () => {
        try {
          await projectUseCase.softDelete(id);
          await reloadProjects();
          addToast({ type: 'info', title: 'Project Moved to Trash', description: 'Project has been soft deleted.' });
        } catch (error: unknown) {
          addToast({ type: 'error', title: 'Delete Failed', description: getErrorMessage(error) });
        }
      }
    );
  };

  const handleRestore = async (id: string) => {
    const targetProject = projects.find((project) => project.id === id);
    await pageLoading.run(
      {
        title: `Memulihkan${targetProject ? ` "${targetProject.name}"` : ' project'}`,
        description: 'Project sedang dikembalikan agar bisa digunakan lagi.',
      },
      async () => {
        try {
          await projectUseCase.restore(id);
          await reloadProjects();
          addToast({ type: 'success', title: 'Project Restored', description: 'Project restored successfully.' });
        } catch (error: unknown) {
          addToast({ type: 'error', title: 'Restore Failed', description: getErrorMessage(error) });
        }
      }
    );
  };

  const handleConfirmHardDelete = async () => {
    if (!deletingProject) return;
    await pageLoading.run(
      {
        title: `Menghapus permanen "${deletingProject.name}"`,
        description: 'Project dan endpoint di dalamnya akan dihapus permanen.',
      },
      async () => {
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
      }
    );
  };

  const toggleProjectStatus = async (id: string) => {
    const targetProject = projects.find((project) => project.id === id);
    await pageLoading.run(
      {
        title: `${targetProject?.status ? 'Menonaktifkan' : 'Mengaktifkan'} project${targetProject ? ` "${targetProject.name}"` : ''}`,
        description: targetProject?.status
          ? 'Project tidak akan aktif sampai diaktifkan kembali.'
          : 'Project akan aktif dan bisa dipakai kembali.',
      },
      async () => {
        await projectUseCase.toggleStatus(id);
        await reloadProjects();
      }
    );
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
    accounts,
  };
}