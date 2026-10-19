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
  const [importFormat, setImportFormat] = useState<'openapi' | 'confluence_markdown'>('openapi');
  const [importMode, setImportMode] = useState<'upsert' | 'merge' | 'replace'>('upsert');
  const [jsonText, setJsonText] = useState('');
  const [markdownTexts, setMarkdownTexts] = useState<string[]>([]);
  const [selectedFileCount, setSelectedFileCount] = useState(0);
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

  const changeImportFormat = (format: 'openapi' | 'confluence_markdown') => {
    setImportFormat(format);
    setJsonText('');
    setMarkdownTexts([]);
    setSelectedFileCount(0);
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
        } catch (err: unknown) {
          setErrorMsg(err instanceof Error ? err.message : 'Error exporting OpenAPI file.');
        } finally {
          setLoading(false);
        }
      }
    );
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    resetMessages();
    setSelectedFileCount(files.length);

    if (importFormat === 'confluence_markdown' && files.length > 1) {
      const readPromises = Array.from(files).map(
        (file) =>
          new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (event) => resolve((event.target?.result as string) || '');
            reader.onerror = (err) => reject(err);
            reader.readAsText(file);
          })
      );

      try {
        const contents = await Promise.all(readPromises);
        setMarkdownTexts(contents);
        setJsonText(contents.join('\n\n---\n\n'));
      } catch {
        setErrorMsg('Failed to read uploaded markdown files.');
      }
    } else {
      const file = files[0];
      const reader = new FileReader();
      reader.onload = (event) => {
        const text = (event.target?.result as string) || '';
        setJsonText(text);
        if (importFormat === 'confluence_markdown') {
          setMarkdownTexts([text]);
        }
      };
      reader.readAsText(file);
    }
  };

  const handleImport = async () => {
    if (!jsonText.trim() && markdownTexts.length === 0) {
      setErrorMsg(
        importFormat === 'confluence_markdown'
          ? 'Please select .md file(s) or paste Confluence markdown specification.'
          : 'Please select a JSON file or paste an OpenAPI JSON specification.'
      );
      return;
    }

    setLoading(true);
    resetMessages();

    await pageLoading.run(
      {
        title: `Mengimpor endpoint ke "${projectName}"`,
        description:
          importFormat === 'confluence_markdown'
            ? 'Endpoint dari Confluence Markdown sedang ditambahkan atau diperbarui.'
            : 'Endpoint dari file OpenAPI sedang ditambahkan atau diperbarui.',
      },
      async () => {
        try {
          let result;
          if (importFormat === 'confluence_markdown') {
            const input = markdownTexts.length > 0 ? markdownTexts : jsonText;
            result = await projectUseCase.importMarkdown(projectId, input, importMode);
          } else {
            const parsedJson = JSON.parse(jsonText);
            result = await projectUseCase.importOpenApi(projectId, parsedJson, importMode);
          }

          if (!result.success) {
            throw new Error('Failed to import specification.');
          }

          const formatName = importFormat === 'confluence_markdown' ? 'Confluence Markdown' : 'OpenAPI';
          if (result.updatedApiCount && result.updatedApiCount > 0) {
            setSuccessMsg(`Successfully processed ${formatName}: ${result.importedApiCount} created, ${result.updatedApiCount} updated endpoints & ${result.importedCollectionCount} collections.`);
          } else {
            setSuccessMsg(`Successfully imported ${result.importedApiCount} endpoints & ${result.importedCollectionCount} collections from ${formatName}.`);
          }
          setTimeout(() => {
            router.refresh();
            onClose();
          }, 1200);
        } catch (err: unknown) {
          setErrorMsg(
            err instanceof Error
              ? err.message
              : importFormat === 'confluence_markdown'
              ? 'Invalid Confluence Markdown or import failed.'
              : 'Invalid OpenAPI JSON or import failed.'
          );
        } finally {
          setLoading(false);
        }
      }
    );
  };

  return {
    activeTab,
    changeTab,
    importFormat,
    changeImportFormat,
    importMode,
    setImportMode,
    jsonText,
    setJsonText,
    selectedFileCount,
    loading,
    errorMsg,
    successMsg,
    handleExport,
    handleFileUpload,
    handleImport,
  };
}
