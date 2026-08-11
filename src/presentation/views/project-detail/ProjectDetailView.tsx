'use client';

import React from 'react';
import * as Tabs from '@radix-ui/react-tabs';
import { ArrowLeft } from 'lucide-react';
import { EnvironmentsView } from '../environments/EnvironmentsView';
import { ApiCollectionsView } from '../api-collections/ApiCollectionsView';
import { formatDate } from '../../../core/utils/date';
import {  createProjectUseCase  } from '@/src/di/usecase_provider';
import { useProjectDetail } from './useProjectDetail';
import { ApiCollection } from '@/src/domain/api/entity/api_collection';
import { Environment } from '@/src/domain/environment/entity/environment';
import { Project } from '@/src/domain/project/entity/project';
import { PROJECT_DETAIL_TEXT, PROJECT_DETAIL_SEMANTIC_ID } from './constant';
import {
  ProjectDetailHeader,
  ProjectMetadataCard,
  OpenApiModal,
} from './components';

import { Collection } from '@/src/domain/collection/entity/collection';

interface ProjectDetailViewProps {
  initialProject?: Project | null;
  initialApis?: ApiCollection[];
  initialEnvironments?: Environment[];
  initialCollections?: Collection[];
}

export const ProjectDetailView: React.FC<ProjectDetailViewProps> = ({
  initialProject = null,
  initialApis = [],
  initialEnvironments = [],
  initialCollections = [],
}) => {
  const [isOpenApiOpen, setIsOpenApiOpen] = React.useState(false);
  const projectUseCase = createProjectUseCase();
  const {
    projectId,
    project,
    isLoading,
    router,
    activeTab,
    setActiveTab,
    handleSoftDelete,
    toggleProjectStatus,
  } = useProjectDetail(projectUseCase, initialProject);

  if (isLoading && !project) {
    return (
      <div className="py-16 text-center space-y-3">
        <h2 className="text-base font-bold text-slate-800 dark:text-slate-200">Loading project...</h2>
        <p className="text-xs text-slate-500">Fetching project data from the server.</p>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="py-16 text-center space-y-3">
        <h2 className="text-base font-bold text-slate-800 dark:text-slate-200">Project Not Found</h2>
        <p className="text-xs text-slate-500">The requested project ID does not exist or was deleted.</p>
        <button
          onClick={() => router.push('/projects')}
          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-indigo-600 rounded-md"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Back to Projects
        </button>
      </div>
    );
  }

  return (
    <div id={PROJECT_DETAIL_SEMANTIC_ID.CONTAINER} className="space-y-6">
      {/* Top Header */}
      <ProjectDetailHeader
        project={project}
        onBack={() => router.push('/projects')}
        onToggleStatus={toggleProjectStatus}
        onSoftDelete={handleSoftDelete}
        onOpenApiClick={() => setIsOpenApiOpen(true)}
      />

      <OpenApiModal
        isOpen={isOpenApiOpen}
        onClose={() => setIsOpenApiOpen(false)}
        projectId={project.id}
        projectName={project.name}
      />

      {/* Summary Stat Card */}
      <div className="p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg shadow-xs flex items-center justify-between font-mono text-xs">
        <span className="text-slate-500 font-sans">{PROJECT_DETAIL_TEXT.CREATED_DATE_LABEL}</span>
        <span className="font-semibold text-slate-900 dark:text-slate-100">{formatDate(project.createdAt)}</span>
      </div>

      {/* Tabs */}
      <Tabs.Root value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <Tabs.List id={PROJECT_DETAIL_SEMANTIC_ID.TAB_LIST} className="flex border-b border-slate-200 dark:border-slate-800 gap-4">
          <Tabs.Trigger
            value="apis"
            className={`pb-2.5 text-xs font-semibold transition-colors relative ${
              activeTab === 'apis'
                ? 'text-indigo-600 dark:text-indigo-400 border-b-2 border-indigo-600 dark:border-indigo-400'
                : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            {PROJECT_DETAIL_TEXT.TAB_APIS}
          </Tabs.Trigger>

          <Tabs.Trigger
            value="environments"
            className={`pb-2.5 text-xs font-semibold transition-colors relative ${
              activeTab === 'environments'
                ? 'text-indigo-600 dark:text-indigo-400 border-b-2 border-indigo-600 dark:border-indigo-400'
                : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            {PROJECT_DETAIL_TEXT.TAB_ENVIRONMENTS}
          </Tabs.Trigger>

          <Tabs.Trigger
            value="overview"
            className={`pb-2.5 text-xs font-semibold transition-colors relative ${
              activeTab === 'overview'
                ? 'text-indigo-600 dark:text-indigo-400 border-b-2 border-indigo-600 dark:border-indigo-400'
                : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            {PROJECT_DETAIL_TEXT.TAB_OVERVIEW}
          </Tabs.Trigger>
        </Tabs.List>

        <Tabs.Content value="apis">
          <ApiCollectionsView embeddedProjectId={project.id} initialApis={initialApis} initialCollections={initialCollections} />
        </Tabs.Content>

        <Tabs.Content value="environments">
          <EnvironmentsView embeddedProjectId={project.id} initialEnvironments={initialEnvironments} initialProject={project} />
        </Tabs.Content>

        <Tabs.Content value="overview">
          <ProjectMetadataCard project={project} />
        </Tabs.Content>
      </Tabs.Root>
    </div>
  );
};

export default ProjectDetailView;
