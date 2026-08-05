import { notFound } from 'next/navigation';
import ProjectDetailView from '@/src/presentation/views/project-detail/ProjectDetailView';
import { createProjectUseCase } from '@/src/domain/project';
import { createApiUseCase } from '@/src/domain/api';
import { createEnvironmentUseCase } from '@/src/domain/environment';

interface ProjectDetailPageProps {
  params: Promise<{ projectId: string }>;
}

export default async function ProjectDetailPage({ params }: ProjectDetailPageProps) {
  const { projectId } = await params;
  const projectUseCase = createProjectUseCase();
  const apiUseCase = createApiUseCase();
  const environmentUseCase = createEnvironmentUseCase();

  const [project, apiSnapshot, environmentSnapshot] = await Promise.all([
    projectUseCase.getById(projectId),
    apiUseCase.load(projectId),
    environmentUseCase.load(projectId),
  ]);

  if (!project) {
    notFound();
  }

  return (
    <ProjectDetailView
      initialProject={project}
      initialApis={apiSnapshot.apis}
      initialEnvironments={environmentSnapshot.environments}
    />
  );
}
