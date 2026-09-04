import { notFound } from 'next/navigation';
import ProjectDetailView from '@/src/presentation/views/project-detail/ProjectDetailView';
import {  createProjectUseCase  } from '@/src/di/usecase_provider';
import {  createApiUseCase  } from '@/src/di/usecase_provider';
import {  createCollectionUseCase  } from '@/src/di/usecase_provider';

interface ProjectDetailPageProps {
  params: Promise<{ projectId: string }>;
}

export default async function ProjectDetailPage({ params }: ProjectDetailPageProps) {
  const { projectId } = await params;
  const projectUseCase = createProjectUseCase();
  const apiUseCase = createApiUseCase();
  const collectionUseCase = createCollectionUseCase();

  const [project, apiSnapshot, collections] = await Promise.all([
    projectUseCase.getById(projectId),
    apiUseCase.load(projectId),
    collectionUseCase.getByProjectId(projectId),
  ]);

  if (!project) {
    notFound();
  }

  return (
    <ProjectDetailView
      initialProject={project}
      initialApis={apiSnapshot.apis}
      initialCollections={collections}
    />
  );
}
