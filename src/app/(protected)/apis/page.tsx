import ApiCollectionsView from '@/src/client/presentation/views/api-collections/ApiCollectionsView';
import { getService, CLIENT_DI_TOKENS } from '@/src/core/di';

export default async function ApiCollectionsPage() {
  const apiUseCase = getService(CLIENT_DI_TOKENS.apiUseCase);
  const initialApis = await apiUseCase.getAllApis();
  return <ApiCollectionsView initialApis={initialApis} />;
}
