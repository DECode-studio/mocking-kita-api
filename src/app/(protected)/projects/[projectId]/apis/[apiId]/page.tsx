import ApiDetailView from '@/src/presentation/views/api-detail/ApiDetailView';
import {  createApiDetailUseCase  } from '@/src/di/usecase_provider';

interface ApiDetailPageProps {
  params: Promise<{ projectId: string; apiId: string }>;
}

export default async function ApiDetailPage({ params }: ApiDetailPageProps) {
  const { projectId, apiId } = await params;
  const apiDetailUseCase = createApiDetailUseCase();
  const initialDetail = await apiDetailUseCase.load(projectId, apiId);

  return <ApiDetailView initialDetail={initialDetail} />;
}
