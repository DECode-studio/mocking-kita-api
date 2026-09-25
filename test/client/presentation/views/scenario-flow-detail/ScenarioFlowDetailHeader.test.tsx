// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest';
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { ScenarioFlowDetailHeader } from '@/src/client/presentation/views/scenario-flow-detail/components/ScenarioFlowDetailHeader';
import {
  SCENARIO_FLOW_DETAIL_SEMANTIC_ID,
  SCENARIO_FLOW_DETAIL_TEXT,
} from '@/src/client/presentation/views/scenario-flow-detail/constant';
import { ScenarioFlow } from '@/src/client/domain/scenario-flow/entity/scenario_flow';

const mockFlow: ScenarioFlow = {
  id: 'flow-123',
  name: 'Test Scenario Flow',
  description: 'A test flow',
  status: true,
  stopOnFailure: true,
  steps: [],
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

describe('ScenarioFlowDetailHeader View Switcher', () => {
  it('renders Classic List button before Diagram Flow button', () => {
    const onToggleViewMode = vi.fn();
    render(
      <ScenarioFlowDetailHeader
        flow={mockFlow}
        environments={[]}
        selectedEnvironmentType="DEVELOPMENT"
        setSelectedEnvironmentType={vi.fn()}
        targetMode="LIVE"
        setTargetMode={vi.fn()}
        viewMode="list"
        onToggleViewMode={onToggleViewMode}
        onAutoArrange={vi.fn()}
        isRunning={false}
        elapsedMs={0}
        runningProgress={null}
        onRunFlow={vi.fn()}
        onExport={vi.fn()}
        onOpenAddStep={vi.fn()}
        onOpenHistory={vi.fn()}
      />
    );

    const listBtn = document.getElementById(SCENARIO_FLOW_DETAIL_SEMANTIC_ID.VIEW_MODE_LIST);
    const canvasBtn = document.getElementById(SCENARIO_FLOW_DETAIL_SEMANTIC_ID.VIEW_MODE_CANVAS);

    expect(listBtn).toBeTruthy();
    expect(canvasBtn).toBeTruthy();

    // Verify order in DOM: list button precedes canvas button
    expect(
      listBtn!.compareDocumentPosition(canvasBtn!) & Node.DOCUMENT_POSITION_FOLLOWING
    ).toBeTruthy();
  });

  it('highlights Classic List button when viewMode is list', () => {
    render(
      <ScenarioFlowDetailHeader
        flow={mockFlow}
        environments={[]}
        selectedEnvironmentType="DEVELOPMENT"
        setSelectedEnvironmentType={vi.fn()}
        targetMode="LIVE"
        setTargetMode={vi.fn()}
        viewMode="list"
        onToggleViewMode={vi.fn()}
        onAutoArrange={vi.fn()}
        isRunning={false}
        elapsedMs={0}
        runningProgress={null}
        onRunFlow={vi.fn()}
        onExport={vi.fn()}
        onOpenAddStep={vi.fn()}
        onOpenHistory={vi.fn()}
      />
    );

    const listBtn = document.getElementById(SCENARIO_FLOW_DETAIL_SEMANTIC_ID.VIEW_MODE_LIST);
    expect(listBtn?.className).toContain('text-purple-600');
  });

  it('triggers onToggleViewMode when clicking canvas button', () => {
    const onToggleViewMode = vi.fn();
    render(
      <ScenarioFlowDetailHeader
        flow={mockFlow}
        environments={[]}
        selectedEnvironmentType="DEVELOPMENT"
        setSelectedEnvironmentType={vi.fn()}
        targetMode="LIVE"
        setTargetMode={vi.fn()}
        viewMode="list"
        onToggleViewMode={onToggleViewMode}
        onAutoArrange={vi.fn()}
        isRunning={false}
        elapsedMs={0}
        runningProgress={null}
        onRunFlow={vi.fn()}
        onExport={vi.fn()}
        onOpenAddStep={vi.fn()}
        onOpenHistory={vi.fn()}
      />
    );

    const canvasBtn = document.getElementById(SCENARIO_FLOW_DETAIL_SEMANTIC_ID.VIEW_MODE_CANVAS);
    fireEvent.click(canvasBtn!);

    expect(onToggleViewMode).toHaveBeenCalledWith('canvas');
  });
});
