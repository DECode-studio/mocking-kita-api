'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useDatabaseStore } from '@/src/presentation/stores/databaseStore';
import { useUIStore } from '@/src/presentation/stores/uiStore';

export function useProjectDetailViewModel() {
  const { projectId } = useParams<{ projectId: string }>();
  const router = useRouter();
  const { db, toggleProjectStatus, softDeleteProject } = useDatabaseStore();
  const { addToast } = useUIStore();
  const [activeTab, setActiveTab] = useState('apis');

  const project = db.projects.find((p) => p.id === projectId);

  const projectEnvs = db.environments.filter((e) => e.projectId === project?.id && !e.deletedAt);
  const projectApis = db.apiCollections.filter((a) => a.projectId === project?.id && !a.deletedAt);
  const projectApiIds = projectApis.map((a) => a.id);
  const projectReqs = db.requestScenarios.filter((r) => projectApiIds.includes(r.apiId) && !r.deletedAt);
  const projectReqIds = projectReqs.map((r) => r.id);
  const projectResps = db.responseScenarios.filter((res) => projectReqIds.includes(res.requestScenarioId) && !res.deletedAt);

  const handleSoftDelete = async () => {
    if (!project) return;
    await softDeleteProject(project.id);
    addToast({ type: 'info', title: 'Project Soft Deleted', description: 'Moved project to trash.' });
    router.push('/projects');
  };

  return {
    projectId,
    project,
    router,
    activeTab,
    setActiveTab,
    projectEnvs,
    projectApis,
    projectReqs,
    projectResps,
    handleSoftDelete,
    toggleProjectStatus,
  };
}
