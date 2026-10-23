'use client';

import { create } from 'zustand';

export type TourTrackId =
  | 'quickstart'
  | 'system-overview'
  | 'projects-and-environments'
  | 'mock-api-engine'
  | 'scenario-flows'
  | 'scenario-flow-jobs'
  | 'data-sheets'
  | 'openapi-importers'
  | 'external-api-cicd'
  | 'admin-and-database'
  | 'faq-and-guide'
  | 'ai-tools-and-simulator'
  | 'admin-accounts'
  | 'admin-change-logs'
  | 'account-settings';

export interface OnboardingProgress {
  dashboardNavigated: 'not-started' | 'completed';
  createProject: 'not-started' | 'completed';
  addApi: 'not-started' | 'completed';
  createRequestScenario: 'not-started' | 'completed';
  createResponseScenario: 'not-started' | 'completed';
}

interface OnboardingState {
  // Legacy / Quickstart onboarding progress
  progress: OnboardingProgress;
  tourActive: boolean;
  completedAll: boolean;
  isInitialized: boolean;

  // Multi-Track Tour Engine
  activeTrackId: TourTrackId | null;
  activeTrackStepIndex: number;
  completedTrackIds: string[];

  // Actions
  initialize: () => void;
  completeStep: (step: keyof OnboardingProgress) => void;
  resetTour: () => void;
  disableTour: () => void;

  // Multi-Track Actions
  startTourTrack: (trackId: TourTrackId) => void;
  setTrackStepIndex: (index: number) => void;
  completeTrack: (trackId: TourTrackId) => void;
  stopTour: () => void;
}

const defaultProgress: OnboardingProgress = {
  dashboardNavigated: 'not-started',
  createProject: 'not-started',
  addApi: 'not-started',
  createRequestScenario: 'not-started',
  createResponseScenario: 'not-started',
};

const COACH_MARK_STORAGE_KEY = 'mock_api_studio_coach_mark_guidance';
const COMPLETED_TRACKS_STORAGE_KEY = 'mock_api_studio_completed_tracks';

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

const getDefaultState = (): Pick<OnboardingState, 'progress' | 'tourActive' | 'completedAll' | 'activeTrackId' | 'activeTrackStepIndex' | 'completedTrackIds'> => ({
  progress: defaultProgress,
  tourActive: true,
  completedAll: false,
  activeTrackId: 'quickstart',
  activeTrackStepIndex: 0,
  completedTrackIds: [],
});

const readStoredState = (): Pick<OnboardingState, 'progress' | 'tourActive' | 'completedAll' | 'completedTrackIds'> | null => {
  if (typeof window === 'undefined') return null;

  try {
    const raw = window.localStorage.getItem(COACH_MARK_STORAGE_KEY);
    const rawTracks = window.localStorage.getItem(COMPLETED_TRACKS_STORAGE_KEY);
    const completedTrackIds = rawTracks ? JSON.parse(rawTracks) : [];

    if (!raw) return null;

    const parsed = JSON.parse(raw) as Partial<StoredCoachMarkState> | null;
    const progress = parsed?.progress;
    if (
      !progress ||
      typeof progress !== 'object' ||
      (progress.dashboardNavigated !== 'completed' && progress.dashboardNavigated !== 'not-started')
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
    const tourActive = completedAll ? false : (parsed?.tourActive ?? true);

    return {
      progress: normalizedProgress,
      tourActive,
      completedAll,
      completedTrackIds: Array.isArray(completedTrackIds) ? completedTrackIds : [],
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
  activeTrackId: null,
  activeTrackStepIndex: 0,
  completedTrackIds: [],

  initialize: () => {
    const storedState = readStoredState();

    if (storedState) {
      set({
        ...storedState,
        activeTrackId: storedState.tourActive ? 'quickstart' : null,
        activeTrackStepIndex: 0,
        isInitialized: true,
      });
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
    set({ tourActive: false, activeTrackId: null, activeTrackStepIndex: 0 });
  },

  startTourTrack: (trackId: TourTrackId) => {
    set({
      activeTrackId: trackId,
      activeTrackStepIndex: 0,
      tourActive: true,
    });
  },

  setTrackStepIndex: (index: number) => {
    set({ activeTrackStepIndex: Math.max(0, index) });
  },

  completeTrack: (trackId: TourTrackId) => {
    const nextCompleted = Array.from(new Set([...get().completedTrackIds, trackId]));
    try {
      if (typeof window !== 'undefined') {
        window.localStorage.setItem(COMPLETED_TRACKS_STORAGE_KEY, JSON.stringify(nextCompleted));
      }
    } catch {
      // Ignore storage errors
    }

    set({
      completedTrackIds: nextCompleted,
      tourActive: false,
      activeTrackId: null,
      activeTrackStepIndex: 0,
    });
  },

  stopTour: () => {
    set({
      tourActive: false,
      activeTrackId: null,
      activeTrackStepIndex: 0,
    });
  },
}));
