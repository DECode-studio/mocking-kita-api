import { getService, CLIENT_DI_TOKENS } from '@/src/core/di';
import { notFound } from 'next/navigation';
import ProjectDetailView from '@/src/client/presentation/views/project-detail/ProjectDetailView';

interface ProjectDetailPageProps {
  params: Promise<{ projectId: string }>;
}

export default async function ProjectDetailPage({ params }: ProjectDetailPageProps) {
  const { projectId } = await params;
  const projectUseCase = getService(CLIENT_DI_TOKENS.projectUseCase);
  const apiUseCase = getService(CLIENT_DI_TOKENS.apiUseCase);
  const collectionUseCase = getService(CLIENT_DI_TOKENS.collectionUseCase);

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
