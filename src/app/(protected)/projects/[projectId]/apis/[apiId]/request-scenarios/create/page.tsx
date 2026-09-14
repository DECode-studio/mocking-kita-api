import { getService, CLIENT_DI_TOKENS } from '@/src/core/di';
import RequestScenarioEditorView from '@/src/client/presentation/views/request-scenario-editor/RequestScenarioEditorView';

interface CreateRequestScenarioPageProps {
  params: Promise<{ projectId: string; apiId: string }>;
}

export default async function CreateRequestScenarioPage({ params }: CreateRequestScenarioPageProps) {
  const { projectId, apiId } = await params;
  const apiDetailUseCase = getService(CLIENT_DI_TOKENS.apiDetailUseCase);
  const initialDetail = await apiDetailUseCase.load(projectId, apiId);

  return (
    <RequestScenarioEditorView
      projectId={projectId}
      apiId={apiId}
      initialDetail={initialDetail}
    />
  );
}
