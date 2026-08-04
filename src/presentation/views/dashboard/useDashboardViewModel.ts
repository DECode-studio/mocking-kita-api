'use client';

import { useRouter } from 'next/navigation';
import { useDatabaseStore } from '@/src/presentation/stores/databaseStore';
import { useUIStore } from '@/src/presentation/stores/uiStore';
import { MethodRequest } from '@/src/core/utils/types';

export function useDashboardViewModel() {
  const { db } = useDatabaseStore();
  const { setImportModalOpen } = useUIStore();
  const router = useRouter();

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
