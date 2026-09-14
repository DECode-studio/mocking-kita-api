'use client';

import { getService, CLIENT_DI_TOKENS } from '@/src/core/di';

import { useEffect } from 'react';
import type { ReactNode } from 'react';
import { ErrorBoundary } from '@/src/client/presentation/components/shared/ErrorBoundary';
import { PageLoadingOverlayProvider } from '@/src/client/presentation/components/shared/PageLoadingOverlay';
import { configureAuthStore, useAuthStore } from '@/src/client/presentation/stores/authStore';
import { useThemeStore } from '@/src/core/theme/themeStore';

configureAuthStore(getService(CLIENT_DI_TOKENS.authUseCase));

export function Providers({ children }: { children: ReactNode }) {
  useEffect(() => {
    void useThemeStore.getState().initTheme();
    void useAuthStore.getState().checkAuth();
  }, []);

  return (
    <ErrorBoundary>
      <PageLoadingOverlayProvider>{children}</PageLoadingOverlayProvider>
    </ErrorBoundary>
  );
}