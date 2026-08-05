import { ProjectRemoteRepository } from '@/src/data/project/repository/project_repository';
import ProjectsView from '@/src/presentation/views/projects/ProjectsView';

const projectRepo = new ProjectRemoteRepository();

export default async function ProjectsPage() {
  const initialProjects = await projectRepo.getAll();
  return <ProjectsView initialProjects={initialProjects} />;
}
