import ProjectsView from '@/src/presentation/views/projects/ProjectsView';
import { createProjectUseCase } from '@/src/di/usecase_provider';

export default async function ProjectsPage() {
  const projectUseCase = createProjectUseCase();
  const initialProjects = await projectUseCase.getAll();
  return <ProjectsView initialProjects={initialProjects} />;
}
