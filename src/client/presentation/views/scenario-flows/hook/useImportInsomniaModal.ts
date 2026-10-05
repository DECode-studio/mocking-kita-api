'use client';

import { useState, useRef, useEffect, useCallback, ChangeEvent } from 'react';
import { getErrorMessage } from '@/src/core/utils/error';
import { usePageLoadingOverlay } from '@/src/client/presentation/components/shared/PageLoadingOverlay';
import {
  convertInsomniaToScenarioFlow,
  InsomniaConversionResult,
} from '@/src/core/parsers/insomnia/insomnia-flow-converter';
import { SCENARIO_FLOWS_TEXT } from '../constant';

interface UseImportInsomniaModalProps {
  isOpen: boolean;
  projectId?: string;
  onSuccess: (result: any) => void;
  onImportFlow?: (targetProjectId: string, template: any) => Promise<any>;
  onClose: () => void;
}

export const useImportInsomniaModal = ({
  isOpen,
  projectId,
  onSuccess,
  onImportFlow,
  onClose,
}: UseImportInsomniaModalProps) => {
  const [targetProjectId, setTargetProjectId] = useState(projectId || '');
  const [content, setContent] = useState('');
  const [fileName, setFileName] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [conversionResult, setConversionResult] = useState<InsomniaConversionResult | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const pageLoading = usePageLoadingOverlay();

  useEffect(() => {
    if (isOpen) {
      setTargetProjectId(projectId || '');
      setContent('');
      setFileName(null);
      setError(null);
      setConversionResult(null);
      setIsSubmitting(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  }, [isOpen, projectId]);

  const tryParseAndConvert = useCallback((rawText: string, name?: string) => {
    if (!rawText.trim()) {
      setConversionResult(null);
      setError(null);
      return null;
    }
    try {
      const result = convertInsomniaToScenarioFlow(rawText, { sourceFileName: name });
      setConversionResult(result);
      setError(null);
      return result;
    } catch (err) {
      setConversionResult(null);
      setError(getErrorMessage(err, SCENARIO_FLOWS_TEXT.MODAL_INSOMNIA_ERR_INVALID));
      return null;
    }
  }, []);

  const handleFileUpload = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      setFileName(file.name);
      setError(null);
      const reader = new FileReader();
      reader.onload = (event) => {
        const text = (event.target?.result as string) || '';
        setContent(text);
        tryParseAndConvert(text, file.name);
      };
      reader.readAsText(file);
    },
    [tryParseAndConvert]
  );

  const handleContentChange = useCallback(
    (newText: string) => {
      setContent(newText);
      tryParseAndConvert(newText, fileName || 'Pasted Insomnia Content');
    },
    [fileName, tryParseAndConvert]
  );

  const handleImport = useCallback(async () => {
    const effectiveProjectId = targetProjectId || projectId;
    if (!effectiveProjectId) {
      setError(SCENARIO_FLOWS_TEXT.MODAL_IMPORT_ERR_SELECT_PROJECT);
      return;
    }

    if (!content.trim()) {
      setError(SCENARIO_FLOWS_TEXT.MODAL_INSOMNIA_ERR_EMPTY);
      return;
    }

    let result = conversionResult;
    if (!result) {
      result = tryParseAndConvert(content, fileName || 'Insomnia Export');
    }

    if (!result) {
      return;
    }

    setIsSubmitting(true);
    setError(null);
    try {
      await pageLoading.run(
        {
          title: 'Mengimpor Insomnia Collection',
          description: `Mengonversi ${result.summary.totalRequests} request dan melakukan upserting API scenario flow ke project...`,
        },
        async () => {
          if (onImportFlow) {
            const res = await onImportFlow(effectiveProjectId, result.template);
            onSuccess(res);
            setContent('');
            setFileName(null);
            setConversionResult(null);
            onClose();
          }
        }
      );
    } catch (err) {
      setError(getErrorMessage(err, SCENARIO_FLOWS_TEXT.MODAL_IMPORT_ERR_FAILED));
    } finally {
      setIsSubmitting(false);
    }
  }, [
    targetProjectId,
    projectId,
    content,
    conversionResult,
    fileName,
    tryParseAndConvert,
    pageLoading,
    onImportFlow,
    onSuccess,
    onClose,
  ]);

  const insertSampleInsomnia = useCallback(() => {
    const sample = `type: collection.insomnia.rest/5.0
schema_version: '5.1'
name: Sample LOS API Flow
collection:
- name: Master Data
  children:
  - name: Area
    children:
    - url: '{{ _.MDM_API_AREA_URL }}/api/v2/master-data/area/province'
      name: Get Province
      method: GET
      parameters:
      - name: page
        value: '1'
      headers:
      - name: Accept-Language
        value: id
      meta:
        id: req_sample_province
        sortKey: 100
    - url: '{{ _.MDM_API_AREA_URL }}/api/v2/master-data/area/city'
      name: Get City By Province
      method: GET
      parameters:
      - name: provinceId
        value: "{% response 'body', 'req_sample_province', 'b64::JC5kYXRhWzBdLmlk::46b', 'when-expired', 300 %}"
      headers:
      - name: Accept-Language
        value: id
      meta:
        id: req_sample_city
        sortKey: 200
environments:
  name: Base Environment
  subEnvironments:
  - name: Dev
    data:
      MDM_API_AREA_URL: https://dev-masterdata-area.kbfinansia.com
`;
    setContent(sample);
    tryParseAndConvert(sample, 'sample_los.yaml');
    setError(null);
  }, [tryParseAndConvert]);

  return {
    targetProjectId,
    setTargetProjectId,
    content,
    setContent: handleContentChange,
    fileName,
    error,
    setError,
    conversionResult,
    isSubmitting,
    fileInputRef,
    handleFileUpload,
    handleImport,
    insertSampleInsomnia,
  };
};
