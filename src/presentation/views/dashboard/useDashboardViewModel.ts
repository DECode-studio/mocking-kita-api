import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useUIStore } from '@/src/presentation/stores/uiStore';
import { callDatabase } from '@/src/core/http-client/database-proxy-client';
import { MockApiDatabase } from '@/src/data/database/mock-api-database';

const emptyDb: MockApiDatabase = {
  version: '1.0.0',
  projects: [],
  environments: [],
  apiCollections: [],
  apiEnvironments: [],
  requestScenarios: [],
  responseScenarios: [],
};

export function useDashboardViewModel(initialDb: MockApiDatabase = emptyDb) {
  const [db, setDb] = useState<MockApiDatabase>(initialDb);
  const { setImportModalOpen } = useUIStore();
  const router = useRouter();

  useEffect(() => {
    callDatabase<MockApiDatabase>('getDatabase').then(setDb).catch(() => {});
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

  const goToProjects = () => router.push('/projects');
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
