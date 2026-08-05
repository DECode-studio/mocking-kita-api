import { readDatabase } from '@/src/core/db/database_storage_helper';
import ProjectsView from '@/src/presentation/views/projects/ProjectsView';

export default function ProjectsPage() {
  const initialProjects = readDatabase().projects;
  return <ProjectsView initialProjects={initialProjects} />;
}
