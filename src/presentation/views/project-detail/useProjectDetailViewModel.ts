import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useUIStore } from '@/src/presentation/stores/uiStore';
import { ProjectRemoteRepository } from '@/src/data/project/repository/project_repository';
import { Project } from '@/src/domain/project/entity/project';

const projectRepo = new ProjectRemoteRepository();

export function useProjectDetailViewModel() {
  const { projectId } = useParams<{ projectId: string }>();
  const router = useRouter();
  const { addToast } = useUIStore();
  const [activeTab, setActiveTab] = useState('apis');
  const [project, setProject] = useState<Project | null>(null);

  const reloadProject = async () => {
    if (!projectId) return;
    try {
      const p = await projectRepo.getById(projectId);
      setProject(p);
    } catch {
      // fallback
    }
  };

  useEffect(() => {
    reloadProject();
  }, [projectId]);

  const toggleProjectStatus = async (id: string) => {
    if (!project) return;
    await projectRepo.update(id, { status: !project.status });
    await reloadProject();
  };

  const handleSoftDelete = async () => {
    if (!project) return;
    await projectRepo.softDelete(project.id);
    addToast({ type: 'info', title: 'Project Soft Deleted', description: 'Moved project to trash.' });
    router.push('/projects');
  };

  return {
    projectId,
    project,
    router,
    activeTab,
    setActiveTab,
    handleSoftDelete,
    toggleProjectStatus,
  };
}
