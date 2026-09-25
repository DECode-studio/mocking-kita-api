// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest';
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { FlowExecutionPanel } from '@/src/client/presentation/views/scenario-flow-detail/components/FlowExecutionPanel';
import {
  ScenarioFlowExecution,
  ScenarioFlowExecutionStep,
} from '@/src/client/domain/scenario-flow/entity/scenario_flow';
import {
  SCENARIO_FLOW_DETAIL_SEMANTIC_ID,
  SCENARIO_FLOW_DETAIL_TEXT,
} from '@/src/client/presentation/views/scenario-flow-detail/constant';

const createMockStep = (order: number, overrides?: Partial<ScenarioFlowExecutionStep>): ScenarioFlowExecutionStep => ({
  id: `step-${order}`,
  executionId: 'exec-1',
  stepOrder: order,
  stepName: `Test Step ${order}`,
  method: 'GET',
  url: `https://api.example.com/step-${order}`,
  status: 'SUCCESS',
  httpStatusCode: 200,
  durationMs: 45,
  createdAt: new Date().toISOString(),
  ...overrides,
});

const createMockExecution = (stepCount: number): ScenarioFlowExecution => ({
  id: 'exec-1',
  flowId: 'flow-1',
  status: 'SUCCESS',
  triggerSource: 'MANUAL',
  targetMode: 'LIVE',
  totalSteps: stepCount,
  passedSteps: stepCount,
  failedSteps: 0,
  durationMs: 250,
  createdAt: new Date().toISOString(),
  steps: Array.from({ length: stepCount }, (_, i) => createMockStep(i + 1)),
});

describe('FlowExecutionPanel Table & Pagination', () => {
  it('renders table headers properly', () => {
    const execution = createMockExecution(3);
    render(
      <FlowExecutionPanel
        execution={execution}
        selectedStepIndex={0}
        onSelectStep={vi.fn()}
      />
    );

    expect(screen.getByText(SCENARIO_FLOW_DETAIL_TEXT.TABLE_HEADER_STEP)).toBeTruthy();
    expect(screen.getByText(SCENARIO_FLOW_DETAIL_TEXT.TABLE_HEADER_NAME)).toBeTruthy();
    expect(screen.getByText(SCENARIO_FLOW_DETAIL_TEXT.TABLE_HEADER_METHOD)).toBeTruthy();
    expect(screen.getByText(SCENARIO_FLOW_DETAIL_TEXT.TABLE_HEADER_STATUS)).toBeTruthy();
    expect(screen.getByText(SCENARIO_FLOW_DETAIL_TEXT.TABLE_HEADER_DURATION)).toBeTruthy();
  });

  it('renders only 5 items per page when there are 12 steps', () => {
    const execution = createMockExecution(12);
    render(
      <FlowExecutionPanel
        execution={execution}
        selectedStepIndex={0}
        onSelectStep={vi.fn()}
      />
    );

    // Page 1 should contain steps 1-5
    expect(screen.getByText('Test Step 1')).toBeTruthy();
    expect(screen.getByText('Test Step 5')).toBeTruthy();
    expect(screen.queryByText('Test Step 6')).toBeNull();

    // Showing 1-5 of 12
    expect(screen.getByText(SCENARIO_FLOW_DETAIL_TEXT.TABLE_PAGINATION_SHOWING(1, 5, 12))).toBeTruthy();
    expect(screen.getByText(SCENARIO_FLOW_DETAIL_TEXT.TABLE_PAGE_LABEL(1, 3))).toBeTruthy();
  });

  it('navigates to next and previous pages when buttons are clicked', () => {
    const execution = createMockExecution(12);
    render(
      <FlowExecutionPanel
        execution={execution}
        selectedStepIndex={0}
        onSelectStep={vi.fn()}
      />
    );

    const prevBtn = document.getElementById(SCENARIO_FLOW_DETAIL_SEMANTIC_ID.EXECUTION_PAGE_PREV) as HTMLButtonElement;
    const nextBtn = document.getElementById(SCENARIO_FLOW_DETAIL_SEMANTIC_ID.EXECUTION_PAGE_NEXT) as HTMLButtonElement;

    expect(prevBtn.disabled).toBe(true);
    expect(nextBtn.disabled).toBe(false);

    // Go to page 2
    fireEvent.click(nextBtn);

    expect(screen.queryByText('Test Step 1')).toBeNull();
    expect(screen.getByText('Test Step 6')).toBeTruthy();
    expect(screen.getByText('Test Step 10')).toBeTruthy();
    expect(screen.getByText(SCENARIO_FLOW_DETAIL_TEXT.TABLE_PAGE_LABEL(2, 3))).toBeTruthy();

    // Go to page 3
    fireEvent.click(nextBtn);
    expect(screen.getByText('Test Step 11')).toBeTruthy();
    expect(screen.getByText('Test Step 12')).toBeTruthy();
    expect(screen.getByText(SCENARIO_FLOW_DETAIL_TEXT.TABLE_PAGE_LABEL(3, 3))).toBeTruthy();
    expect(nextBtn.disabled).toBe(true);

    // Go back to page 2
    fireEvent.click(prevBtn);
    expect(screen.getByText('Test Step 6')).toBeTruthy();
    expect(screen.getByText(SCENARIO_FLOW_DETAIL_TEXT.TABLE_PAGE_LABEL(2, 3))).toBeTruthy();
  });

  it('calls onSelectStep with absolute index when row is clicked', () => {
    const onSelectStep = vi.fn();
    const execution = createMockExecution(10);
    render(
      <FlowExecutionPanel
        execution={execution}
        selectedStepIndex={0}
        onSelectStep={onSelectStep}
      />
    );

    const row = document.getElementById(SCENARIO_FLOW_DETAIL_SEMANTIC_ID.EXECUTION_STEP_PREFIX(2));
    expect(row).toBeTruthy();
    fireEvent.click(row!);

    expect(onSelectStep).toHaveBeenCalledWith(2);
  });

  it('automatically syncs current page when selectedStepIndex changes', () => {
    const execution = createMockExecution(12);
    const { rerender } = render(
      <FlowExecutionPanel
        execution={execution}
        selectedStepIndex={0}
        onSelectStep={vi.fn()}
      />
    );

    expect(screen.getByText('Test Step 1')).toBeTruthy();

    // Change selectedStepIndex to 7 (which is on page 2)
    rerender(
      <FlowExecutionPanel
        execution={execution}
        selectedStepIndex={7}
        onSelectStep={vi.fn()}
      />
    );

    expect(screen.getByText('Test Step 8')).toBeTruthy();
    expect(screen.getByText(SCENARIO_FLOW_DETAIL_TEXT.TABLE_PAGE_LABEL(2, 3))).toBeTruthy();
  });

  it('does not render pagination bar when steps count is 5 or less', () => {
    const execution = createMockExecution(4);
    render(
      <FlowExecutionPanel
        execution={execution}
        selectedStepIndex={0}
        onSelectStep={vi.fn()}
      />
    );

    expect(document.getElementById(SCENARIO_FLOW_DETAIL_SEMANTIC_ID.EXECUTION_PAGINATION)).toBeNull();
    expect(screen.getByText('Test Step 4')).toBeTruthy();
  });
});
