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

const COACH_MARK_STORAGE_KEY = 'mock_api_studio_coach_mark_guidance';

type StoredCoachMarkState = {
  progress: OnboardingProgress;
  tourActive: boolean;
  completedAll: boolean;
};

const isCompletedAll = (progress: OnboardingProgress) =>
  progress.createProject === 'completed' &&
  progress.addApi === 'completed' &&
  progress.createRequestScenario === 'completed' &&
  progress.createResponseScenario === 'completed';

const getDefaultState = (): Pick<OnboardingState, 'progress' | 'tourActive' | 'completedAll'> => ({
  progress: defaultProgress,
  tourActive: true,
  completedAll: false,
});

const readStoredState = (): Pick<OnboardingState, 'progress' | 'tourActive' | 'completedAll'> | null => {
  if (typeof window === 'undefined') return null;

  try {
    const raw = window.localStorage.getItem(COACH_MARK_STORAGE_KEY);
    if (!raw) return null;

    const parsed = JSON.parse(raw) as Partial<StoredCoachMarkState> | null;
    const progress = parsed?.progress;
    if (
      !progress ||
      typeof progress !== 'object' ||
      progress.dashboardNavigated !== 'completed' && progress.dashboardNavigated !== 'not-started'
    ) {
      return null;
    }

    const normalizedProgress: OnboardingProgress = {
      dashboardNavigated: progress.dashboardNavigated === 'completed' ? 'completed' : 'not-started',
      createProject: progress.createProject === 'completed' ? 'completed' : 'not-started',
      addApi: progress.addApi === 'completed' ? 'completed' : 'not-started',
      createRequestScenario: progress.createRequestScenario === 'completed' ? 'completed' : 'not-started',
      createResponseScenario: progress.createResponseScenario === 'completed' ? 'completed' : 'not-started',
    };

    const completedAll = parsed?.completedAll ?? isCompletedAll(normalizedProgress);
    const tourActive = completedAll ? false : parsed?.tourActive ?? true;

    return {
      progress: normalizedProgress,
      tourActive,
      completedAll,
    };
  } catch {
    return null;
  }
};

const persistState = (state: Pick<OnboardingState, 'progress' | 'tourActive' | 'completedAll'>) => {
  if (typeof window === 'undefined') return;

  try {
    const payload: StoredCoachMarkState = {
      progress: state.progress,
      tourActive: state.completedAll ? false : state.tourActive,
      completedAll: state.completedAll,
    };
    window.localStorage.setItem(COACH_MARK_STORAGE_KEY, JSON.stringify(payload));
  } catch {
    // Ignore storage failures and keep the onboarding flow functional.
  }
};

export const useOnboardingStore = create<OnboardingState>((set, get) => ({
  progress: defaultProgress,
  tourActive: false,
  completedAll: false,
  isInitialized: false,

  initialize: () => {
    const storedState = readStoredState();

    if (storedState) {
      set({ ...storedState, isInitialized: true });
      return;
    }

    const defaultState = getDefaultState();
    persistState(defaultState);
    set({ ...defaultState, isInitialized: true });
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

    const nextState = {
      progress: updatedProgress,
      completedAll,
      tourActive: !completedAll,
    };

    persistState(nextState);
    set(nextState);
  },

  resetTour: () => {
    const nextState = getDefaultState();
    persistState(nextState);
    set(nextState);
  },

  disableTour: () => {
    const nextState = {
      progress: get().progress,
      tourActive: false,
      completedAll: get().completedAll,
    };
    persistState(nextState);
    set({ tourActive: false });
  },
}));