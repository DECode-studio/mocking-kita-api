'use client';

import React from 'react';
import {
  Plus,
  UploadCloud,
  Search,
  Layers,
  GitFork,
} from 'lucide-react';
import { useScenarioFlows } from './hook/useScenarioFlows';
import { SCENARIO_FLOWS_TEXT, SCENARIO_FLOWS_SEMANTIC_ID } from './constant';
import {
  ScenarioFlowCard,
  CreateScenarioFlowModal,
  ImportScenarioFlowModal,
} from './components';

interface ScenarioFlowsListViewProps {
  projectId?: string;
}

export const ScenarioFlowsListView: React.FC<ScenarioFlowsListViewProps> = ({ projectId }) => {
  const {
    flows,
    allFlowsCount,
    environments,
    projects,
    isLoading,
    searchQuery,
    setSearchQuery,
    filterProjectId,
    setFilterProjectId,
    isCreateModalOpen,
    setIsCreateModalOpen,
    isImportModalOpen,
    setIsImportModalOpen,
    runningFlowId,
    handleCreateFlow,
    handleImportSuccess,
    handleImportFlow,
    handleDeleteFlow,
    handleQuickRun,
    handleExportFlow,
  } = useScenarioFlows(projectId);

  return (
    <div id={SCENARIO_FLOWS_SEMANTIC_ID.CONTAINER} className="space-y-6">
      {/* Top Banner / Actions */}
      <div id={SCENARIO_FLOWS_SEMANTIC_ID.HEADER} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 id={SCENARIO_FLOWS_SEMANTIC_ID.TITLE} className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Layers className="w-5 h-5 text-purple-600 dark:text-purple-400" />
            {SCENARIO_FLOWS_TEXT.TITLE}
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 max-w-2xl">
            {SCENARIO_FLOWS_TEXT.SUBTITLE}
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <button
            id={SCENARIO_FLOWS_SEMANTIC_ID.IMPORT_BTN}
            onClick={() => setIsImportModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-purple-500/50 hover:bg-slate-50 dark:hover:bg-slate-800/80 shadow-2xs transition-all cursor-pointer"
          >
            <UploadCloud className="w-4 h-4 text-indigo-500" />
            <span>{SCENARIO_FLOWS_TEXT.IMPORT_BTN}</span>
          </button>

          <button
            id={SCENARIO_FLOWS_SEMANTIC_ID.CREATE_BTN}
            onClick={() => setIsCreateModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold text-white bg-purple-600 hover:bg-purple-500 active:bg-purple-700 shadow-sm shadow-purple-500/20 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>{SCENARIO_FLOWS_TEXT.CREATE_BTN}</span>
          </button>
        </div>
      </div>

      {/* Filter / Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            id={SCENARIO_FLOWS_SEMANTIC_ID.SEARCH_INPUT}
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={SCENARIO_FLOWS_TEXT.SEARCH_PLACEHOLDER}
            className="w-full pl-9 pr-4 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-purple-500/30 focus:border-purple-500 transition-all"
          />
        </div>

        {!projectId && (
          <div className="flex items-center gap-2 shrink-0">
            <span className="text-xs text-slate-500">{SCENARIO_FLOWS_TEXT.FILTER_PROJECT_LABEL}</span>
            <select
              id={SCENARIO_FLOWS_SEMANTIC_ID.PROJECT_FILTER}
              value={filterProjectId}
              onChange={(e) => setFilterProjectId(e.target.value)}
              className="px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 focus:outline-hidden focus:ring-2 focus:ring-purple-500/30"
            >
              <option value="ALL">
                {SCENARIO_FLOWS_TEXT.ALL_PROJECTS} ({allFlowsCount})
              </option>
              <option value="CROSS_PROJECT">🌐 {SCENARIO_FLOWS_TEXT.CROSS_PROJECT_FLOWS}</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  📁 {p.name}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Content List */}
      {isLoading ? (
        <div className="py-20 text-center space-y-3">
          <div className="w-8 h-8 border-3 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs text-slate-500 font-medium">{SCENARIO_FLOWS_TEXT.LOADING}</p>
        </div>
      ) : flows.length === 0 ? (
        <div id={SCENARIO_FLOWS_SEMANTIC_ID.EMPTY_STATE} className="py-16 px-6 text-center border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-2xl bg-white/50 dark:bg-slate-900/30 space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-purple-500/10 dark:bg-purple-500/20 text-purple-600 dark:text-purple-400 flex items-center justify-center mx-auto">
            <GitFork className="w-6 h-6" />
          </div>
          <div className="max-w-md mx-auto space-y-1">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              {SCENARIO_FLOWS_TEXT.EMPTY_TITLE}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {SCENARIO_FLOWS_TEXT.EMPTY_DESC}
            </p>
          </div>
          <div className="flex items-center justify-center gap-3 pt-2">
            <button
              id={SCENARIO_FLOWS_SEMANTIC_ID.EMPTY_CREATE_BTN}
              onClick={() => setIsCreateModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-purple-600 rounded-xl hover:bg-purple-500 shadow-xs transition-all cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              {SCENARIO_FLOWS_TEXT.CREATE_MANUALLY}
            </button>
            <button
              id={SCENARIO_FLOWS_SEMANTIC_ID.EMPTY_IMPORT_BTN}
              onClick={() => setIsImportModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700 transition-all cursor-pointer"
            >
              <UploadCloud className="w-3.5 h-3.5 text-indigo-500" />
              {SCENARIO_FLOWS_TEXT.IMPORT_TEMPLATE_JSON}
            </button>
          </div>
        </div>
      ) : (
        <div id={SCENARIO_FLOWS_SEMANTIC_ID.FLOWS_GRID} className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {flows.map((flow) => (
            <ScenarioFlowCard
              key={flow.id}
              flow={flow}
              projectId={projectId || flow.projectId || undefined}
              isRunning={runningFlowId === flow.id}
              onQuickRun={handleQuickRun}
              onExport={handleExportFlow}
              onDelete={handleDeleteFlow}
            />
          ))}
        </div>
      )}

      {/* Modals */}
      <CreateScenarioFlowModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        environments={environments}
        projects={projects}
        initialProjectId={projectId}
        onSubmit={handleCreateFlow}
      />

      <ImportScenarioFlowModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        projectId={projectId}
        projects={projects}
        onSuccess={handleImportSuccess}
        onImportFlow={handleImportFlow}
      />
    </div>
  );
};
