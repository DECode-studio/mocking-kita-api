import RequestScenarioEditorView from '@/src/presentation/views/request-scenario-editor/RequestScenarioEditorView';
import { createApiDetailUseCase } from '@/src/di/usecase_provider';

interface RequestScenarioDetailPageProps {
  params: Promise<{ projectId: string; apiId: string; scenarioId: string }>;
}

export default async function RequestScenarioDetailPage({ params }: RequestScenarioDetailPageProps) {
  const { projectId, apiId, scenarioId } = await params;
  const apiDetailUseCase = createApiDetailUseCase();
  const initialDetail = await apiDetailUseCase.load(projectId, apiId, scenarioId);

  return (
    <RequestScenarioEditorView
      projectId={projectId}
      apiId={apiId}
      scenarioId={scenarioId}
      initialDetail={initialDetail}
    />
  );
}
