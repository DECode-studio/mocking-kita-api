'use client';

import { create } from 'zustand';

export interface OnboardingProgress {
  dashboardNavigated: 'not-started' | 'completed';
  createProject: 'not-started' | 'completed';
  addApi: 'not-started' | 'completed';
  createRequestScenario: 'not-started' | 'completed';
  createResponseScenario: 'not-started' | 'completed';
}

interface OnboardingState {
  progress: OnboardingProgress;
  tourActive: boolean;
  completedAll: boolean;
  isInitialized: boolean;

  // Actions
  initialize: () => void;
  completeStep: (step: keyof OnboardingProgress) => void;
  resetTour: () => void;
  disableTour: () => void;
}

const defaultProgress: OnboardingProgress = {
  dashboardNavigated: 'not-started',
  createProject: 'not-started',
  addApi: 'not-started',
  createRequestScenario: 'not-started',
  createResponseScenario: 'not-started',
};

const STORAGE_KEY = 'mock_api_studio_onboarding_progress';
const DISABLED_KEY = 'mock_api_studio_onboarding_disabled';

export const useOnboardingStore = create<OnboardingState>((set, get) => ({
  progress: defaultProgress,
  tourActive: false,
  completedAll: false,
  isInitialized: false,

  initialize: () => {
    if (typeof window === 'undefined') return;

    const isDisabled = localStorage.getItem(DISABLED_KEY) === 'true';
    if (isDisabled) {
      set({ isInitialized: true, tourActive: false });
      return;
    }

    const savedProgress = localStorage.getItem(STORAGE_KEY);
    if (savedProgress) {
      try {
        const parsed = JSON.parse(savedProgress);
        const completedAll =
          parsed.createResponseScenario === 'completed' &&
          parsed.createRequestScenario === 'completed' &&
          parsed.addApi === 'completed' &&
          parsed.createProject === 'completed';
        
        set({
          progress: parsed,
          tourActive: !completedAll,
          completedAll,
          isInitialized: true,
        });
        return;
      } catch {
        // Fallback to default
      }
    }

    // First time user
    set({
      progress: defaultProgress,
      tourActive: true,
      completedAll: false,
      isInitialized: true,
    });
  },

  completeStep: (step) => {
    const currentProgress = get().progress;
    if (currentProgress[step] === 'completed') return;

    const updatedProgress = {
      ...currentProgress,
      [step]: 'completed' as const,
    };

    const completedAll =
      updatedProgress.createProject === 'completed' &&
      updatedProgress.addApi === 'completed' &&
      updatedProgress.createRequestScenario === 'completed' &&
      updatedProgress.createResponseScenario === 'completed';

    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedProgress));
    }

    set({
      progress: updatedProgress,
      completedAll,
      tourActive: !completedAll,
    });
  },

  resetTour: () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(STORAGE_KEY);
      localStorage.removeItem(DISABLED_KEY);
    }
    set({
      progress: defaultProgress,
      tourActive: true,
      completedAll: false,
    });
  },

  disableTour: () => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(DISABLED_KEY, 'true');
    }
    set({
      tourActive: false,
    });
  },
}));
