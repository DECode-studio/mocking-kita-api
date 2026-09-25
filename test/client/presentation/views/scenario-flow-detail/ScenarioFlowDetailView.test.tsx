// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest';
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { ScenarioFlowDetailView } from '@/src/client/presentation/views/scenario-flow-detail/ScenarioFlowDetailView';
import {
  SCENARIO_FLOW_DETAIL_SEMANTIC_ID,
  SCENARIO_FLOW_DETAIL_TEXT,
} from '@/src/client/presentation/views/scenario-flow-detail/constant';
import * as HookModule from '@/src/client/presentation/views/scenario-flow-detail/hook/useScenarioFlowDetail';
import { ScenarioFlow, ScenarioFlowStep } from '@/src/client/domain/scenario-flow/entity/scenario_flow';

// Mock scroll to top button
vi.mock('@/src/client/presentation/components/shared/ScrollToTopButton', () => ({
  ScrollToTopButton: () => null,
}));

// Mock router / next link
vi.mock('next/link', () => ({
  default: ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  ),
}));

const createMockStep = (idx: number): ScenarioFlowStep => ({
  id: `step-${idx}`,
  flowId: 'flow-123',
  name: `Step Name ${idx}`,
  stepOrder: idx,
  delayMs: 0,
  continueOnError: false,
  enabled: true,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
});

describe('ScenarioFlowDetailView Steps Pagination & Default View', () => {
  let mockSteps: ScenarioFlowStep[];
  let hookState: any;

  beforeEach(() => {
    mockSteps = Array.from({ length: 25 }, (_, i) => createMockStep(i + 1));
    hookState = {
      flow: {
        id: 'flow-123',
        name: 'Order Journey Flow',
        description: 'End to end flow test',
        status: true,
        steps: mockSteps,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      environments: [],
      projectApis: [],
      projects: [],
      isLoading: false,
      selectedEnvironmentType: 'DEVELOPMENT',
      setSelectedEnvironmentType: vi.fn(),
      targetMode: 'LIVE',
      setTargetMode: vi.fn(),
      isRunning: false,
      elapsedMs: 0,
      runningProgress: null,
      latestExecution: null,
      batchExecutions: [],
      selectedStepIndex: 0,
      setSelectedStepIndex: vi.fn((idx: number) => {
        hookState.selectedStepIndex = idx;
      }),
      viewMode: 'list',
      setViewMode: vi.fn(),
      stepPositions: {},
      updateStepPosition: vi.fn(),
      handleAutoArrange: vi.fn(),
      isInspectorOpen: false,
      setIsInspectorOpen: vi.fn(),
      isAddStepModalOpen: false,
      setIsAddStepModalOpen: vi.fn(),
      editingStep: null,
      setEditingStep: vi.fn(),
      isHistoryModalOpen: false,
      setIsHistoryModalOpen: vi.fn(),
      isEditFlowModalOpen: false,
      setIsEditFlowModalOpen: vi.fn(),
      handleUpdateFlow: vi.fn(),
      handleSaveStep: vi.fn(),
      handleDeleteStep: vi.fn(),
      handleToggleStepEnabled: vi.fn(),
      handleMoveStep: vi.fn(),
      handleRunFlow: vi.fn(),
      handleRunStep: vi.fn(),
      runningStepId: null,
      handleExport: vi.fn(),
      loadScenariosForApi: vi.fn(),
      handleSelectExecution: vi.fn(),
      handleExportExecutionLog: vi.fn(),
    };

    vi.spyOn(HookModule, 'useScenarioFlowDetail').mockImplementation(() => hookState);
  });

  it('renders only 10 steps per page by default when there are 25 steps', () => {
    render(<ScenarioFlowDetailView flowId="flow-123" />);

    // Page 1: Steps 1 to 10 should be visible
    expect(screen.getByText('Step Name 1')).toBeTruthy();
    expect(screen.getByText('Step Name 10')).toBeTruthy();

    // Step 11 should not be visible on page 1
    expect(screen.queryByText('Step Name 11')).toBeNull();

    // Pagination info should show 1-10 of 25 steps and Page 1 of 3
    expect(
      screen.getByText(SCENARIO_FLOW_DETAIL_TEXT.STEPS_PAGINATION_SHOWING(1, 10, 25))
    ).toBeTruthy();
    expect(
      screen.getByText(SCENARIO_FLOW_DETAIL_TEXT.STEPS_PAGE_LABEL(1, 3))
    ).toBeTruthy();
  });

  it('navigates through steps pages using Next and Previous buttons', () => {
    render(<ScenarioFlowDetailView flowId="flow-123" />);

    const prevBtn = document.getElementById(
      SCENARIO_FLOW_DETAIL_SEMANTIC_ID.STEPS_PAGE_PREV
    ) as HTMLButtonElement;
    const nextBtn = document.getElementById(
      SCENARIO_FLOW_DETAIL_SEMANTIC_ID.STEPS_PAGE_NEXT
    ) as HTMLButtonElement;

    expect(prevBtn.disabled).toBe(true);
    expect(nextBtn.disabled).toBe(false);

    // Go to Page 2
    fireEvent.click(nextBtn);

    expect(screen.queryByText('Step Name 1')).toBeNull();
    expect(screen.getByText('Step Name 11')).toBeTruthy();
    expect(screen.getByText('Step Name 20')).toBeTruthy();
    expect(screen.queryByText('Step Name 21')).toBeNull();
    expect(
      screen.getByText(SCENARIO_FLOW_DETAIL_TEXT.STEPS_PAGINATION_SHOWING(11, 20, 25))
    ).toBeTruthy();
    expect(
      screen.getByText(SCENARIO_FLOW_DETAIL_TEXT.STEPS_PAGE_LABEL(2, 3))
    ).toBeTruthy();

    // Go to Page 3
    fireEvent.click(nextBtn);

    expect(screen.queryByText('Step Name 20')).toBeNull();
    expect(screen.getByText('Step Name 21')).toBeTruthy();
    expect(screen.getByText('Step Name 25')).toBeTruthy();
    expect(
      screen.getByText(SCENARIO_FLOW_DETAIL_TEXT.STEPS_PAGINATION_SHOWING(21, 25, 25))
    ).toBeTruthy();
    expect(
      screen.getByText(SCENARIO_FLOW_DETAIL_TEXT.STEPS_PAGE_LABEL(3, 3))
    ).toBeTruthy();
    expect(nextBtn.disabled).toBe(true);

    // Go back to Page 2
    fireEvent.click(prevBtn);
    expect(screen.getByText('Step Name 11')).toBeTruthy();
    expect(
      screen.getByText(SCENARIO_FLOW_DETAIL_TEXT.STEPS_PAGE_LABEL(2, 3))
    ).toBeTruthy();
  });

  it('does not render steps pagination bar if steps count is 10 or less', () => {
    hookState.flow.steps = Array.from({ length: 8 }, (_, i) => createMockStep(i + 1));
    render(<ScenarioFlowDetailView flowId="flow-123" />);

    expect(
      document.getElementById(SCENARIO_FLOW_DETAIL_SEMANTIC_ID.STEPS_PAGINATION)
    ).toBeNull();
    expect(screen.getByText('Step Name 8')).toBeTruthy();
  });

  it('automatically syncs steps page when selectedStepIndex changes to another page', () => {
    const { rerender } = render(<ScenarioFlowDetailView flowId="flow-123" />);

    expect(screen.getByText('Step Name 1')).toBeTruthy();

    // Simulate selecting step at index 14 (page 2)
    hookState.selectedStepIndex = 14;
    rerender(<ScenarioFlowDetailView flowId="flow-123" />);

    expect(screen.getByText('Step Name 15')).toBeTruthy();
    expect(
      screen.getByText(SCENARIO_FLOW_DETAIL_TEXT.STEPS_PAGE_LABEL(2, 3))
    ).toBeTruthy();
  });
});
