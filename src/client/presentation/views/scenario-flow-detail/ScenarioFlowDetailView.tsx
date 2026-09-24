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
import {
  SCENARIO_FLOW_DETAIL_TEXT,
  SCENARIO_FLOW_DETAIL_SEMANTIC_ID,
} from './constant';
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
import { ScrollToTopButton } from '@/src/client/presentation/components/shared/ScrollToTopButton';

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
    targetMode,
    setTargetMode,
    isRunning,
    elapsedMs,
    runningProgress,
    latestExecution,
    batchExecutions,
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
    handleRunStep,
    runningStepId,
    handleExport,
    loadScenariosForApi,
    handleSelectExecution,
    handleExportExecutionLog,
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
        <p className="text-xs text-slate-500 font-medium">
          {SCENARIO_FLOW_DETAIL_TEXT.LOADING_TITLE}
        </p>
      </div>
    );
  }

  if (!flow) {
    return (
      <div className="py-16 text-center space-y-3">
        <h2 className="text-base font-bold text-slate-800 dark:text-slate-200">
          {SCENARIO_FLOW_DETAIL_TEXT.NOT_FOUND_TITLE}
        </h2>
        <p className="text-xs text-slate-500">
          {SCENARIO_FLOW_DETAIL_TEXT.NOT_FOUND_DESC}
        </p>
        <Link
          href={projectId ? ROUTES.PROJECT_SCENARIO_FLOWS(projectId) : ROUTES.SCENARIO_FLOWS}
          className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-purple-600 rounded-xl hover:bg-purple-500"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> {SCENARIO_FLOW_DETAIL_TEXT.BACK_TO_SCENARIO_FLOWS}
        </Link>
      </div>
    );
  }

  const steps = flow.steps || [];
  const currentStep = steps[selectedStepIndex] || null;
  const activeExecutionStep =
    (currentStep && latestExecution?.steps?.find((s) => s.flowStepId === currentStep.id)) ||
    latestExecution?.steps?.[selectedStepIndex] ||
    (latestExecution?.steps?.length === 1 ? latestExecution.steps[0] : null);

  return (
    <div id={SCENARIO_FLOW_DETAIL_SEMANTIC_ID.CONTAINER} className="space-y-6">
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
        runningProgress={runningProgress}
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
            runningStepId={runningStepId}
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
            onRunStep={(step) => handleRunStep(step)}
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
                id={SCENARIO_FLOW_DETAIL_SEMANTIC_ID.ADD_STEP_BTN}
                onClick={() => {
                  setEditingStep(null);
                  setIsAddStepModalOpen(true);
                }}
                className="inline-flex items-center gap-1 text-xs font-semibold text-purple-600 dark:text-purple-400 hover:text-purple-500 transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>{SCENARIO_FLOW_DETAIL_TEXT.ADD_STEP_BTN}</span>
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
                  {SCENARIO_FLOW_DETAIL_TEXT.ADD_FIRST_STEP}
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {steps.map((step, idx) => {
                  const execStep =
                    latestExecution?.steps?.find((s) => s.flowStepId === step.id) ||
                    (latestExecution?.steps?.length === steps.length ? latestExecution?.steps?.[idx] : null) ||
                    null;

                  return (
                    <StepCard
                      key={step.id}
                      step={step}
                      index={idx}
                      totalSteps={steps.length}
                      isSelected={selectedStepIndex === idx}
                      isRunning={isRunning}
                      isRunningStep={runningStepId === step.id}
                      executionStep={execStep}
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
                      onRunStep={(s) => handleRunStep(s, idx)}
                    />
                  );
                })}
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
              executions={batchExecutions}
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
        batchExecutions={batchExecutions}
        selectedStepIndex={selectedStepIndex}
        isRunning={isRunning}
        elapsedMs={elapsedMs}
        runningProgress={runningProgress}
        onRunFlow={handleRunFlow}
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
        projectId={flow.projectId}
        onSave={handleSaveStep}
        onLoadScenarios={loadScenariosForApi}
      />

      <ExecutionHistoryModal
        isOpen={isHistoryModalOpen}
        onClose={() => setIsHistoryModalOpen(false)}
        flowName={flow.name}
        executions={flow.executions || []}
        onSelectExecution={handleSelectExecution}
        onExportExecution={handleExportExecutionLog}
      />

      <EditFlowModal
        isOpen={isEditFlowModalOpen}
        onClose={() => setIsEditFlowModalOpen(false)}
        flow={flow}
        environments={environments}
        onSave={handleUpdateFlow}
      />

      {/* Scroll to Top */}
      <ScrollToTopButton />
    </div>
  );
};
