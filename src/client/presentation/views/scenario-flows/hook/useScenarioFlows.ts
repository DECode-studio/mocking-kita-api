'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { ScenarioFlow } from '@/src/client/domain/scenario-flow/entity/scenario_flow';
import { Environment } from '@/src/client/domain/environment/entity/environment';
import { Project } from '@/src/client/domain/project/entity/project';
import { getService, CLIENT_DI_TOKENS } from '@/src/core/di';
import { useUIStore } from '@/src/client/presentation/stores/uiStore';
import { getErrorMessage } from '@/src/core/utils/error';
import { ROUTES } from '@/src/core/constants/routes';

export function useScenarioFlows(projectId?: string) {
  const router = useRouter();
  const [flows, setFlows] = useState<ScenarioFlow[]>([]);
  const [environments, setEnvironments] = useState<Environment[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterProjectId, setFilterProjectId] = useState<string>(projectId || 'ALL');

  // Modals
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [runningFlowId, setRunningFlowId] = useState<string | null>(null);

  const addToast = useUIStore((state) => state.addToast);

  const flowUseCase = useMemo(() => getService(CLIENT_DI_TOKENS.scenarioFlowUseCase), []);
  const envUseCase = useMemo(() => getService(CLIENT_DI_TOKENS.environmentUseCase), []);
  const projectUseCase = useMemo(() => getService(CLIENT_DI_TOKENS.projectUseCase), []);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      if (projectId) {
        const [flowList, envList, projectList] = await Promise.all([
          flowUseCase.getByProjectId(projectId),
          envUseCase.getByProjectId(projectId),
          projectUseCase.getAll(),
        ]);
        setFlows(flowList);
        setEnvironments(envList);
        setProjects(projectList.filter((p) => !p.deletedAt));
      } else {
        const [flowList, envList, projectList] = await Promise.all([
          flowUseCase.getAll(),
          envUseCase.getAll(),
          projectUseCase.getAll(),
        ]);
        setFlows(flowList);
        setEnvironments(envList);
        setProjects(projectList.filter((p) => !p.deletedAt));
      }
    } catch (err) {
      addToast({
        title: getErrorMessage(err, 'Failed to load scenario flows'),
        type: 'error',
      });
    } finally {
      setIsLoading(false);
    }
  }, [projectId, flowUseCase, envUseCase, projectUseCase, addToast]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const filteredFlows = useMemo(() => {
    return flows.filter((f) => {
      const matchesSearch =
        !searchQuery.trim() ||
        f.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (f.description && f.description.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchesProject =
        filterProjectId === 'ALL' ||
        (filterProjectId === 'CROSS_PROJECT' && !f.projectId) ||
        f.projectId === filterProjectId;

      return matchesSearch && matchesProject;
    });
  }, [flows, searchQuery, filterProjectId]);

  const handleCreateFlow = async (data: {
    projectId?: string;
    name: string;
    description?: string;
    defaultEnvironmentId?: string;
    stopOnFailure: boolean;
    variables?: Record<string, any>;
  }) => {
    try {
      const targetProjectId = data.projectId || projectId || undefined;
      const created = await flowUseCase.create({
        projectId: targetProjectId,
        name: data.name,
        description: data.description,
        defaultEnvironmentId: data.defaultEnvironmentId,
        stopOnFailure: data.stopOnFailure,
        variables: data.variables,
      });
      addToast({
        title: `Scenario flow '${created.name}' created successfully`,
        type: 'success',
      });
      setIsCreateModalOpen(false);

      if (projectId) {
        router.push(ROUTES.SCENARIO_FLOW_DETAIL(projectId, created.id));
      } else {
        router.push(ROUTES.SCENARIO_FLOW_DETAIL_GLOBAL(created.id));
      }
    } catch (err) {
      addToast({
        title: getErrorMessage(err, 'Failed to create scenario flow'),
        type: 'error',
      });
    }
  };

  const handleImportSuccess = (result: any) => {
    addToast({
      title: `Flow '${result.flowName}' imported (${result.stepsCount} steps, ${result.apisCreated} new APIs created)`,
      type: 'success',
    });
    setIsImportModalOpen(false);
    loadData();
    if (result.flowId) {
      if (projectId) {
        router.push(ROUTES.SCENARIO_FLOW_DETAIL(projectId, result.flowId));
      } else {
        router.push(ROUTES.SCENARIO_FLOW_DETAIL_GLOBAL(result.flowId));
      }
    }
  };

  const handleDeleteFlow = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete scenario flow '${name}'?`)) return;
    try {
      await flowUseCase.softDelete(id);
      addToast({
        title: `Scenario flow '${name}' deleted`,
        type: 'success',
      });
      setFlows((prev) => prev.filter((f) => f.id !== id));
    } catch (err) {
      addToast({
        title: getErrorMessage(err, 'Failed to delete flow'),
        type: 'error',
      });
    }
  };

  const handleQuickRun = async (flow: ScenarioFlow) => {
    setRunningFlowId(flow.id);
    try {
      const res = await flowUseCase.runFlow(flow.id, {
        environmentId: flow.defaultEnvironmentId,
        targetMode: 'LIVE',
      });

      const passed = res.execution.status === 'SUCCESS';
      addToast({
        title: passed
          ? `Flow '${flow.name}' passed all steps! (${res.execution.durationMs}ms)`
          : `Flow '${flow.name}' failed (${res.execution.passedSteps}/${res.execution.totalSteps} passed)`,
        type: passed ? 'success' : 'error',
      });
      loadData();
    } catch (err) {
      addToast({
        title: getErrorMessage(err, 'Failed to execute flow'),
        type: 'error',
      });
    } finally {
      setRunningFlowId(null);
    }
  };

  const handleExportFlow = (flowId: string, _flowName: string) => {
    window.open(`/api/scenario-flows/${encodeURIComponent(flowId)}/export`, '_blank');
  };

  const handleImportFlow = async (targetProjectId: string, template: any) => {
    return flowUseCase.importTemplate(targetProjectId, template);
  };

  return {
    flows: filteredFlows,
    allFlowsCount: flows.length,
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
    refresh: loadData,
  };
}
