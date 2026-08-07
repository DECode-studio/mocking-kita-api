'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useUIStore } from '@/src/presentation/stores/uiStore';
import { RequestScenario } from '@/src/domain/request-scenario/entity/request_scenario';
import { ResponseScenario } from '@/src/domain/response-scenario/entity/response_scenario';
import { ApiDetailSnapshot, ApiDetailUseCase } from '@/src/domain/api/usecase/api_detail_usecase';
import { useEnvironmentOverrideActions } from './useEnvironmentOverrideActions';
import { useRequestScenarioActions } from './useRequestScenarioActions';
import { useResponseScenarioActions } from './useResponseScenarioActions';

const emptyDetailState: ApiDetailSnapshot = {
  project: null,
  api: null,
  projectEnvs: [],
  apiEnvironments: [],
  requestScenarios: [],
  responseScenarios: [],
  activeResponseScenarios: [],
  activeReqScenario: null,
};

export function useApiDetailViewModel(
  apiDetailUseCase: ApiDetailUseCase,
  initialDetail: ApiDetailSnapshot = emptyDetailState
) {
  const { projectId, apiId } = useParams<{ projectId: string; apiId: string }>();
  const router = useRouter();
  const { addToast } = useUIStore();

  const [detail, setDetail] = useState<ApiDetailSnapshot>(initialDetail);

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

  const reloadApiDetail = async (selectedReqScenarioIdOverride: string | null = selectedReqScenarioId) => {
    try {
      const data = await apiDetailUseCase.load(projectId || '', apiId || '', selectedReqScenarioIdOverride);
      setDetail(data);
    } catch {
      // fallback
    }
  };

  useEffect(() => {
    void reloadApiDetail(selectedReqScenarioId);
  }, [projectId, apiId, selectedReqScenarioId]);

  const api = detail.api;
  const project = detail.project;
  const projectEnvs = detail.projectEnvs;
  const reqScenarios = detail.requestScenarios;

  const activeReqScenario =
    detail.activeReqScenario || reqScenarios.find((r) => r.id === selectedReqScenarioId) || reqScenarios[0] || null;

  const respScenarios = detail.activeResponseScenarios;

  const toggleApiCollectionStatus = async (id: string) => {
    if (!api) return;
    await apiDetailUseCase.toggleApiStatus(id);
    await reloadApiDetail();
  };

  const createRequestScenario = async (input: any): Promise<any> => {
    const res = await apiDetailUseCase.createRequestScenario(input);
    setSelectedReqScenarioId(res.id);
    return res;
  };

  const updateRequestScenario = async (id: string, input: any): Promise<any> => {
    const res = await apiDetailUseCase.updateRequestScenario(id, input);
    await reloadApiDetail();
    return res;
  };

  const createResponseScenario = async (input: any): Promise<any> => {
    const res = await apiDetailUseCase.createResponseScenario(input);
    await reloadApiDetail();
    return res;
  };

  const updateResponseScenario = async (id: string, input: any): Promise<any> => {
    const res = await apiDetailUseCase.updateResponseScenario(id, input);
    await reloadApiDetail();
    return res;
  };

  const upsertApiEnvironment = async (input: any): Promise<void> => {
    await apiDetailUseCase.upsertApiEnvironment(input);
    await reloadApiDetail();
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
    apiEnvironments: detail.apiEnvironments,
    upsertApiEnvironment,
  });

  const toggleRequestScenarioStatus = async (id: string) => {
    await apiDetailUseCase.toggleRequestScenarioStatus(id);
    await reloadApiDetail();
  };

  const duplicateRequestScenario = async (id: string) => {
    await apiDetailUseCase.duplicateRequestScenario(id);
    await reloadApiDetail();
  };

  const deleteRequestScenario = async (id: string) => {
    await apiDetailUseCase.deleteRequestScenario(id);
    await reloadApiDetail();
  };

  const toggleResponseScenarioStatus = async (id: string) => {
    await apiDetailUseCase.toggleResponseScenarioStatus(id);
    await reloadApiDetail();
  };

  const duplicateResponseScenario = async (id: string) => {
    await apiDetailUseCase.duplicateResponseScenario(id);
    await reloadApiDetail();
  };

  const deleteResponseScenario = async (id: string) => {
    await apiDetailUseCase.deleteResponseScenario(id);
    await reloadApiDetail();
  };

  const uploadResponseFile = async (file: File) => {
    return apiDetailUseCase.uploadResponseFile(file);
  };

  return {
    detail,
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
    uploadResponseFile,
  };
}
