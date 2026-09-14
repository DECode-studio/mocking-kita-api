// @vitest-environment jsdom
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useOnboardingStore } from '@/src/client/presentation/stores/onboardingStore';

const COACH_MARK_STORAGE_KEY = 'mock_api_studio_coach_mark_guidance';

describe('onboardingStore', () => {
  beforeEach(() => {
    localStorage.clear();
    useOnboardingStore.setState({
      progress: {
        dashboardNavigated: 'not-started',
        createProject: 'not-started',
        addApi: 'not-started',
        createRequestScenario: 'not-started',
        createResponseScenario: 'not-started',
      },
      tourActive: false,
      completedAll: false,
      isInitialized: false,
    });
  });

  it('should initialize with default state when localStorage is empty', () => {
    useOnboardingStore.getState().initialize();
    const state = useOnboardingStore.getState();

    expect(state.isInitialized).toBe(true);
    expect(state.tourActive).toBe(true);
    expect(state.completedAll).toBe(false);
    expect(state.progress.dashboardNavigated).toBe('not-started');
  });

  it('should initialize with stored state if present in localStorage', () => {
    const stored = {
      progress: {
        dashboardNavigated: 'completed',
        createProject: 'completed',
        addApi: 'not-started',
        createRequestScenario: 'not-started',
        createResponseScenario: 'not-started',
      },
      tourActive: true,
      completedAll: false,
    };
    localStorage.setItem(COACH_MARK_STORAGE_KEY, JSON.stringify(stored));

    useOnboardingStore.getState().initialize();
    const state = useOnboardingStore.getState();

    expect(state.isInitialized).toBe(true);
    expect(state.progress.dashboardNavigated).toBe('completed');
    expect(state.progress.createProject).toBe('completed');
  });

  it('should complete individual steps and complete all when done', () => {
    useOnboardingStore.getState().initialize();

    useOnboardingStore.getState().completeStep('createProject');
    expect(useOnboardingStore.getState().progress.createProject).toBe('completed');

    useOnboardingStore.getState().completeStep('addApi');
    useOnboardingStore.getState().completeStep('createRequestScenario');
    useOnboardingStore.getState().completeStep('createResponseScenario');

    const state = useOnboardingStore.getState();
    expect(state.completedAll).toBe(true);
    expect(state.tourActive).toBe(false);
  });

  it('should ignore completing an already completed step', () => {
    useOnboardingStore.getState().initialize();
    useOnboardingStore.getState().completeStep('createProject');
    const spy = vi.spyOn(Storage.prototype, 'setItem');
    useOnboardingStore.getState().completeStep('createProject');
    expect(spy).not.toHaveBeenCalled();
  });

  it('should reset tour', () => {
    useOnboardingStore.getState().initialize();
    useOnboardingStore.getState().completeStep('createProject');
    useOnboardingStore.getState().resetTour();

    const state = useOnboardingStore.getState();
    expect(state.progress.createProject).toBe('not-started');
    expect(state.tourActive).toBe(true);
    expect(state.completedAll).toBe(false);
  });

  it('should disable tour', () => {
    useOnboardingStore.getState().initialize();
    useOnboardingStore.getState().disableTour();

    expect(useOnboardingStore.getState().tourActive).toBe(false);
  });
});
