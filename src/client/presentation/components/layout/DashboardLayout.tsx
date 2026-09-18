'use client';


import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { AppSidebar } from './AppSidebar';
import { TopNavbar } from './TopNavbar';
import { ToastContainer } from '../shared/ToastContainer';
import { ImportExportDialog } from '../../views/dashboard';
import { useAuthStore } from '../../stores/authStore';
import { ROUTES } from '@/src/core/constants/routes';
import { OnboardingTour } from './OnboardingTour';

export const DashboardLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { session, isAuthenticated, isInitialized, logout } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    if (!isInitialized) return;

    if (!isAuthenticated) {
      router.replace(ROUTES.SIGN_IN);
    } else if (session && !session.googleId && session.username.includes('@')) {
      // Force logout if user account has no linked Google ID
      logout().then(() => {
        router.replace(ROUTES.SIGN_IN);
      });
    }
  }, [isInitialized, isAuthenticated, session, router, logout]);

  if (!isInitialized || !isAuthenticated) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-purple-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-xs text-slate-400 font-mono tracking-wider uppercase">
            Loading Mock Engine state...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col lg:flex-row antialiased selection:bg-purple-500/20 selection:text-purple-500">
      <AppSidebar />

      <div className="flex-1 flex flex-col min-w-0 min-h-screen bg-grid-pattern-light dark:bg-grid-pattern-dark">
        <TopNavbar />

        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-[1600px] w-full mx-auto space-y-8">
          {children}
        </main>
      </div>

      <ToastContainer />
      <ImportExportDialog />
      <OnboardingTour />
    </div>
  );
};