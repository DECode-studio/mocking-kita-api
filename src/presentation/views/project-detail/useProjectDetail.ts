import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useUIStore } from '@/src/presentation/stores/uiStore';
import { Project } from '@/src/domain/project/entity/project';
import { ProjectUseCase } from '@/src/domain/project/usecase/project_usecase';
import { ROUTES } from '@/src/core/constants/routes';

export function useProjectDetail(projectUseCase: ProjectUseCase, initialProject: Project | null = null) {
  const { projectId } = useParams<{ projectId: string }>();
  const router = useRouter();
  const { addToast } = useUIStore();
  const [activeTab, setActiveTab] = useState('apis');
  const [project, setProject] = useState<Project | null>(initialProject);
  const [isLoading] = useState(false);

  const reloadProject = async () => {
    if (!projectId) return;
    try {
      const p = await projectUseCase.getById(projectId);
      setProject(p);
    } catch {
      // fallback
    }
  };

  const toggleProjectStatus = async (id: string) => {
    if (!project) return;
    await projectUseCase.toggleStatus(id);
    await reloadProject();
  };

  const handleSoftDelete = async () => {
    if (!project) return;
    await projectUseCase.softDelete(project.id);
    addToast({ type: 'info', title: 'Project Soft Deleted', description: 'Moved project to trash.' });
    router.push(ROUTES.PROJECTS);
  };

  return {
    projectId,
    project,
    isLoading,
    router,
    activeTab,
    setActiveTab,
    handleSoftDelete,
    toggleProjectStatus,
  };
}
