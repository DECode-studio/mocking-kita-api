import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useUIStore } from '@/src/presentation/stores/uiStore';
import { usePageLoadingOverlay } from '@/src/presentation/components/shared/PageLoadingOverlay';
import { Project } from '@/src/domain/project/entity/project';
import { ProjectUseCase } from '@/src/domain/project/usecase/project_usecase';
import { ROUTES } from '@/src/core/constants/routes';

export function useProjectDetail(projectUseCase: ProjectUseCase, initialProject: Project | null = null) {
  const { projectId } = useParams<{ projectId: string }>();
  const router = useRouter();
  const { addToast } = useUIStore();
  const pageLoading = usePageLoadingOverlay();
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
    await pageLoading.run(
      {
        title: `${project.status ? 'Menonaktifkan' : 'Mengaktifkan'} project "${project.name}"`,
        description: project.status
          ? 'Project ini sementara tidak akan aktif.'
          : 'Project ini akan kembali aktif dan bisa digunakan.',
      },
      async () => {
        await projectUseCase.toggleStatus(id);
        await reloadProject();
      }
    );
  };

  const handleSoftDelete = async () => {
    if (!project) return;
    await pageLoading.run(
      {
        title: `Memindahkan "${project.name}" ke trash`,
        description: 'Project masih bisa dipulihkan dari halaman daftar project.',
      },
      async () => {
        await projectUseCase.softDelete(project.id);
        addToast({ type: 'info', title: 'Project Soft Deleted', description: 'Moved project to trash.' });
        router.push(ROUTES.PROJECTS);
      }
    );
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
