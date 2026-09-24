'use client';

import { useState, useEffect, useCallback, FormEvent } from 'react';
import { ScenarioFlow } from '@/src/client/domain/scenario-flow/entity/scenario_flow';
import { SCENARIO_FLOW_DETAIL_TEXT } from '../constant';

interface UseEditFlowModalProps {
  isOpen: boolean;
  flow: ScenarioFlow;
  onSave: (data: {
    name: string;
    description?: string;
    defaultEnvironmentId?: string;
    stopOnFailure: boolean;
    variables?: Record<string, any>;
  }) => Promise<void>;
  onClose: () => void;
}

export const useEditFlowModal = ({
  isOpen,
  flow,
  onSave,
  onClose,
}: UseEditFlowModalProps) => {
  const [name, setName] = useState(flow.name || '');
  const [description, setDescription] = useState(flow.description || '');
  const [defaultEnvironmentId, setDefaultEnvironmentId] = useState(flow.defaultEnvironmentId || '');
  const [stopOnFailure, setStopOnFailure] = useState(flow.stopOnFailure ?? true);
  const [variablesJson, setVariablesJson] = useState('{}');
  const [jsonError, setJsonError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setName(flow.name || '');
      setDescription(flow.description || '');
      setDefaultEnvironmentId(flow.defaultEnvironmentId || '');
      setStopOnFailure(flow.stopOnFailure ?? true);

      // Display variables without internal _canvasLayout for cleaner editing
      const vars = { ...(flow.variables || {}) };
      delete vars._canvasLayout;
      setVariablesJson(JSON.stringify(vars, null, 2));
      setJsonError(null);
      setIsSubmitting(false);
    }
  }, [isOpen, flow]);

  const handleInsertVariableToken = useCallback((token: string) => {
    try {
      const parsed = JSON.parse(variablesJson.trim() || '{}');
      const cleanKey =
        token
          .replace(/^\{\{\s*(?:datasheet\.|env\.)?/, '')
          .replace(/\}\}.*$/, '')
          .replace(/[^a-zA-Z0-9_]/g, '_')
          .replace(/_+/g, '_')
          .replace(/^_|_$/g, '') || 'variable';
      parsed[cleanKey] = token;
      setVariablesJson(JSON.stringify(parsed, null, 2));
      setJsonError(null);
    } catch {
      setVariablesJson((prev) => (prev ? `${prev}\n"${token}"` : token));
    }
  }, [variablesJson]);

  const handleSubmit = useCallback(async (e: FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    let parsedVars: Record<string, any> = {};
    if (variablesJson.trim()) {
      try {
        parsedVars = JSON.parse(variablesJson);
        setJsonError(null);
      } catch {
        setJsonError(SCENARIO_FLOW_DETAIL_TEXT.EDIT_VARS_ERROR);
        return;
      }
    }

    setIsSubmitting(true);
    try {
      // Preserve _canvasLayout if it exists
      if (flow.variables?._canvasLayout) {
        parsedVars._canvasLayout = flow.variables._canvasLayout;
      }

      await onSave({
        name: name.trim(),
        description: description.trim() || undefined,
        defaultEnvironmentId: defaultEnvironmentId || undefined,
        stopOnFailure,
        variables: Object.keys(parsedVars).length > 0 ? parsedVars : undefined,
      });
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  }, [name, variablesJson, flow.variables, onSave, description, defaultEnvironmentId, stopOnFailure, onClose]);

  return {
    name,
    setName,
    description,
    setDescription,
    defaultEnvironmentId,
    setDefaultEnvironmentId,
    stopOnFailure,
    setStopOnFailure,
    variablesJson,
    setVariablesJson,
    jsonError,
    setJsonError,
    isSubmitting,
    handleInsertVariableToken,
    handleSubmit,
  };
};
