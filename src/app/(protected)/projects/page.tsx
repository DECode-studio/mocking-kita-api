import { projectUseCase } from '@/src/data/project/project_usecase';
import ProjectsView from '@/src/presentation/views/projects/ProjectsView';

export default async function ProjectsPage() {
  const initialProjects = await projectUseCase.getAll();
  return <ProjectsView initialProjects={initialProjects} />;
}
