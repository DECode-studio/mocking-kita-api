import ApiCollectionsView from '@/src/presentation/views/api-collections/ApiCollectionsView';
import { createDatabaseSnapshotUseCase } from '@/src/domain/database';

export default async function ApiCollectionsPage() {
  const databaseSnapshotUseCase = createDatabaseSnapshotUseCase();
  const initialDb = await databaseSnapshotUseCase.getDatabase();
  return <ApiCollectionsView initialApis={initialDb.apiCollections} />;
}
