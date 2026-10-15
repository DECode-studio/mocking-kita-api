'use client';

import { useState } from 'react';
import { convertOpenApiToMockStudio, OpenApiConvertResult } from '@/src/core/ai/openapi-to-mock';
import { SAMPLE_OPENAPI_PAYLOAD } from '../constant';

export const useOpenApiGenerator = () => {
  const [rawInput, setRawInput] = useState(SAMPLE_OPENAPI_PAYLOAD);
  const [result, setResult] = useState<OpenApiConvertResult | null>(null);
  const [copiedIdx, setCopiedIdx] = useState<number | null>(null);

  const handleConvert = () => {
    const res = convertOpenApiToMockStudio(rawInput);
    setResult(res);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content) {
        setRawInput(content);
        const res = convertOpenApiToMockStudio(content);
        setResult(res);
      }
    };
    reader.readAsText(file);
  };

  const handleResetSample = () => {
    setRawInput(SAMPLE_OPENAPI_PAYLOAD);
  };

  const copySampleJson = (body: unknown, idx: number) => {
    navigator.clipboard.writeText(JSON.stringify(body, null, 2));
    setCopiedIdx(idx);
    setTimeout(() => setCopiedIdx(null), 2000);
  };

  return {
    rawInput,
    setRawInput,
    result,
    copiedIdx,
    handleConvert,
    handleFileUpload,
    handleResetSample,
    copySampleJson,
  };
};

