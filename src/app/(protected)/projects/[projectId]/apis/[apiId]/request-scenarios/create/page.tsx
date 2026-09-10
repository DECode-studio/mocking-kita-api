import RequestScenarioEditorView from '@/src/presentation/views/request-scenario-editor/RequestScenarioEditorView';
import { createApiDetailUseCase } from '@/src/di/usecase_provider';

interface CreateRequestScenarioPageProps {
  params: Promise<{ projectId: string; apiId: string }>;
}

export default async function CreateRequestScenarioPage({ params }: CreateRequestScenarioPageProps) {
  const { projectId, apiId } = await params;
  const apiDetailUseCase = createApiDetailUseCase();
  const initialDetail = await apiDetailUseCase.load(projectId, apiId);

  return (
    <RequestScenarioEditorView
      projectId={projectId}
      apiId={apiId}
      initialDetail={initialDetail}
    />
  );
}
