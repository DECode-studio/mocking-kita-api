'use client';

import { useEffect } from 'react';
import type { ReactNode } from 'react';
import { ErrorBoundary } from '@/src/presentation/components/shared/ErrorBoundary';
import { configureAuthStore, useAuthStore } from '@/src/presentation/stores/authStore';
import { useThemeStore } from '@/src/core/theme/themeStore';
import {  createAuthUseCase  } from '@/src/di/usecase_provider';

configureAuthStore(createAuthUseCase());

export function Providers({ children }: { children: ReactNode }) {
  useEffect(() => {
    void useThemeStore.getState().initTheme();
    void useAuthStore.getState().checkAuth();
  }, []);

  return <ErrorBoundary>{children}</ErrorBoundary>;
}
