import { getService, CLIENT_DI_TOKENS } from '@/src/core/di';
import ApiDetailView from '@/src/client/presentation/views/api-detail/ApiDetailView';

interface ApiDetailPageProps {
  params: Promise<{ projectId: string; apiId: string }>;
}

export default async function ApiDetailPage({ params }: ApiDetailPageProps) {
  const { projectId, apiId } = await params;
  const apiDetailUseCase = getService(CLIENT_DI_TOKENS.apiDetailUseCase);
  const initialDetail = await apiDetailUseCase.load(projectId, apiId);

  return <ApiDetailView initialDetail={initialDetail} />;
}
