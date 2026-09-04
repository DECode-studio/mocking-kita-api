'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useUIStore } from '@/src/presentation/stores/uiStore';
import { usePageLoadingOverlay } from '@/src/presentation/components/shared/PageLoadingOverlay';
import { RequestScenario } from '@/src/domain/request-scenario/entity/request_scenario';
import { ResponseScenario } from '@/src/domain/response-scenario/entity/response_scenario';
import { ApiDetailSnapshot, ApiDetailUseCase } from '@/src/domain/api/usecase/api_detail_usecase';
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

export function useApiDetail(
  apiDetailUseCase: ApiDetailUseCase,
  initialDetail: ApiDetailSnapshot = emptyDetailState
) {
  const { projectId, apiId } = useParams<{ projectId: string; apiId: string }>();
  const router = useRouter();
  const { addToast } = useUIStore();
  const pageLoading = usePageLoadingOverlay();

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
    await pageLoading.run(
      {
        title: `${api.status ? 'Menonaktifkan' : 'Mengaktifkan'} endpoint ${api.methodRequest} ${api.path}`,
        description: api.status
          ? 'Endpoint ini sementara tidak akan merespons request mock.'
          : 'Endpoint ini akan kembali merespons request mock.',
      },
      async () => {
        await apiDetailUseCase.toggleApiStatus(id);
        await reloadApiDetail();
      }
    );
  };

  const createRequestScenario = async (input: any): Promise<any> => {
    return pageLoading.run(
      {
        title: `Membuat skenario request "${input.name || 'baru'}"`,
        description: 'Aturan pencocokan request sedang disimpan.',
      },
      async () => {
        const res = await apiDetailUseCase.createRequestScenario(input);
        setSelectedReqScenarioId(res.id);
        return res;
      }
    );
  };

  const updateRequestScenario = async (id: string, input: any): Promise<any> => {
    return pageLoading.run(
      {
        title: `Menyimpan skenario request "${input.name || 'ini'}"`,
        description: 'Perubahan header, query, body, dan prioritas sedang disimpan.',
      },
      async () => {
        const res = await apiDetailUseCase.updateRequestScenario(id, input);
        await reloadApiDetail();
        return res;
      }
    );
  };

  const createResponseScenario = async (input: any): Promise<any> => {
    return pageLoading.run(
      {
        title: `Membuat respons "${input.name || 'baru'}"`,
        description: 'Status code, body, file, delay, dan bobot respons sedang disimpan.',
      },
      async () => {
        const res = await apiDetailUseCase.createResponseScenario(input);
        await reloadApiDetail();
        return res;
      }
    );
  };

  const updateResponseScenario = async (id: string, input: any): Promise<any> => {
    return pageLoading.run(
      {
        title: `Menyimpan respons "${input.name || 'ini'}"`,
        description: 'Perubahan payload respons sedang diterapkan.',
      },
      async () => {
        const res = await apiDetailUseCase.updateResponseScenario(id, input);
        await reloadApiDetail();
        return res;
      }
    );
  };

  const upsertApiEnvironment = async (input: any): Promise<void> => {
    await pageLoading.run(
      {
        title: 'Menyimpan URL override',
        description: 'Pengaturan endpoint untuk environment ini sedang diperbarui.',
      },
      async () => {
        await apiDetailUseCase.upsertApiEnvironment(input);
        await reloadApiDetail();
      }
    );
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
    requestScenarios: reqScenarios,
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

  const toggleRequestScenarioStatus = async (id: string) => {
    const scenario = reqScenarios.find((item) => item.id === id);
    await pageLoading.run(
      {
        title: `${scenario?.status ? 'Menonaktifkan' : 'Mengaktifkan'} skenario request${scenario ? ` "${scenario.name}"` : ''}`,
        description: scenario?.status
          ? 'Skenario ini tidak akan dipakai untuk mencocokkan request.'
          : 'Skenario ini akan bisa dipakai untuk mencocokkan request.',
      },
      async () => {
        try {
          await apiDetailUseCase.toggleRequestScenarioStatus(id);
          await reloadApiDetail();
        } catch {
          addToast({
            type: 'error',
            title: 'Status Update Failed',
            description: 'Failed to update scenario status. Please refresh the page and try again.',
          });
        }
      }
    );
  };

  const duplicateRequestScenario = async (id: string) => {
    const scenario = reqScenarios.find((item) => item.id === id);
    await pageLoading.run(
      {
        title: `Menyalin skenario request${scenario ? ` "${scenario.name}"` : ''}`,
        description: 'Salinan aturan request sedang dibuat.',
      },
      async () => {
        await apiDetailUseCase.duplicateRequestScenario(id);
        await reloadApiDetail();
      }
    );
  };

  const deleteRequestScenario = async (id: string) => {
    const scenario = reqScenarios.find((item) => item.id === id);
    await pageLoading.run(
      {
        title: `Menghapus skenario request${scenario ? ` "${scenario.name}"` : ''}`,
        description: 'Skenario request dan respons yang terkait sedang dihapus.',
      },
      async () => {
        await apiDetailUseCase.deleteRequestScenario(id);
        await reloadApiDetail();
      }
    );
  };

  const toggleResponseScenarioStatus = async (id: string) => {
    const scenario = respScenarios.find((item) => item.id === id);
    await pageLoading.run(
      {
        title: `${scenario?.status ? 'Menonaktifkan' : 'Mengaktifkan'} respons${scenario ? ` "${scenario.name}"` : ''}`,
        description: scenario?.status
          ? 'Respons ini tidak akan dipilih saat request cocok.'
          : 'Respons ini akan bisa dipilih saat request cocok.',
      },
      async () => {
        try {
          await apiDetailUseCase.toggleResponseScenarioStatus(id);
          await reloadApiDetail();
        } catch {
          addToast({
            type: 'error',
            title: 'Status Update Failed',
            description: 'Failed to update response status. Please refresh the page and try again.',
          });
        }
      }
    );
  };

  const duplicateResponseScenario = async (id: string) => {
    const scenario = respScenarios.find((item) => item.id === id);
    await pageLoading.run(
      {
        title: `Menyalin respons${scenario ? ` "${scenario.name}"` : ''}`,
        description: 'Salinan payload respons sedang dibuat.',
      },
      async () => {
        await apiDetailUseCase.duplicateResponseScenario(id);
        await reloadApiDetail();
      }
    );
  };

  const deleteResponseScenario = async (id: string) => {
    const scenario = respScenarios.find((item) => item.id === id);
    await pageLoading.run(
      {
        title: `Menghapus respons${scenario ? ` "${scenario.name}"` : ''}`,
        description: 'Payload respons ini sedang dihapus dari skenario request.',
      },
      async () => {
        await apiDetailUseCase.deleteResponseScenario(id);
        await reloadApiDetail();
      }
    );
  };

  const uploadResponseFile = async (file: File) => {
    return pageLoading.run(
      {
        title: `Mengunggah file "${file.name}"`,
        description: 'File sedang disimpan agar bisa dipakai sebagai respons mock.',
      },
      () => apiDetailUseCase.uploadResponseFile(file)
    );
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
