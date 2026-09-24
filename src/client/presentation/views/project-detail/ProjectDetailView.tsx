'use client';

import React from 'react';
import * as Tabs from '@radix-ui/react-tabs';
import { ArrowLeft } from 'lucide-react';
import { ApiCollectionsView } from '../api-collections/ApiCollectionsView';
import { ScenarioFlowsListView } from '../scenario-flows/ScenarioFlowsListView';
import { DataSheetsListView } from '../data-sheets/DataSheetsListView';
import { formatDate } from '@/src/core/utils/date';
import { useProjectDetail } from './hook/useProjectDetail';
import { ApiCollection } from '@/src/client/domain/api/entity/api_collection';
import { Project } from '@/src/client/domain/project/entity/project';
import { PROJECT_DETAIL_TEXT, PROJECT_DETAIL_SEMANTIC_ID } from './constant';
import {
  ProjectDetailHeader,
  ProjectMetadataCard,
  OpenApiModal,
  ProjectEnvironmentsTab,
} from './components';
import { ScrollToTopButton } from '@/src/client/presentation/components/shared/ScrollToTopButton';

import { Collection } from '@/src/client/domain/collection/entity/collection';

interface ProjectDetailViewProps {
  initialProject?: Project | null;
  initialApis?: ApiCollection[];
  initialCollections?: Collection[];
}

export const ProjectDetailView: React.FC<ProjectDetailViewProps> = ({
  initialProject = null,
  initialApis = [],
  initialCollections = [],
}) => {
  const {
    projectId,
    project,
    isLoading,
    router,
    activeTab,
    setActiveTab,
    handleSoftDelete,
    toggleProjectStatus,
    isOpenApiOpen,
    setIsOpenApiOpen,
  } = useProjectDetail(undefined, initialProject);

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
            Environments
          </Tabs.Trigger>

          <Tabs.Trigger
            value="scenario-flows"
            className={`pb-2.5 text-xs font-semibold transition-colors relative ${
              activeTab === 'scenario-flows'
                ? 'text-indigo-600 dark:text-indigo-400 border-b-2 border-indigo-600 dark:border-indigo-400'
                : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            Flow Scenarios
          </Tabs.Trigger>

          <Tabs.Trigger
            value="data-sheets"
            className={`pb-2.5 text-xs font-semibold transition-colors relative ${
              activeTab === 'data-sheets'
                ? 'text-indigo-600 dark:text-indigo-400 border-b-2 border-indigo-600 dark:border-indigo-400'
                : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            Data Sheets
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
          <ProjectEnvironmentsTab projectId={project.id} />
        </Tabs.Content>

        <Tabs.Content value="scenario-flows">
          <ScenarioFlowsListView projectId={project.id} />
        </Tabs.Content>

        <Tabs.Content value="data-sheets">
          <DataSheetsListView projectId={project.id} />
        </Tabs.Content>

        <Tabs.Content value="overview">
          <ProjectMetadataCard project={project} />
        </Tabs.Content>
      </Tabs.Root>

      {/* Scroll to Top */}
      <ScrollToTopButton />
    </div>
  );
};

export default ProjectDetailView;