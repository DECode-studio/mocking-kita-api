'use client';

import { useState } from 'react';
import {
  simulateVariableInterpolation,
  simulateAssertions,
  SimulationResult,
  AssertionSimulationResult,
} from '@/src/core/ai/variable-simulator';
import {
  SAMPLE_PAYLOAD_TO_INTERPOLATE,
  SAMPLE_VARIABLES,
  SAMPLE_DATASHEET,
  SAMPLE_ACTUAL_RESPONSE_BODY,
  DEFAULT_SIMULATION_ASSERTIONS,
} from '../constant';

export const useVariableSimulator = () => {
  const [templateInput, setTemplateInput] = useState(SAMPLE_PAYLOAD_TO_INTERPOLATE);
  const [varsInput, setVarsInput] = useState(SAMPLE_VARIABLES);
  const [dataSheetInput, setDataSheetInput] = useState(SAMPLE_DATASHEET);
  const [simulationResult, setSimulationResult] = useState<SimulationResult | null>(null);

  const [actualStatusCode, setActualStatusCode] = useState(200);
  const [actualResponseTime, setActualResponseTime] = useState(180);
  const [actualResponseBody, setActualResponseBody] = useState(SAMPLE_ACTUAL_RESPONSE_BODY);
  const [assertionResult, setAssertionResult] = useState<AssertionSimulationResult | null>(null);

  const handleResetSampleTemplate = () => {
    setTemplateInput(SAMPLE_PAYLOAD_TO_INTERPOLATE);
  };

  const handleSimulateVariables = () => {
    let parsedPayload: unknown = templateInput;
    try {
      parsedPayload = JSON.parse(templateInput);
    } catch {
      parsedPayload = templateInput;
    }

    let parsedVars: Record<string, unknown> = {};
    try {
      parsedVars = JSON.parse(varsInput);
    } catch {
      parsedVars = {};
    }

    let parsedSheet: Record<string, unknown> = {};
    try {
      parsedSheet = JSON.parse(dataSheetInput);
    } catch {
      parsedSheet = {};
    }

    const res = simulateVariableInterpolation(parsedPayload, {
      variables: parsedVars,
      dataSheetValues: parsedSheet,
    });
    setSimulationResult(res);
  };

  const handleTestAssertions = () => {
    let parsedBody: unknown = {};
    try {
      parsedBody = JSON.parse(actualResponseBody);
    } catch {
      parsedBody = actualResponseBody;
    }

    const res = simulateAssertions({
      actualStatusCode,
      actualResponseTime,
      actualBody: parsedBody,
      assertions: DEFAULT_SIMULATION_ASSERTIONS,
    });
    setAssertionResult(res);
  };

  return {
    templateInput,
    setTemplateInput,
    varsInput,
    setVarsInput,
    dataSheetInput,
    setDataSheetInput,
    simulationResult,
    actualStatusCode,
    setActualStatusCode,
    actualResponseTime,
    setActualResponseTime,
    actualResponseBody,
    setActualResponseBody,
    assertionResult,
    handleResetSampleTemplate,
    handleSimulateVariables,
    handleTestAssertions,
  };
};

