'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useUIStore } from '@/src/presentation/stores/uiStore';
import { RequestScenario } from '@/src/domain/request-scenario/entity/request_scenario';
import { ResponseScenario } from '@/src/domain/response-scenario/entity/response_scenario';
import {
  ApiDetailSnapshot,
  ApiDetailUseCaseImpl,
} from '@/src/domain/api/usecase/api_detail_usecase';
import { ProjectRemoteRepository } from '@/src/data/project/repository/project_repository';
import { ApiCollectionRemoteRepository } from '@/src/data/api/repository/api_repository';
import { EnvironmentRemoteRepository } from '@/src/data/environment/repository/environment_repository';
import { ApiEnvironmentRemoteRepository } from '@/src/data/api/repository/api_environment_repository';
import { RequestScenarioRemoteRepository } from '@/src/data/request-scenario/repository/request_scenario_repository';
import { ResponseScenarioRemoteRepository } from '@/src/data/response-scenario/repository/response_scenario_repository';
import { useEnvironmentOverrideActions } from './useEnvironmentOverrideActions';
import { useRequestScenarioActions } from './useRequestScenarioActions';
import { useResponseScenarioActions } from './useResponseScenarioActions';

const apiDetailUseCase = new ApiDetailUseCaseImpl(
  new ProjectRemoteRepository(),
  new ApiCollectionRemoteRepository(),
  new EnvironmentRemoteRepository(),
  new ApiEnvironmentRemoteRepository(),
  new RequestScenarioRemoteRepository(),
  new ResponseScenarioRemoteRepository()
);

const emptySnapshot: ApiDetailSnapshot = {
  project: null,
  api: null,
  projectEnvs: [],
  apiEnvironments: [],
  requestScenarios: [],
  responseScenarios: [],
  activeResponseScenarios: [],
  activeReqScenario: null,
};

export function useApiDetailViewModel() {
  const { projectId, apiId } = useParams<{ projectId: string; apiId: string }>();
  const router = useRouter();
  const { addToast } = useUIStore();

  const [db, setDb] = useState<ApiDetailSnapshot>(emptySnapshot);

  const reloadDatabase = async () => {
    try {
      const data = await apiDetailUseCase.load(projectId || '', apiId || '', selectedReqScenarioId);
      setDb(data);
    } catch {
      // fallback
    }
  };

  useEffect(() => {
    reloadDatabase();
  }, []);

  const [activeMainTab, setActiveMainTab] = useState('scenarios');
  const [scenarioSearch, setScenarioSearch] = useState('');
  const [selectedReqScenarioId, setSelectedReqScenarioId] = useState<string | null>(null);
  const [isReqModalOpen, setIsReqModalOpen] = useState(false);
  const [editingReqScenario, setEditingReqScenario] = useState<RequestScenario | null>(null);
  const [isRespModalOpen, setIsRespModalOpen] = useState(false);
  const [editingRespScenario, setEditingRespScenario] = useState<ResponseScenario | null>(null);
  const [deletingReqId, setDeletingReqId] = useState<string | null>(null);
  const [deletingRespId, setDeletingRespId] = useState<string | null>(null);
  const [copiedUrl, setCopiedUrl] = useState<string | null>(null);

  const api = db.api;
  const project = db.project;
  const projectEnvs = db.projectEnvs;
  const reqScenarios = db.requestScenarios;

  const activeReqScenario =
    db.activeReqScenario || reqScenarios.find((r) => r.id === selectedReqScenarioId) || reqScenarios[0] || null;

  const respScenarios = db.activeResponseScenarios;

  const toggleApiCollectionStatus = async (id: string) => {
    if (!api) return;
    await apiDetailUseCase.toggleApiStatus(id);
    await reloadDatabase();
  };

  const createRequestScenario = async (input: any): Promise<any> => {
    const res = await apiDetailUseCase.createRequestScenario(input);
    await reloadDatabase();
    return res;
  };

  const updateRequestScenario = async (id: string, input: any): Promise<any> => {
    const res = await apiDetailUseCase.updateRequestScenario(id, input);
    await reloadDatabase();
    return res;
  };

  const createResponseScenario = async (input: any): Promise<any> => {
    const res = await apiDetailUseCase.createResponseScenario(input);
    await reloadDatabase();
    return res;
  };

  const updateResponseScenario = async (id: string, input: any): Promise<any> => {
    const res = await apiDetailUseCase.updateResponseScenario(id, input);
    await reloadDatabase();
    return res;
  };

  const upsertApiEnvironment = async (input: any): Promise<void> => {
    await apiDetailUseCase.upsertApiEnvironment(input);
    await reloadDatabase();
  };

  const handleCopyResolvedUrl = (url: string) => {
    navigator.clipboard.writeText(url);
    setCopiedUrl(url);
    setTimeout(() => setCopiedUrl(null), 2000);
    addToast({ type: 'info', title: 'Copied Resolved Mock URL', description: url });
  };

  const { handleSaveReqScenario } = useRequestScenarioActions({
    apiId: apiId || '',
    editingReqScenarioId: editingReqScenario?.id || null,
    setSelectedReqScenarioId,
    setIsReqModalOpen,
    setEditingReqScenario,
    addToast,
    createRequestScenario,
    updateRequestScenario,
  });

  const { handleSaveRespScenario } = useResponseScenarioActions({
    activeReqScenarioId: activeReqScenario?.id || null,
    editingRespScenarioId: editingRespScenario?.id || null,
    setIsRespModalOpen,
    setEditingRespScenario,
    addToast,
    createResponseScenario,
    updateResponseScenario,
  });

  const {
    environmentRows,
    handleToggleEnabled,
    handleUpdatePathOverride,
  } = useEnvironmentOverrideActions({
    apiId: apiId || '',
    apiPath: api?.path || '',
    projectEnvs,
    apiEnvironments: db.apiEnvironments,
    upsertApiEnvironment,
  });

  const toggleRequestScenarioStatus = async (id: string) => {
    await apiDetailUseCase.toggleRequestScenarioStatus(id);
    await reloadDatabase();
  };

  const duplicateRequestScenario = async (id: string) => {
    await apiDetailUseCase.duplicateRequestScenario(id);
    await reloadDatabase();
  };

  const deleteRequestScenario = async (id: string) => {
    await apiDetailUseCase.deleteRequestScenario(id);
    await reloadDatabase();
  };

  const toggleResponseScenarioStatus = async (id: string) => {
    await apiDetailUseCase.toggleResponseScenarioStatus(id);
    await reloadDatabase();
  };

  const duplicateResponseScenario = async (id: string) => {
    await apiDetailUseCase.duplicateResponseScenario(id);
    await reloadDatabase();
  };

  const deleteResponseScenario = async (id: string) => {
    await apiDetailUseCase.deleteResponseScenario(id);
    await reloadDatabase();
  };

  return {
    db,
    projectId,
    project,
    api,
    projectEnvs,
    reqScenarios,
    respScenarios,
    activeReqScenario,
    activeMainTab,
    setActiveMainTab,
    scenarioSearch,
    setScenarioSearch,
    selectedReqScenarioId,
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
    setCopiedUrl,
    router,
    handleSaveReqScenario,
    handleSaveRespScenario,
    handleCopyResolvedUrl,
    environmentRows,
    handleToggleEnabled,
    handleUpdatePathOverride,
    createRequestScenario,
    updateRequestScenario,
    toggleApiCollectionStatus,
    upsertApiEnvironment,
    toggleRequestScenarioStatus,
    duplicateRequestScenario,
    deleteRequestScenario,
    createResponseScenario,
    updateResponseScenario,
    toggleResponseScenarioStatus,
    duplicateResponseScenario,
    deleteResponseScenario,
  };
}
