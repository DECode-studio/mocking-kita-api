import ApiCollectionsView from '@/src/presentation/views/api-collections/ApiCollectionsView';
import { listApis } from '@/src/data/api/api/api_collection_api_client';

export default async function ApiCollectionsPage() {
  const initialApis = await listApis();
  return <ApiCollectionsView initialApis={initialApis} />;
}
