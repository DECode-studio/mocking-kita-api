import ApiCollectionsView from '@/src/presentation/views/api-collections/ApiCollectionsView';
import { createDatabaseSnapshotUseCase } from '@/src/di/usecase_provider';

export default async function ApiCollectionsPage() {
  const databaseSnapshotUseCase = createDatabaseSnapshotUseCase();
  const initialDb = await databaseSnapshotUseCase.getDatabase();
  return <ApiCollectionsView initialApis={initialDb.apiCollections} />;
}
