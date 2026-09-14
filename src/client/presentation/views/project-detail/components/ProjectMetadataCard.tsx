'use client';


import React from 'react';
import { Project } from '@/src/client/domain/project/entity/project';
import { formatDate } from '@/src/core/utils/date';
import { PROJECT_DETAIL_TEXT, PROJECT_DETAIL_SEMANTIC_ID } from '../constant';

interface ProjectMetadataCardProps {
  project: Project;
}

export const ProjectMetadataCard: React.FC<ProjectMetadataCardProps> = ({ project }) => {
  return (
    <div id={PROJECT_DETAIL_SEMANTIC_ID.METADATA_CARD} className="p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl space-y-4 max-w-2xl">
      <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500">
        {PROJECT_DETAIL_TEXT.METADATA_TITLE}
      </h3>
      <div className="space-y-3 text-xs font-mono">
        <div className="flex justify-between py-1.5 border-b border-slate-100 dark:border-slate-800">
          <span className="text-slate-400">{PROJECT_DETAIL_TEXT.METADATA_PROJECT_ID}</span>
          <span className="text-slate-800 dark:text-slate-200">{project.id}</span>
        </div>
        <div className="flex justify-between py-1.5 border-b border-slate-100 dark:border-slate-800">
          <span className="text-slate-400">{PROJECT_DETAIL_TEXT.METADATA_CREATED_AT}</span>
          <span className="text-slate-800 dark:text-slate-200">{formatDate(project.createdAt)}</span>
        </div>
        <div className="flex justify-between py-1.5 border-b border-slate-100 dark:border-slate-800">
          <span className="text-slate-400">{PROJECT_DETAIL_TEXT.METADATA_LAST_UPDATED}</span>
          <span className="text-slate-800 dark:text-slate-200">{formatDate(project.updatedAt)}</span>
        </div>
      </div>
    </div>
  );
};