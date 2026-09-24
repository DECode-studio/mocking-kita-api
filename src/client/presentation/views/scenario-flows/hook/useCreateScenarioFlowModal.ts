'use client';

import { useState, useEffect, useCallback, FormEvent } from 'react';
import { SCENARIO_FLOWS_TEXT } from '../constant';

interface UseCreateScenarioFlowModalProps {
  isOpen: boolean;
  initialProjectId?: string;
  onSubmit: (data: {
    projectId?: string;
    name: string;
    description?: string;
    defaultEnvironmentId?: string;
    stopOnFailure: boolean;
    variables?: Record<string, any>;
  }) => Promise<void>;
  onClose: () => void;
}

export const useCreateScenarioFlowModal = ({
  isOpen,
  initialProjectId,
  onSubmit,
  onClose,
}: UseCreateScenarioFlowModalProps) => {
  const [name, setName] = useState('');
  const [selectedProjectId, setSelectedProjectId] = useState(initialProjectId || '');
  const [description, setDescription] = useState('');
  const [defaultEnvironmentId, setDefaultEnvironmentId] = useState('');
  const [stopOnFailure, setStopOnFailure] = useState(true);
  const [variablesJson, setVariablesJson] = useState('{\n  \n}');
  const [jsonError, setJsonError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setName('');
      setSelectedProjectId(initialProjectId || '');
      setDescription('');
      setDefaultEnvironmentId('');
      setStopOnFailure(true);
      setVariablesJson('{\n  \n}');
      setJsonError(null);
      setIsSubmitting(false);
    }
  }, [isOpen, initialProjectId]);

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

    let parsedVars = {};
    if (variablesJson.trim()) {
      try {
        parsedVars = JSON.parse(variablesJson);
        setJsonError(null);
      } catch {
        setJsonError(SCENARIO_FLOWS_TEXT.MODAL_CREATE_VARS_ERROR);
        return;
      }
    }

    setIsSubmitting(true);
    try {
      await onSubmit({
        projectId: selectedProjectId || undefined,
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
  }, [
    name,
    variablesJson,
    onSubmit,
    selectedProjectId,
    description,
    defaultEnvironmentId,
    stopOnFailure,
    onClose,
  ]);

  return {
    name,
    setName,
    selectedProjectId,
    setSelectedProjectId,
    description,
    setDescription,
    defaultEnvironmentId,
    setDefaultEnvironmentId,
    stopOnFailure,
    setStopOnFailure,
    variablesJson,
    setVariablesJson,
    jsonError,
    isSubmitting,
    handleInsertVariableToken,
    handleSubmit,
  };
};
