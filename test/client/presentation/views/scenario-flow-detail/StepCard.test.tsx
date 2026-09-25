// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest';
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { StepCard } from '@/src/client/presentation/views/scenario-flow-detail/components/StepCard';
import {
  SCENARIO_FLOW_DETAIL_SEMANTIC_ID,
  SCENARIO_FLOW_DETAIL_TEXT,
} from '@/src/client/presentation/views/scenario-flow-detail/constant';
import { ScenarioFlowStep } from '@/src/client/domain/scenario-flow/entity/scenario_flow';

const mockStep: ScenarioFlowStep = {
  id: 'step-1',
  flowId: 'flow-1',
  name: '3. Detail order',
  pathOverride: '/api/v6/pre-go-live/detail/{{req_b3c610d13ebb4cd58291598b5f555260_data_0_prospect_id}}',
  methodOverride: 'GET',
  targetEnvironment: 'LOS_PREGOLIVE_API_BASE_URL',
  targetEnvironmentType: 'CUSTOM',
  description: '**Nuxt proxy equivalent**: `/api/los/los-pregolive-api/api/v6/pre-go-live/detail/{prospect_id}`',
  requestScenario: {
    id: 'sc-1',
    name: '3. Detail order Scenario',
  },
  assertions: [
    {
      id: 'ast-1',
      type: 'statusCode',
      operator: 'equals',
      expected: '200',
    },
  ],
  extractors: [
    {
      variable: 'req_e25b8c3e0f49483189dc5bace3543358_data_5_asset_type_code',
      from: 'body',
      path: 'data.5.asset_type_code',
    },
  ],
  stepOrder: 39,
  delayMs: 0,
  continueOnError: false,
  enabled: true,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

describe('StepCard Layout & Overflow Prevention', () => {
  it('renders StepCard with proper overflow classes on long paths, card container, and extractor pills', () => {
    render(
      <StepCard
        step={mockStep}
        index={38}
        totalSteps={40}
        onEdit={vi.fn()}
        onDelete={vi.fn()}
        onToggleEnabled={vi.fn()}
        onMoveUp={vi.fn()}
        onMoveDown={vi.fn()}
        onRunStep={vi.fn()}
      />
    );

    const card = document.getElementById(SCENARIO_FLOW_DETAIL_SEMANTIC_ID.STEP_CARD_PREFIX(mockStep.id));
    expect(card).toBeTruthy();
    expect(card?.className).toContain('overflow-hidden');
    expect(card?.className).toContain('min-w-0');
    expect(card?.className).toContain('w-full');

    const pathSpan = screen.getByText(mockStep.pathOverride!);
    expect(pathSpan.className).toContain('break-all');

    // Extractor pill overflow prevention
    const extractorText = screen.getByText(/req_e25b8c3e0f49483189dc5bace3543358_data_5_asset_type_code/);
    expect(extractorText.className).toContain('break-all');
    expect(extractorText.className).toContain('[overflow-wrap:anywhere]');
    expect(extractorText.parentElement?.className).toContain('max-w-full');
    expect(extractorText.parentElement?.className).toContain('min-w-0');

    const runBtn = document.getElementById(SCENARIO_FLOW_DETAIL_SEMANTIC_ID.STEP_CARD_RUN_PREFIX(mockStep.id));
    expect(runBtn).toBeTruthy();

    const toggleBtn = document.getElementById(SCENARIO_FLOW_DETAIL_SEMANTIC_ID.STEP_CARD_TOGGLE_PREFIX(mockStep.id));
    expect(toggleBtn).toBeTruthy();
    expect(toggleBtn?.textContent).toContain(SCENARIO_FLOW_DETAIL_TEXT.STEP_CARD_ENABLED);
  });
});
