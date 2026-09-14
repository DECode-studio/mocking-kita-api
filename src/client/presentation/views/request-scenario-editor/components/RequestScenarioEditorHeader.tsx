'use client';


import React from 'react';
import Link from 'next/link';
import { ArrowLeft, Save, X, Loader2 } from 'lucide-react';
import { Project } from '@/src/client/domain/project/entity/project';
import { ApiCollection } from '@/src/client/domain/api/entity/api_collection';
import {
  REQUEST_SCENARIO_EDITOR_TEXT,
  REQUEST_SCENARIO_EDITOR_SEMANTIC_ID,
} from '../constant';

interface RequestScenarioEditorHeaderProps {
  projectId: string;
  apiId: string;
  project: Project | null;
  api: ApiCollection | null;
  pageTitle: string;
  isEditMode: boolean;
  isSaving: boolean;
  onCancel: () => void;
}

export const RequestScenarioEditorHeader: React.FC<RequestScenarioEditorHeaderProps> = ({
  projectId,
  apiId,
  project,
  api,
  pageTitle,
  isEditMode,
  isSaving,
  onCancel,
}) => {
  return (
    <div className="sticky top-0 z-20 bg-slate-50/95 dark:bg-slate-950/95 backdrop-blur-sm pt-2 pb-4 border-b border-slate-200 dark:border-slate-800 -mx-4 px-4 sm:-mx-6 sm:px-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          {/* Breadcrumb navigation */}
          <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
            <Link
              href={`/projects/${projectId}`}
              className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
            >
              {project?.name || 'Project'}
            </Link>
            <span>/</span>
            <Link
              href={`/projects/${projectId}/apis/${apiId}`}
              className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
            >
              {api ? `${api.methodRequest} ${api.path}` : 'API Detail'}
            </Link>
            <span>/</span>
            <span className="font-semibold text-slate-800 dark:text-slate-200">
              {isEditMode ? 'Edit Scenario' : 'New Scenario'}
            </span>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onCancel}
              className="p-1.5 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-200/60 dark:hover:bg-slate-800/60 rounded-lg transition-colors cursor-pointer"
              title="Back to API Detail"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <h1 className="text-lg font-bold text-slate-900 dark:text-slate-100">{pageTitle}</h1>
            {api && (
              <span className="px-2 py-0.5 rounded text-[10px] font-bold font-mono bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800">
                {api.methodRequest} {api.path}
              </span>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2.5 shrink-0">
          <button
            id={REQUEST_SCENARIO_EDITOR_SEMANTIC_ID.BTN_CANCEL}
            type="button"
            onClick={onCancel}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-3.5 h-3.5" /> {REQUEST_SCENARIO_EDITOR_TEXT.BTN_CANCEL}
          </button>
          <button
            id={REQUEST_SCENARIO_EDITOR_SEMANTIC_ID.BTN_SUBMIT}
            type="submit"
            disabled={isSaving}
            className="inline-flex items-center gap-1.5 px-4 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded-lg shadow-xs transition-colors cursor-pointer disabled:opacity-50"
          >
            {isSaving ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Save className="w-3.5 h-3.5" />
            )}
            {isEditMode
              ? REQUEST_SCENARIO_EDITOR_TEXT.BTN_SAVE_CHANGES
              : REQUEST_SCENARIO_EDITOR_TEXT.BTN_CREATE_SCENARIO}
          </button>
        </div>
      </div>
    </div>
  );
};
