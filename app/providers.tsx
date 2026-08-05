'use client';

import { useEffect } from 'react';
import type { ReactNode } from 'react';
import { ErrorBoundary } from '@/src/presentation/components/shared/ErrorBoundary';
import { useAuthStore } from '@/src/presentation/stores/authStore';
import { useThemeStore } from '@/src/core/theme/themeStore';

export function Providers({ children }: { children: ReactNode }) {
  useEffect(() => {
    void useThemeStore.getState().initTheme();
    void useAuthStore.getState().checkAuth();
  }, []);

  return <ErrorBoundary>{children}</ErrorBoundary>;
}
