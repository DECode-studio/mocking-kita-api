'use client';

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useRouter } from 'next/navigation';
import {
  ScenarioFlow,
  ScenarioFlowStep,
  ScenarioFlowExecution,
} from '@/src/client/domain/scenario-flow/entity/scenario_flow';
import { Environment } from '@/src/client/domain/environment/entity/environment';
import { ApiCollection } from '@/src/client/domain/api/entity/api_collection';
import { getService, CLIENT_DI_TOKENS } from '@/src/core/di';
import { useUIStore } from '@/src/client/presentation/stores/uiStore';
import { getErrorMessage } from '@/src/core/utils/error';

import { Project } from '@/src/client/domain/project/entity/project';

export function useScenarioFlowDetail(projectId: string | undefined, flowId: string) {
  const router = useRouter();
  const [flow, setFlow] = useState<ScenarioFlow | null>(null);
  const [environments, setEnvironments] = useState<Environment[]>([]);
  const [projectApis, setProjectApis] = useState<ApiCollection[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Runner State
  const [selectedEnvironmentType, setSelectedEnvironmentType] = useState<string>('DEVELOPMENT');
  const [selectedEnvironmentId, setSelectedEnvironmentId] = useState<string>('');
  const [targetMode, setTargetMode] = useState<'LIVE' | 'MOCK'>('LIVE');
  const [isRunning, setIsRunning] = useState(false);
  const [latestExecution, setLatestExecution] = useState<ScenarioFlowExecution | null>(null);
  const [selectedStepIndex, setSelectedStepIndex] = useState<number>(0);

  // Canvas & View State
  const [viewMode, setViewMode] = useState<'canvas' | 'list'>('canvas');
  const [stepPositions, setStepPositions] = useState<Record<string, { x: number; y: number }>>({});
  const [isInspectorOpen, setIsInspectorOpen] = useState(false);
  const savePositionsTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Modals
  const [isAddStepModalOpen, setIsAddStepModalOpen] = useState(false);
  const [editingStep, setEditingStep] = useState<ScenarioFlowStep | null>(null);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [isEditFlowModalOpen, setIsEditFlowModalOpen] = useState(false);

  const addToast = useUIStore((state) => state.addToast);

  const flowUseCase = useMemo(() => getService(CLIENT_DI_TOKENS.scenarioFlowUseCase), []);
  const envUseCase = useMemo(() => getService(CLIENT_DI_TOKENS.environmentUseCase), []);
  const apiUseCase = useMemo(() => getService(CLIENT_DI_TOKENS.apiUseCase), []);
  const projectUseCase = useMemo(() => getService(CLIENT_DI_TOKENS.projectUseCase), []);

  // Compute layout positions for steps
  const computeInitialPositions = useCallback(
    (steps: ScenarioFlowStep[], existingLayout?: Record<string, { x: number; y: number }>) => {
      const positions: Record<string, { x: number; y: number }> = {};
      steps.forEach((step, idx) => {
        if (existingLayout && existingLayout[step.id]) {
          positions[step.id] = existingLayout[step.id];
        } else {
          // Default horizontal flow layout
          positions[step.id] = {
            x: 80 + idx * 440,
            y: 120,
          };
        }
      });
      return positions;
    },
    []
  );

  const loadData = useCallback(async () => {
    if (!flowId) return;
    setIsLoading(true);
    try {
      const flowData = await flowUseCase.getById(flowId);
      setFlow(flowData);

      // Initialize step positions from flow.variables._canvasLayout
      if (flowData?.steps) {
        const savedLayout = (flowData.variables as any)?._canvasLayout as
          | Record<string, { x: number; y: number }>
          | undefined;
        setStepPositions(computeInitialPositions(flowData.steps, savedLayout));
      }

      const targetProjectId = projectId || flowData?.projectId || undefined;

      const [envList, allApis, allProjects] = await Promise.all([
        targetProjectId ? envUseCase.getByProjectId(targetProjectId) : envUseCase.getAll(),
        apiUseCase.getAllApis(),
        projectUseCase.getAll(),
      ]);

      setEnvironments(envList);
      setProjectApis(allApis.filter((a) => !a.deletedAt));
      setProjects(allProjects.filter((p) => !p.deletedAt));

      if (flowData?.defaultEnvironment?.environmentType) {
        setSelectedEnvironmentType(flowData.defaultEnvironment.environmentType);
      } else if (flowData?.defaultEnvironmentId) {
        setSelectedEnvironmentId(flowData.defaultEnvironmentId);
        const foundEnv = envList.find((e) => e.id === flowData.defaultEnvironmentId);
        if (foundEnv?.environmentType) {
          setSelectedEnvironmentType(foundEnv.environmentType);
        }
      } else if (envList.length > 0 && envList[0].environmentType) {
        setSelectedEnvironmentType(envList[0].environmentType);
      }

      if (flowData?.executions && flowData.executions.length > 0) {
        // Fetch full detail of latest execution if available
        const latestId = flowData.executions[0].id;
        const fullExec = await flowUseCase.getExecutionDetail(latestId);
        if (fullExec) {
          setLatestExecution(fullExec);
        }
      }
    } catch (err) {
      addToast({
        title: getErrorMessage(err, 'Failed to load scenario flow details'),
        type: 'error',
      });
    } finally {
      setIsLoading(false);
    }
  }, [flowId, projectId, flowUseCase, envUseCase, apiUseCase, projectUseCase, addToast, computeInitialPositions]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Debounced save step positions to database
  const persistPositions = useCallback(
    (newPositions: Record<string, { x: number; y: number }>) => {
      if (!flow) return;
      if (savePositionsTimerRef.current) {
        clearTimeout(savePositionsTimerRef.current);
      }
      savePositionsTimerRef.current = setTimeout(async () => {
        try {
          const updatedVars = {
            ...(flow.variables || {}),
            _canvasLayout: newPositions,
          };
          await flowUseCase.update(flow.id, { variables: updatedVars });
        } catch {
          // Silently handle position sync failure without blocking user
        }
      }, 600);
    },
    [flow, flowUseCase]
  );

  const updateStepPosition = useCallback(
    (stepId: string, x: number, y: number) => {
      setStepPositions((prev) => {
        const updated = {
          ...prev,
          [stepId]: { x: Math.round(x), y: Math.round(y) },
        };
        persistPositions(updated);
        return updated;
      });
    },
    [persistPositions]
  );

  const handleAutoArrange = useCallback(async () => {
    if (!flow || !flow.steps) return;
    const arranged: Record<string, { x: number; y: number }> = {};
    flow.steps.forEach((step, idx) => {
      arranged[step.id] = {
        x: 80 + idx * 440,
        y: 120,
      };
    });
    setStepPositions(arranged);
    try {
      const updatedVars = {
        ...(flow.variables || {}),
        _canvasLayout: arranged,
      };
      await flowUseCase.update(flow.id, { variables: updatedVars });
      addToast({ title: 'Flow layout auto-arranged', type: 'success' });
    } catch (err) {
      addToast({
        title: getErrorMessage(err, 'Failed to save auto-arrange layout'),
        type: 'error',
      });
    }
  }, [flow, flowUseCase, addToast]);

  // Step Operations
  const handleSaveStep = async (stepData: Partial<ScenarioFlowStep> & { name: string; stepOrder: number }) => {
    if (!flow) return;
    try {
      if (editingStep) {
        await flowUseCase.updateStep(flow.id, editingStep.id, stepData);
        addToast({ title: `Step '${stepData.name}' updated`, type: 'success' });
      } else {
        await flowUseCase.addStep(flow.id, stepData);
        addToast({ title: `Step '${stepData.name}' added to flow`, type: 'success' });
      }
      setIsAddStepModalOpen(false);
      setEditingStep(null);
      await loadData();
    } catch (err) {
      addToast({
        title: getErrorMessage(err, 'Failed to save step'),
        type: 'error',
      });
    }
  };

  const handleDeleteStep = async (stepId: string, stepName: string) => {
    if (!flow) return;
    if (!confirm(`Delete step '${stepName}'?`)) return;
    try {
      await flowUseCase.deleteStep(flow.id, stepId);
      addToast({ title: `Step '${stepName}' deleted`, type: 'success' });
      await loadData();
    } catch (err) {
      addToast({
        title: getErrorMessage(err, 'Failed to delete step'),
        type: 'error',
      });
    }
  };

  const handleToggleStepEnabled = async (step: ScenarioFlowStep) => {
    if (!flow) return;
    try {
      await flowUseCase.updateStep(flow.id, step.id, { enabled: !step.enabled });
      setFlow((prev) =>
        prev
          ? {
              ...prev,
              steps: prev.steps?.map((s) =>
                s.id === step.id ? { ...s, enabled: !s.enabled } : s
              ),
            }
          : null
      );
    } catch (err) {
      addToast({
        title: getErrorMessage(err, 'Failed to toggle step'),
        type: 'error',
      });
    }
  };

  const handleMoveStep = async (stepIndex: number, direction: 'up' | 'down') => {
    if (!flow || !flow.steps) return;
    const targetIndex = direction === 'up' ? stepIndex - 1 : stepIndex + 1;
    if (targetIndex < 0 || targetIndex >= flow.steps.length) return;

    const newSteps = [...flow.steps];
    const [moved] = newSteps.splice(stepIndex, 1);
    newSteps.splice(targetIndex, 0, moved);

    // Optimistic update
    setFlow({ ...flow, steps: newSteps });

    try {
      await flowUseCase.reorderSteps(
        flow.id,
        newSteps.map((s) => s.id)
      );
    } catch (err) {
      addToast({
        title: getErrorMessage(err, 'Failed to reorder steps'),
        type: 'error',
      });
      loadData();
    }
  };

  // Run Flow (Real Testing)
  const handleRunFlow = async () => {
    if (!flow) return;
    setIsRunning(true);
    setIsInspectorOpen(true);
    try {
      const matchedEnv = environments.find((e) => e.environmentType === selectedEnvironmentType);
      const result = await flowUseCase.runFlow(flow.id, {
        environmentType: selectedEnvironmentType,
        environmentId: matchedEnv?.id || selectedEnvironmentId || undefined,
        targetMode,
      });

      // Load full execution result
      const fullExec = await flowUseCase.getExecutionDetail(result.execution.id);
      if (fullExec) {
        setLatestExecution(fullExec);
      }

      const passed = result.execution.status === 'SUCCESS';
      addToast({
        title: passed
          ? `All ${result.execution.totalSteps} steps PASSED! (${result.execution.durationMs}ms)`
          : `Flow failed: ${result.execution.passedSteps}/${result.execution.totalSteps} passed`,
        type: passed ? 'success' : 'error',
      });
    } catch (err) {
      addToast({
        title: getErrorMessage(err, 'Failed to execute flow testing'),
        type: 'error',
      });
    } finally {
      setIsRunning(false);
    }
  };

  const handleUpdateFlow = async (data: {
    name: string;
    description?: string;
    defaultEnvironmentId?: string;
    stopOnFailure: boolean;
    variables?: Record<string, any>;
  }) => {
    if (!flow) return;
    try {
      const updated = await flowUseCase.update(flow.id, data);
      setFlow((prev) => (prev ? { ...prev, ...updated } : updated));
      addToast({ title: 'Flow details updated', type: 'success' });
      await loadData();
    } catch (err) {
      addToast({
        title: getErrorMessage(err, 'Failed to update flow details'),
        type: 'error',
      });
      throw err;
    }
  };

  const handleExport = () => {
    if (!flow) return;
    window.open(`/api/scenario-flows/${encodeURIComponent(flow.id)}/export`, '_blank');
  };

  return {
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
    refresh: loadData,
  };
}
