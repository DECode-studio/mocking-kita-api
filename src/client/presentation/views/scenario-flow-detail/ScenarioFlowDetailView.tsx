'use client';

import React from 'react';
import {
  Layers,
  Plus,
  GitFork,
  ArrowLeft,
  Activity,
} from 'lucide-react';
import Link from 'next/link';
import { useScenarioFlowDetail } from './hook/useScenarioFlowDetail';
import { SCENARIO_FLOW_DETAIL_TEXT } from './constant/scenarioFlowDetailText';
import {
  ScenarioFlowDetailHeader,
  StepCard,
  ScenarioFlowCanvas,
  StepInspectorDrawer,
  AddStepModal,
  FlowExecutionPanel,
  StepExecutionInspector,
  ExecutionHistoryModal,
  EditFlowModal,
} from './components';
import { ROUTES } from '@/src/core/constants/routes';
import { useUIStore } from '@/src/client/presentation/stores/uiStore';

interface ScenarioFlowDetailViewProps {
  projectId?: string;
  flowId: string;
}

export const ScenarioFlowDetailView: React.FC<ScenarioFlowDetailViewProps> = ({
  projectId,
  flowId,
}) => {
  const setBreadcrumbTitle = useUIStore((state) => state.setBreadcrumbTitle);
  const {
    flow,
    environments,
    projectApis,
    projects,
    isLoading,
    selectedEnvironmentType,
    setSelectedEnvironmentType,
    selectedEnvironmentId,
    setSelectedEnvironmentId,
    targetMode,
    setTargetMode,
    isRunning,
    elapsedMs,
    latestExecution,
    selectedStepIndex,
    setSelectedStepIndex,
    viewMode,
    setViewMode,
    stepPositions,
    updateStepPosition,
    handleAutoArrange,
    isInspectorOpen,
    setIsInspectorOpen,
    isAddStepModalOpen,
    setIsAddStepModalOpen,
    editingStep,
    setEditingStep,
    isHistoryModalOpen,
    setIsHistoryModalOpen,
    isEditFlowModalOpen,
    setIsEditFlowModalOpen,
    handleUpdateFlow,
    handleSaveStep,
    handleDeleteStep,
    handleToggleStepEnabled,
    handleMoveStep,
    handleRunFlow,
    handleExport,
    setLatestExecution,
  } = useScenarioFlowDetail(projectId, flowId);

  React.useEffect(() => {
    if (flow?.name) {
      setBreadcrumbTitle(flow.name);
    }
    return () => {
      setBreadcrumbTitle(undefined);
    };
  }, [flow?.name, setBreadcrumbTitle]);

  if (isLoading && !flow) {
    return (
      <div className="py-24 text-center space-y-3">
        <div className="w-8 h-8 border-3 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-xs text-slate-500 font-medium">Loading scenario flow details...</p>
      </div>
    );
  }

  if (!flow) {
    return (
      <div className="py-16 text-center space-y-3">
        <h2 className="text-base font-bold text-slate-800 dark:text-slate-200">
          Flow Not Found
        </h2>
        <p className="text-xs text-slate-500">
          The requested scenario flow does not exist or was deleted.
        </p>
        <Link
          href={projectId ? ROUTES.PROJECT_SCENARIO_FLOWS(projectId) : ROUTES.SCENARIO_FLOWS}
          className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-purple-600 rounded-xl hover:bg-purple-500"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Back to Scenario Flows
        </Link>
      </div>
    );
  }

  const steps = flow.steps || [];
  const activeExecutionStep = latestExecution?.steps?.[selectedStepIndex] || null;

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <ScenarioFlowDetailHeader
        flow={flow}
        projectId={projectId}
        environments={environments}
        selectedEnvironmentType={selectedEnvironmentType}
        setSelectedEnvironmentType={setSelectedEnvironmentType}
        targetMode={targetMode}
        setTargetMode={setTargetMode}
        viewMode={viewMode}
        onToggleViewMode={setViewMode}
        onAutoArrange={handleAutoArrange}
        isRunning={isRunning}
        elapsedMs={elapsedMs}
        onRunFlow={handleRunFlow}
        onExport={handleExport}
        onOpenAddStep={() => {
          setEditingStep(null);
          setIsAddStepModalOpen(true);
        }}
        onOpenHistory={() => setIsHistoryModalOpen(true)}
        onOpenEditFlow={() => setIsEditFlowModalOpen(true)}
      />

      {/* Mode 1: Interactive Diagram Flow Canvas */}
      {viewMode === 'canvas' ? (
        <div className="relative">
          <ScenarioFlowCanvas
            flow={flow}
            stepPositions={stepPositions}
            selectedStepIndex={selectedStepIndex}
            latestExecution={latestExecution}
            isRunning={isRunning}
            isInspectorOpen={isInspectorOpen}
            onPositionChange={updateStepPosition}
            onSelectStep={setSelectedStepIndex}
            onToggleInspector={() => setIsInspectorOpen((prev) => !prev)}
            onAutoArrange={handleAutoArrange}
            onOpenAddStep={() => {
              setEditingStep(null);
              setIsAddStepModalOpen(true);
            }}
            onEditStep={(step) => {
              setEditingStep(step);
              setIsAddStepModalOpen(true);
            }}
            onDeleteStep={handleDeleteStep}
            onToggleStepEnabled={handleToggleStepEnabled}
          />
        </div>
      ) : (
        /* Mode 2: Classic 2-Column List Layout */
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Column: Chained Steps Sequence (col-span-5) */}
          <div className="lg:col-span-5 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                <Layers className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                <span>{SCENARIO_FLOW_DETAIL_TEXT.STEPS_HEADER}</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] bg-purple-100 dark:bg-purple-950/60 text-purple-600 dark:text-purple-300 font-mono">
                  {steps.length}
                </span>
              </h2>

              <button
                onClick={() => {
                  setEditingStep(null);
                  setIsAddStepModalOpen(true);
                }}
                className="inline-flex items-center gap-1 text-xs font-semibold text-purple-600 dark:text-purple-400 hover:text-purple-500 transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Step</span>
              </button>
            </div>

            {steps.length === 0 ? (
              <div className="py-12 px-6 text-center border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-2xl bg-white/40 dark:bg-slate-900/30 space-y-3">
                <GitFork className="w-8 h-8 mx-auto text-purple-500/60" />
                <div className="space-y-1">
                  <h3 className="text-xs font-bold text-slate-800 dark:text-slate-200">
                    {SCENARIO_FLOW_DETAIL_TEXT.NO_STEPS_TITLE}
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    {SCENARIO_FLOW_DETAIL_TEXT.NO_STEPS_DESC}
                  </p>
                </div>
                <button
                  onClick={() => {
                    setEditingStep(null);
                    setIsAddStepModalOpen(true);
                  }}
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-purple-600 rounded-xl hover:bg-purple-500"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Add First Step
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {steps.map((step, idx) => (
                  <StepCard
                    key={step.id}
                    step={step}
                    index={idx}
                    totalSteps={steps.length}
                    isSelected={selectedStepIndex === idx}
                    isRunning={isRunning}
                    executionStep={latestExecution?.steps?.[idx] || null}
                    onSelect={() => setSelectedStepIndex(idx)}
                    onDoubleClick={() => {
                      setSelectedStepIndex(idx);
                      setIsInspectorOpen(true);
                    }}
                    onEdit={(s) => {
                      setEditingStep(s);
                      setIsAddStepModalOpen(true);
                    }}
                    onDelete={handleDeleteStep}
                    onToggleEnabled={handleToggleStepEnabled}
                    onMoveUp={() => handleMoveStep(idx, 'up')}
                    onMoveDown={() => handleMoveStep(idx, 'down')}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Right Column: Real-Time Runner & Inspector (col-span-7) */}
          <div className="lg:col-span-7 space-y-5">
            <h2 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
              <Activity className="w-4 h-4 text-indigo-500" />
              <span>{SCENARIO_FLOW_DETAIL_TEXT.RUNNER_HEADER}</span>
            </h2>

            <FlowExecutionPanel
              execution={latestExecution}
              flowName={flow.name}
              selectedStepIndex={selectedStepIndex}
              isRunning={isRunning}
              elapsedMs={elapsedMs}
              onSelectStep={setSelectedStepIndex}
            />

            <StepExecutionInspector step={activeExecutionStep} isRunning={isRunning} />
          </div>
        </div>
      )}

      {/* Slide-over Live Runner & Inspector Drawer */}
      <StepInspectorDrawer
        isOpen={isInspectorOpen}
        onClose={() => setIsInspectorOpen(false)}
        flow={flow}
        latestExecution={latestExecution}
        selectedStepIndex={selectedStepIndex}
        isRunning={isRunning}
        elapsedMs={elapsedMs}
        onSelectStep={setSelectedStepIndex}
      />

      {/* Modals */}
      <AddStepModal
        isOpen={isAddStepModalOpen}
        onClose={() => {
          setIsAddStepModalOpen(false);
          setEditingStep(null);
        }}
        editingStep={editingStep}
        projectApis={projectApis}
        projects={projects}
        environments={environments}
        stepCount={steps.length}
        onSave={handleSaveStep}
      />

      <ExecutionHistoryModal
        isOpen={isHistoryModalOpen}
        onClose={() => setIsHistoryModalOpen(false)}
        flowName={flow.name}
        executions={flow.executions || []}
        onSelectExecution={(exec) => {
          setLatestExecution(exec);
          setSelectedStepIndex(0);
        }}
      />

      <EditFlowModal
        isOpen={isEditFlowModalOpen}
        onClose={() => setIsEditFlowModalOpen(false)}
        flow={flow}
        environments={environments}
        onSave={handleUpdateFlow}
      />
    </div>
  );
};
