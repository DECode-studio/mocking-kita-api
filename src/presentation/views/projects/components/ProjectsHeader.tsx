'use client';

import React from 'react';
import { Plus } from 'lucide-react';
import { PROJECTS_TEXT, PROJECTS_SEMANTIC_ID } from '../constant';

interface ProjectsHeaderProps {
  onAddClick: () => void;
}

export const ProjectsHeader: React.FC<ProjectsHeaderProps> = ({ onAddClick }) => {
  return (
    <div id={PROJECTS_SEMANTIC_ID.HEADER} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div>
        <h1 className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
          {PROJECTS_TEXT.TITLE}
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          {PROJECTS_TEXT.SUBTITLE}
        </p>
      </div>

      <button
        id={PROJECTS_SEMANTIC_ID.ADD_PROJECT_BTN}
        type="button"
        onClick={onAddClick}
        className="inline-flex items-center justify-center gap-2 px-4 py-2.5 text-xs font-semibold text-white bg-slate-900 dark:bg-slate-100 dark:text-slate-900 hover:bg-slate-800 dark:hover:bg-white rounded-xl shadow transition-all hover:scale-[1.02]"
      >
        <Plus className="w-4 h-4" />
        {PROJECTS_TEXT.ADD_PROJECT_BTN}
      </button>
    </div>
  );
};
