'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useDatabaseStore } from '@/src/presentation/stores/databaseStore';
import { useUIStore } from '@/src/presentation/stores/uiStore';
import { RequestScenario } from '@/src/domain/request-scenario/entity/request_scenario';
import { ResponseScenario } from '@/src/domain/response-scenario/entity/response_scenario';
import { useEnvironmentOverrideActions } from './useEnvironmentOverrideActions';
import { useRequestScenarioActions } from './useRequestScenarioActions';
import { useResponseScenarioActions } from './useResponseScenarioActions';

export function useApiDetailViewModel() {
  const { projectId, apiId } = useParams<{ projectId: string; apiId: string }>();
  const router = useRouter();
  const { addToast } = useUIStore();

  const {
    db,
    toggleApiCollectionStatus,
    upsertApiEnvironment,
    createRequestScenario,
    updateRequestScenario,
    toggleRequestScenarioStatus,
    duplicateRequestScenario,
    deleteRequestScenario,
    createResponseScenario,
    updateResponseScenario,
    toggleResponseScenarioStatus,
    duplicateResponseScenario,
    deleteResponseScenario,
  } = useDatabaseStore();

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

  const api = db.apiCollections.find((a) => a.id === apiId);
  const project = db.projects.find((p) => p.id === projectId);
  const projectEnvs = db.environments.filter((e) => e.projectId === projectId && !e.deletedAt);

  const reqScenarios = db.requestScenarios
    .filter((r) => r.apiId === apiId && !r.deletedAt)
    .sort((a, b) => b.priority - a.priority);

  const activeReqScenario =
    reqScenarios.find((r) => r.id === selectedReqScenarioId) || reqScenarios[0] || null;

  const respScenarios = activeReqScenario
    ? db.responseScenarios
        .filter((res) => res.requestScenarioId === activeReqScenario.id && !res.deletedAt)
        .sort((a, b) => b.priority - a.priority || b.weight - a.weight)
    : [];

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
