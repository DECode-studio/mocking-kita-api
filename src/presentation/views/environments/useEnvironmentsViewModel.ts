'use client';

import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useUIStore } from '@/src/presentation/stores/uiStore';
import { Environment } from '@/src/domain/environment/entity/environment';
import { Project } from '@/src/domain/project/entity/project';
import { EnvironmentUseCase } from '@/src/domain/environment/usecase/environment_usecase';

const environmentSchema = z.object({
  name: z.string().min(2, 'Environment name is required'),
  environmentType: z.enum(['LOCAL', 'DEVELOPMENT', 'STAGING', 'PRODUCTION']),
  publicBaseUrl: z.string().url('Please enter a valid URL (e.g. http://localhost:3000)'),
  originBaseUrl: z.string().url('Please enter a valid URL').optional().or(z.literal('')),
  status: z.boolean(),
});

type EnvironmentFormValues = z.infer<typeof environmentSchema>;

export function useEnvironmentsViewModel(environmentUseCase: EnvironmentUseCase, embeddedProjectId?: string) {
  const { addToast } = useUIStore();

  const [environments, setEnvironments] = useState<Environment[]>([]);
  const [project, setProject] = useState<Project | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingEnv, setEditingEnv] = useState<Environment | null>(null);
  const [deletingEnvId, setDeletingEnvId] = useState<string | null>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const activeProjectId = embeddedProjectId;

  const form = useForm<EnvironmentFormValues>({
    resolver: zodResolver(environmentSchema),
    defaultValues: {
      name: 'Development',
      environmentType: 'DEVELOPMENT',
      publicBaseUrl: 'https://mock-dev.example.local',
      originBaseUrl: 'https://dev-api.example.com',
      status: true,
    },
  });

  const openAddDialog = () => {
    setEditingEnv(null);
    form.reset({
      name: 'Development',
      environmentType: 'DEVELOPMENT',
      publicBaseUrl: 'https://mock-dev.example.local',
      originBaseUrl: 'https://dev-api.example.com',
      status: true,
    });
    setIsFormOpen(true);
  };

  const openEditDialog = (env: Environment) => {
    setEditingEnv(env);
    form.reset({
      name: env.name,
      environmentType: env.environmentType,
      publicBaseUrl: env.publicBaseUrl,
      originBaseUrl: env.originBaseUrl || '',
      status: env.status,
    });
    setIsFormOpen(true);
  };

  const reloadEnvironments = async () => {
    if (!activeProjectId) return;
    try {
      const data = await environmentUseCase.load(activeProjectId);
      setEnvironments(data.environments);
      setProject(data.project);
    } catch {
      // fallback
    }
  };

  useEffect(() => {
    reloadEnvironments();
  }, [activeProjectId]);

  const toggleEnvironmentStatus = async (id: string) => {
    await environmentUseCase.toggleStatus(id);
    await reloadEnvironments();
  };

  const onSubmitForm = async (data: EnvironmentFormValues) => {
    if (!activeProjectId) return;

    const duplicate = environments.find((e) => e.name.toLowerCase() === data.name.toLowerCase() && e.id !== editingEnv?.id);
    if (duplicate) {
      addToast({
        type: 'error',
        title: 'Duplicate Name',
        description: `An environment named "${data.name}" already exists in this project.`,
      });
      return;
    }

    try {
      if (editingEnv) {
        await environmentUseCase.update(editingEnv.id, {
          name: data.name,
          environmentType: data.environmentType,
          publicBaseUrl: data.publicBaseUrl,
          originBaseUrl: data.originBaseUrl || undefined,
          status: data.status,
        });
        addToast({ type: 'success', title: 'Environment Updated', description: `Updated ${data.name}` });
      } else {
        await environmentUseCase.create({
          projectId: activeProjectId,
          name: data.name,
          environmentType: data.environmentType,
          publicBaseUrl: data.publicBaseUrl,
          originBaseUrl: data.originBaseUrl || undefined,
          status: data.status,
        });
        addToast({ type: 'success', title: 'Environment Added', description: `Added ${data.name}` });
      }
      await reloadEnvironments();
      setIsFormOpen(false);
    } catch (err: any) {
      addToast({ type: 'error', title: 'Error', description: err?.message || 'Failed to save environment' });
    }
  };

  const handleCopyUrl = (url: string, fieldId: string) => {
    navigator.clipboard.writeText(url);
    setCopiedField(fieldId);
    setTimeout(() => setCopiedField(null), 2000);
    addToast({ type: 'info', title: 'Copied to Clipboard', description: url });
  };

  const handleDelete = async () => {
    if (!deletingEnvId) return;
    await environmentUseCase.softDelete(deletingEnvId);
    await reloadEnvironments();
    addToast({ type: 'success', title: 'Environment Deleted', description: 'Environment removed.' });
    setDeletingEnvId(null);
  };

  return {
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
  };
}
