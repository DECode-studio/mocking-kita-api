import { getService, CLIENT_DI_TOKENS } from '@/src/core/di';
import RequestScenarioEditorView from '@/src/client/presentation/views/request-scenario-editor/RequestScenarioEditorView';

interface EditRequestScenarioPageProps {
  params: Promise<{ projectId: string; apiId: string; scenarioId: string }>;
}

export default async function EditRequestScenarioPage({ params }: EditRequestScenarioPageProps) {
  const { projectId, apiId, scenarioId } = await params;
  const apiDetailUseCase = getService(CLIENT_DI_TOKENS.apiDetailUseCase);
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
