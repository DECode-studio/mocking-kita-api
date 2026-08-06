import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useUIStore } from '@/src/presentation/stores/uiStore';
import { MockApiDatabase } from '@/src/core/db/mock-api-database';
import { DatabaseSnapshotUseCase } from '@/src/domain/database/usecase/database_snapshot_usecase';
import { ROUTES } from '@/src/core/constants/routes';

const emptyDb: MockApiDatabase = {
  version: '1.0.0',
  projects: [],
  environments: [],
  collections: [],
  apiCollections: [],
  apiEnvironments: [],
  requestScenarios: [],
  responseScenarios: [],
};

export function useDashboardViewModel(
  databaseSnapshotUseCase: DatabaseSnapshotUseCase,
  initialDb: MockApiDatabase = emptyDb
) {
  const [db, setDb] = useState<MockApiDatabase>(initialDb);
  const { setImportModalOpen } = useUIStore();
  const router = useRouter();

  useEffect(() => {
    databaseSnapshotUseCase.getDatabase().then(setDb).catch(() => {});
  }, []);

  const activeProjects = db.projects.filter((p) => !p.deletedAt && p.status);
  const activeApis = db.apiCollections.filter((a) => !a.deletedAt && a.status);
  const activeReqs = db.requestScenarios.filter((r) => !r.deletedAt && r.status);
  const activeResps = db.responseScenarios.filter((res) => !res.deletedAt && res.status);

  const methodCounts: Record<string, number> = {};
  db.apiCollections.forEach((a) => {
    if (!a.deletedAt) {
      methodCounts[a.methodRequest] = (methodCounts[a.methodRequest] || 0) + 1;
    }
  });

  const totalApisCount = db.apiCollections.filter((a) => !a.deletedAt).length;

  const goToProjects = () => router.push(ROUTES.PROJECTS);
  const openImportExport = () => setImportModalOpen(true);

  return {
    db,
    router,
    activeProjects,
    activeApis,
    activeReqs,
    activeResps,
    methodCounts,
    totalApisCount,
    goToProjects,
    openImportExport,
  };
}
