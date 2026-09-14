import { getService, CLIENT_DI_TOKENS } from '@/src/core/di';
import ProjectsView from '@/src/client/presentation/views/projects/ProjectsView';

export default async function ProjectsPage() {
  const projectUseCase = getService(CLIENT_DI_TOKENS.projectUseCase);
  const initialProjects = await projectUseCase.getAll();
  return <ProjectsView initialProjects={initialProjects} />;
}
