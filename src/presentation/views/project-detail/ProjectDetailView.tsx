'use client';

import React from 'react';
import * as Tabs from '@radix-ui/react-tabs';
import {
  FolderGit2,
  Globe,
  Layers,
  FileCode,
  ArrowLeft,
  Edit2,
  Plus,
  Copy,
  Trash2,
  Clock,
  CheckCircle2,
} from 'lucide-react';
import { StatusBadge } from '../../components/shared/StatusBadge';
import { StatusSwitch } from '../../components/shared/StatusSwitch';
import { EnvironmentsView } from '../environments/EnvironmentsView';
import { ApiCollectionsView } from '../api-collections/ApiCollectionsView';
import { formatDate } from '../../../core/utils/date';
import { createProjectUseCase } from '@/src/domain/project';
import { useProjectDetailViewModel } from './view_model/useProjectDetailViewModel';
import { ApiCollection } from '@/src/domain/api/entity/api_collection';
import { Environment } from '@/src/domain/environment/entity/environment';
import { Project } from '@/src/domain/project/entity/project';

interface ProjectDetailViewProps {
  initialProject?: Project | null;
  initialApis?: ApiCollection[];
  initialEnvironments?: Environment[];
}

export const ProjectDetailView: React.FC<ProjectDetailViewProps> = ({
  initialProject = null,
  initialApis = [],
  initialEnvironments = [],
}) => {
  const projectUseCase = createProjectUseCase();
  const {
    projectId,
    project,
    router,
    activeTab,
    setActiveTab,
    handleSoftDelete,
    toggleProjectStatus,
  } = useProjectDetailViewModel(projectUseCase, initialProject);

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
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
        <div className="space-y-1">
          <button
            onClick={() => router.push('/projects')}
            className="inline-flex items-center gap-1 text-xs text-slate-500 hover:text-slate-900 dark:hover:text-slate-100 transition-colors mb-1"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Back to Projects
          </button>
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
              {project.name}
            </h1>
            <StatusBadge status={project.status} />
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {project.description || 'No project description configured.'}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <StatusSwitch
            checked={project.status}
            onCheckedChange={() => toggleProjectStatus(project.id)}
            label={project.status ? 'Active' : 'Disabled'}
          />
          <button
            onClick={handleSoftDelete}
            className="p-1.5 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition-colors"
            title="Delete Project"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Summary Stat Cards */}
      <div className="p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg shadow-xs flex items-center justify-between font-mono text-xs">
        <span className="text-slate-500 font-sans">Created Date</span>
        <span className="font-semibold text-slate-900 dark:text-slate-100">{formatDate(project.createdAt)}</span>
      </div>

      {/* Tabs */}
      <Tabs.Root value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <Tabs.List className="flex border-b border-slate-200 dark:border-slate-800 gap-4">
          <Tabs.Trigger
            value="apis"
            className={`pb-2.5 text-xs font-semibold transition-colors relative ${
              activeTab === 'apis'
                ? 'text-indigo-600 dark:text-indigo-400 border-b-2 border-indigo-600 dark:border-indigo-400'
                : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            API Collections
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
            value="overview"
            className={`pb-2.5 text-xs font-semibold transition-colors relative ${
              activeTab === 'overview'
                ? 'text-indigo-600 dark:text-indigo-400 border-b-2 border-indigo-600 dark:border-indigo-400'
                : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            Project Information
          </Tabs.Trigger>
        </Tabs.List>

        <Tabs.Content value="apis">
          <ApiCollectionsView embeddedProjectId={project.id} initialApis={initialApis} />
        </Tabs.Content>

        <Tabs.Content value="environments">
          <EnvironmentsView embeddedProjectId={project.id} initialEnvironments={initialEnvironments} initialProject={project} />
        </Tabs.Content>

        <Tabs.Content value="overview">
          <div className="p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl space-y-4 max-w-2xl">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Project Metadata
            </h3>
            <div className="space-y-3 text-xs font-mono">
              <div className="flex justify-between py-1.5 border-b border-slate-100 dark:border-slate-800">
                <span className="text-slate-400">Project ID</span>
                <span className="text-slate-800 dark:text-slate-200">{project.id}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-100 dark:border-slate-800">
                <span className="text-slate-400">Created At</span>
                <span className="text-slate-800 dark:text-slate-200">{formatDate(project.createdAt)}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-100 dark:border-slate-800">
                <span className="text-slate-400">Last Updated</span>
                <span className="text-slate-800 dark:text-slate-200">{formatDate(project.updatedAt)}</span>
              </div>
            </div>
          </div>
        </Tabs.Content>
      </Tabs.Root>
    </div>
  );
};

export default ProjectDetailView;
