'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { HelpCircle, RefreshCw } from 'lucide-react';
import { useOnboardingStore } from '@/src/presentation/stores/onboardingStore';
import { useUIStore } from '@/src/presentation/stores/uiStore';
import { SETTINGS_TEXT } from '../constant';

export const OnboardingSettingsCard: React.FC = () => {
  const { resetTour } = useOnboardingStore();
  const { addToast } = useUIStore();
  const router = useRouter();

  const handleReset = () => {
    resetTour();
    addToast({
      type: 'success',
      title: 'Tour Reset Successful',
      description: 'Panduan onboarding telah direset. Silakan ke halaman Dashboard untuk memulai kembali.',
    });
    router.push('/dashboard');
  };

  return (
    <div className="p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl space-y-4 shadow-xs">
      <div className="flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
        <HelpCircle className="w-4 h-4 text-purple-500" />
        <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100">{SETTINGS_TEXT.ONBOARDING_TITLE}</h2>
      </div>

      <div className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed font-sans">
        <p>{SETTINGS_TEXT.ONBOARDING_DESC}</p>
      </div>

      <div className="pt-2">
        <button
          type="button"
          onClick={handleReset}
          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-950/60 hover:bg-purple-100 rounded-lg transition-colors border border-purple-200 dark:border-purple-900"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          {SETTINGS_TEXT.RESTART_TOUR_BTN}
        </button>
      </div>
    </div>
  );
};
