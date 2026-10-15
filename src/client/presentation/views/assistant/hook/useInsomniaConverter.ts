'use client';

import { useState } from 'react';
import { convertInsomniaToScenarioFlow, InsomniaConvertResult } from '@/src/core/ai/insomnia-to-scenario';
import { SAMPLE_INSOMNIA_PAYLOAD } from '../constant';

export const useInsomniaConverter = () => {
  const [rawInput, setRawInput] = useState(SAMPLE_INSOMNIA_PAYLOAD);
  const [result, setResult] = useState<InsomniaConvertResult | null>(null);
  const [isCopied, setIsCopied] = useState(false);

  const handleConvert = () => {
    const res = convertInsomniaToScenarioFlow(rawInput);
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
        const res = convertInsomniaToScenarioFlow(content);
        setResult(res);
      }
    };
    reader.readAsText(file);
  };

  const handleResetSample = () => {
    setRawInput(SAMPLE_INSOMNIA_PAYLOAD);
  };

  const copyTemplateJson = () => {
    if (!result?.template) return;
    navigator.clipboard.writeText(JSON.stringify(result.template, null, 2));
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  const downloadTemplateJson = () => {
    if (!result?.template) return;
    const blob = new Blob([JSON.stringify(result.template, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `scenario-flow-template-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return {
    rawInput,
    setRawInput,
    result,
    isCopied,
    handleConvert,
    handleFileUpload,
    handleResetSample,
    copyTemplateJson,
    downloadTemplateJson,
  };
};

