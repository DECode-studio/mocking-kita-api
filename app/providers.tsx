'use client';

import { useEffect } from 'react';
import type { ReactNode } from 'react';
import { ErrorBoundary } from '@/src/presentation/components/shared/ErrorBoundary';
import { useAuthStore } from '@/src/presentation/stores/authStore';
import { useDatabaseStore } from '@/src/presentation/stores/databaseStore';
import { useSettingsStore } from '@/src/presentation/stores/settingsStore';

export function Providers({ children }: { children: ReactNode }) {
  useEffect(() => {
    void useSettingsStore.getState().initTheme();
    void useDatabaseStore.getState().loadDatabase();
    void useAuthStore.getState().checkAuth();
  }, []);

  return <ErrorBoundary>{children}</ErrorBoundary>;
}
