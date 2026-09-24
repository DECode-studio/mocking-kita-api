'use client';

import { useState, useRef, useEffect, useCallback, ChangeEvent } from 'react';
import { getErrorMessage } from '@/src/core/utils/error';
import { SCENARIO_FLOWS_TEXT } from '../constant';

interface UseImportScenarioFlowModalProps {
  isOpen: boolean;
  projectId?: string;
  onSuccess: (result: any) => void;
  onImportFlow?: (targetProjectId: string, template: any) => Promise<any>;
  onClose: () => void;
}

export const useImportScenarioFlowModal = ({
  isOpen,
  projectId,
  onSuccess,
  onImportFlow,
  onClose,
}: UseImportScenarioFlowModalProps) => {
  const [targetProjectId, setTargetProjectId] = useState(projectId || '');
  const [jsonText, setJsonText] = useState('');
  const [fileName, setFileName] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setTargetProjectId(projectId || '');
      setJsonText('');
      setFileName(null);
      setError(null);
      setIsSubmitting(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  }, [isOpen, projectId]);

  const handleFileUpload = useCallback((e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    setError(null);
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        JSON.parse(text);
        setJsonText(text);
      } catch {
        setError(SCENARIO_FLOWS_TEXT.MODAL_IMPORT_ERR_INVALID_FILE);
      }
    };
    reader.readAsText(file);
  }, []);

  const handleImport = useCallback(async () => {
    const effectiveProjectId = targetProjectId || projectId;
    if (!effectiveProjectId) {
      setError(SCENARIO_FLOWS_TEXT.MODAL_IMPORT_ERR_SELECT_PROJECT);
      return;
    }

    if (!jsonText.trim()) {
      setError(SCENARIO_FLOWS_TEXT.MODAL_IMPORT_ERR_EMPTY_JSON);
      return;
    }

    let parsed: any;
    try {
      parsed = JSON.parse(jsonText);
    } catch {
      setError(SCENARIO_FLOWS_TEXT.MODAL_IMPORT_ERR_SYNTAX);
      return;
    }

    setIsSubmitting(true);
    setError(null);
    try {
      if (onImportFlow) {
        const res = await onImportFlow(effectiveProjectId, parsed);
        onSuccess(res);
        setJsonText('');
        setFileName(null);
        onClose();
      }
    } catch (err) {
      setError(getErrorMessage(err, SCENARIO_FLOWS_TEXT.MODAL_IMPORT_ERR_FAILED));
    } finally {
      setIsSubmitting(false);
    }
  }, [targetProjectId, projectId, jsonText, onImportFlow, onSuccess, onClose]);

  const insertSampleTemplate = useCallback(() => {
    setJsonText(
      JSON.stringify(
        {
          $schema: 'mock-api-studio/scenario-flow/v1',
          flow: {
            name: 'Sample Auth & User Flow',
            description: 'Auto-chained login and profile retrieve',
            stopOnFailure: true,
          },
          steps: [
            {
              order: 1,
              name: 'User Login',
              api: { method: 'POST', path: '/api/v1/auth/login' },
              requestPayload: {
                body: { email: 'user@example.com', password: 'password123' },
              },
              extractors: [{ variable: 'token', from: 'body', path: 'data.token' }],
              assertions: [{ type: 'statusCode', operator: 'equals', expected: 200 }],
            },
            {
              order: 2,
              name: 'Get Profile',
              api: { method: 'GET', path: '/api/v1/users/me' },
              overrides: { headers: { Authorization: 'Bearer {{token}}' } },
              assertions: [{ type: 'statusCode', operator: 'equals', expected: 200 }],
            },
          ],
        },
        null,
        2
      )
    );
    setError(null);
  }, []);

  return {
    targetProjectId,
    setTargetProjectId,
    jsonText,
    setJsonText,
    fileName,
    error,
    setError,
    isSubmitting,
    fileInputRef,
    handleFileUpload,
    handleImport,
    insertSampleTemplate,
  };
};
