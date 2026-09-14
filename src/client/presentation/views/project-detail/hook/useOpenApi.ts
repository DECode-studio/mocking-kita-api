import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ProjectUseCase } from '@/src/client/domain/project/usecase/project_usecase';
import { usePageLoadingOverlay } from '@/src/client/presentation/components/shared/PageLoadingOverlay';

import { getService, CLIENT_DI_TOKENS } from '@/src/core/di';

export interface UseOpenApiViewModelProps {
  projectId: string;
  projectName: string;
  onClose: () => void;
  projectUseCase?: ProjectUseCase;
}

export function useOpenApi({
  projectId,
  projectName,
  onClose,
  projectUseCase: customProjectUseCase,
}: UseOpenApiViewModelProps) {
  const projectUseCase = customProjectUseCase || getService(CLIENT_DI_TOKENS.projectUseCase);
  const router = useRouter();
  const pageLoading = usePageLoadingOverlay();
  const [activeTab, setActiveTab] = useState<'export' | 'import'>('export');
  const [importMode, setImportMode] = useState<'upsert' | 'merge' | 'replace'>('upsert');
  const [jsonText, setJsonText] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const resetMessages = () => {
    setErrorMsg(null);
    setSuccessMsg(null);
  };

  const changeTab = (tab: 'export' | 'import') => {
    setActiveTab(tab);
    resetMessages();
  };

  const handleExport = async () => {
    setLoading(true);
    resetMessages();
    await pageLoading.run(
      {
        title: `Mengunduh OpenAPI "${projectName}"`,
        description: 'Dokumentasi endpoint project sedang disiapkan sebagai file JSON.',
      },
      async () => {
        try {
          const openApiSpec = await projectUseCase.exportOpenApi(projectId);
          const jsonBlob = new Blob([JSON.stringify(openApiSpec, null, 2)], { type: 'application/json' });
          const url = URL.createObjectURL(jsonBlob);
          const link = document.createElement('a');
          link.href = url;
          link.download = `${projectName.toLowerCase().replace(/[^a-z0-9]/g, '-')}-openapi.json`;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          URL.revokeObjectURL(url);
          setSuccessMsg('OpenAPI specification downloaded successfully.');
        } catch (err: any) {
          setErrorMsg(err?.message || 'Error exporting OpenAPI file.');
        } finally {
          setLoading(false);
        }
      }
    );
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      setJsonText((event.target?.result as string) || '');
    };
    reader.readAsText(file);
  };

  const handleImport = async () => {
    if (!jsonText.trim()) {
      setErrorMsg('Please select a JSON file or paste an OpenAPI JSON specification.');
      return;
    }

    setLoading(true);
    resetMessages();

    await pageLoading.run(
      {
        title: `Mengimpor endpoint ke "${projectName}"`,
        description: 'Endpoint dari file OpenAPI sedang ditambahkan atau diperbarui.',
      },
      async () => {
        try {
          const parsedJson = JSON.parse(jsonText);
          const result = await projectUseCase.importOpenApi(projectId, parsedJson, importMode);

          if (!result.success) {
            throw new Error('Failed to import OpenAPI spec.');
          }

          if (result.updatedApiCount && result.updatedApiCount > 0) {
            setSuccessMsg(`Successfully processed OpenAPI: ${result.importedApiCount} created, ${result.updatedApiCount} updated endpoints & ${result.importedCollectionCount} collections.`);
          } else {
            setSuccessMsg(`Successfully imported ${result.importedApiCount} endpoints & ${result.importedCollectionCount} collections.`);
          }
          setTimeout(() => {
            router.refresh();
            onClose();
          }, 1200);
        } catch (err: any) {
          setErrorMsg(err?.message || 'Invalid OpenAPI JSON or import failed.');
        } finally {
          setLoading(false);
        }
      }
    );
  };

  return {
    activeTab,
    changeTab,
    importMode,
    setImportMode,
    jsonText,
    setJsonText,
    loading,
    errorMsg,
    successMsg,
    handleExport,
    handleFileUpload,
    handleImport,
  };
}
