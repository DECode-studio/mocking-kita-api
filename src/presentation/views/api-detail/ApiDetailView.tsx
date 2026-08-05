'use client';

import React from 'react';
import * as Tabs from '@radix-ui/react-tabs';
import { ArrowLeft, FileCode } from 'lucide-react';
import { ConfirmDialog } from '../../components/shared/ConfirmDialog';
import { EmptyState } from '../../components/shared/EmptyState';
import { createApiDetailUseCase } from '@/src/domain/api';
import { useApiDetailViewModel } from './view_model/useApiDetailViewModel';
import { ApiDetailSnapshot } from '@/src/domain/api/usecase/api_detail_usecase';
import {
  ApiDetailHeader,
  RequestScenarioSidebar,
  RequestScenarioDetailPanel,
  ResponseScenarioListSection,
  EnvironmentOverrideTabContent,
  EndpointOverviewTabContent,
  RequestScenarioModal,
  ResponseScenarioModal,
} from './components';

interface ApiDetailViewProps {
  initialDetail?: ApiDetailSnapshot;
}

export const ApiDetailView: React.FC<ApiDetailViewProps> = ({ initialDetail }) => {
  const apiDetailUseCase = createApiDetailUseCase();
  const {
    detail,
    projectId,
    project,
    api,
    projectEnvs,
    reqScenarios,
    respScenarios,
    activeReqScenario,
    environmentRows,
    handleToggleEnabled,
    handleUpdatePathOverride,
    activeMainTab,
    setActiveMainTab,
    scenarioSearch,
    setScenarioSearch,
    setSelectedReqScenarioId,
    isReqModalOpen,
    setIsReqModalOpen,
    editingReqScenario,
    setEditingReqScenario,
    isRespModalOpen,
    setIsRespModalOpen,
    editingRespScenario,
    setEditingRespScenario,
    deletingReqId,
    setDeletingReqId,
    deletingRespId,
    setDeletingRespId,
    copiedUrl,
    handleSaveReqScenario,
    handleSaveRespScenario,
    handleCopyResolvedUrl,
    updateRequestScenario,
    updateResponseScenario,
    router,
    toggleApiCollectionStatus,
    toggleRequestScenarioStatus,
    duplicateRequestScenario,
    deleteRequestScenario,
    toggleResponseScenarioStatus,
    duplicateResponseScenario,
    deleteResponseScenario,
  } = useApiDetailViewModel(apiDetailUseCase, initialDetail);

  if (!api || !project) {
    return (
      <div className="py-16 text-center space-y-3">
        <h2 className="text-base font-bold text-slate-800 dark:text-slate-200">API Endpoint Not Found</h2>
        <button
          onClick={() => router.push(`/projects/${projectId}`)}
          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-indigo-600 rounded-md"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Back to Project
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <ApiDetailHeader
        api={api}
        project={project}
        onBack={() => router.push(`/projects/${projectId}`)}
        onToggleStatus={toggleApiCollectionStatus}
      />

      {/* Main Tabs Navigation */}
      <Tabs.Root value={activeMainTab} onValueChange={setActiveMainTab} className="space-y-4">
        <Tabs.List className="flex border-b border-slate-200 dark:border-slate-800 gap-6">
          <Tabs.Trigger
            value="scenarios"
            className={`pb-2.5 text-xs font-semibold transition-colors ${
              activeMainTab === 'scenarios'
                ? 'text-indigo-600 dark:text-indigo-400 border-b-2 border-indigo-600 dark:border-indigo-400'
                : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            Request & Response Scenarios ({reqScenarios.length})
          </Tabs.Trigger>

          <Tabs.Trigger
            value="environments"
            className={`pb-2.5 text-xs font-semibold transition-colors ${
              activeMainTab === 'environments'
                ? 'text-indigo-600 dark:text-indigo-400 border-b-2 border-indigo-600 dark:border-indigo-400'
                : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            Environment Overrides ({projectEnvs.length})
          </Tabs.Trigger>

          <Tabs.Trigger
            value="overview"
            className={`pb-2.5 text-xs font-semibold transition-colors ${
              activeMainTab === 'overview'
                ? 'text-indigo-600 dark:text-indigo-400 border-b-2 border-indigo-600 dark:border-indigo-400'
                : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            Endpoint Overview
          </Tabs.Trigger>
        </Tabs.List>

        {/* --- TAB 1: SCENARIOS (Master Detail Workspace) --- */}
        <Tabs.Content value="scenarios" className="focus:outline-none">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 min-h-150">
            {/* Left Sidebar: Scenario List */}
            <RequestScenarioSidebar
              reqScenarios={reqScenarios}
              responseScenarios={detail.responseScenarios}
              activeReqScenarioId={activeReqScenario?.id ?? null}
              scenarioSearch={scenarioSearch}
              onSearchChange={setScenarioSearch}
              onSelectScenario={setSelectedReqScenarioId}
              onAddClick={() => {
                setEditingReqScenario(null);
                setIsReqModalOpen(true);
              }}
              onToggleStatus={toggleRequestScenarioStatus}
            />

            {/* Main Workspace Area for Selected Request Scenario */}
            <div className="lg:col-span-8 space-y-6">
              {!activeReqScenario ? (
                <EmptyState
                  icon={FileCode}
                  title="No scenario selected"
                  description="Select or add a request scenario from the left panel to configure headers, parameters, matching rules, and mock responses."
                />
              ) : (
                <RequestScenarioDetailPanel
                  scenario={activeReqScenario}
                  onEdit={() => {
                    setEditingReqScenario(activeReqScenario);
                    setIsReqModalOpen(true);
                  }}
                  onDuplicate={() => duplicateRequestScenario(activeReqScenario.id)}
                  onDeleteRequest={() => setDeletingReqId(activeReqScenario.id)}
                  onUpdateScenario={updateRequestScenario}
                >
                  <ResponseScenarioListSection
                    respScenarios={respScenarios}
                    onAddClick={() => {
                      setEditingRespScenario(null);
                      setIsRespModalOpen(true);
                    }}
                    onEdit={(resp) => {
                      setEditingRespScenario(resp);
                      setIsRespModalOpen(true);
                    }}
                    onDuplicate={duplicateResponseScenario}
                    onDeleteRequest={(id) => setDeletingRespId(id)}
                    onToggleStatus={toggleResponseScenarioStatus}
                    onUpdateScenario={updateResponseScenario}
                  />
                </RequestScenarioDetailPanel>
              )}
            </div>
          </div>
        </Tabs.Content>

        {/* --- TAB 2: ENVIRONMENTS & OVERRIDES --- */}
        <Tabs.Content value="environments" className="focus:outline-none">
          <EnvironmentOverrideTabContent
            apiPath={api.path}
            projectEnvs={projectEnvs}
            environmentRows={environmentRows}
            copiedUrl={copiedUrl}
            onToggleEnabled={handleToggleEnabled}
            onUpdatePathOverride={handleUpdatePathOverride}
            onCopyResolvedUrl={handleCopyResolvedUrl}
          />
        </Tabs.Content>

        {/* --- TAB 3: OVERVIEW --- */}
        <Tabs.Content value="overview" className="focus:outline-none">
          <EndpointOverviewTabContent api={api} project={project} />
        </Tabs.Content>
      </Tabs.Root>

      {/* Request Scenario Dialog */}
      <RequestScenarioModal
        isOpen={isReqModalOpen}
        onOpenChange={setIsReqModalOpen}
        editingReqScenario={editingReqScenario}
        onSubmit={handleSaveReqScenario}
      />

      {/* Response Scenario Dialog */}
      <ResponseScenarioModal
        isOpen={isRespModalOpen}
        onOpenChange={setIsRespModalOpen}
        editingRespScenario={editingRespScenario}
        onSubmit={handleSaveRespScenario}
      />

      {/* Delete Confirms */}
      <ConfirmDialog
        isOpen={!!deletingReqId}
        onClose={() => setDeletingReqId(null)}
        onConfirm={async () => {
          if (deletingReqId) await deleteRequestScenario(deletingReqId);
          setDeletingReqId(null);
        }}
        title="Delete Request Scenario?"
        description="Are you sure you want to delete this scenario and all attached response payloads?"
        variant="danger"
      />

      <ConfirmDialog
        isOpen={!!deletingRespId}
        onClose={() => setDeletingRespId(null)}
        onConfirm={async () => {
          if (deletingRespId) await deleteResponseScenario(deletingRespId);
          setDeletingRespId(null);
        }}
        title="Delete Response Scenario?"
        description="Are you sure you want to delete this mock response payload?"
        variant="danger"
      />
    </div>
  );
};

export default ApiDetailView;
