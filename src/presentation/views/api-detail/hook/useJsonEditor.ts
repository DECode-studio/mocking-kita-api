import { useState, useEffect } from 'react';
import { formatJsonString, minifyJsonString, validateJsonString } from '@/src/core/utils/json';

export function useJsonEditor(
  value: unknown,
  onChange: (value: unknown) => void
) {
  const [text, setText] = useState<string>(() => {
    try {
      return typeof value === 'string' ? value : JSON.stringify(value ?? {}, null, 2);
    } catch {
      return '{}';
    }
  });
  const [copied, setCopied] = useState(false);
  const [validation, setValidation] = useState<{ isValid: boolean; error?: string }>({ isValid: true });

  useEffect(() => {
    try {
      const formatted = typeof value === 'string' ? value : JSON.stringify(value ?? {}, null, 2);
      setText(formatted);
      setValidation({ isValid: true });
    } catch {
      setText('{}');
    }
  }, [value]);

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    setText(val);

    const res = validateJsonString(val);
    setValidation(res);

    if (res.isValid) {
      try {
        const parsed = JSON.parse(val || 'null');
        onChange(parsed);
      } catch {}
    }
  };

  const handleFormat = () => {
    const formatted = formatJsonString(text);
    setText(formatted);
    const res = validateJsonString(formatted);
    setValidation(res);
    if (res.isValid) {
      try {
        onChange(JSON.parse(formatted));
      } catch {}
    }
  };

  const handleMinify = () => {
    const minified = minifyJsonString(text);
    setText(minified);
    const res = validateJsonString(minified);
    setValidation(res);
    if (res.isValid) {
      try {
        onChange(JSON.parse(minified));
      } catch {}
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleReset = () => {
    const resetVal = '{}';
    setText(resetVal);
    setValidation({ isValid: true });
    onChange({});
  };

  return {
    text,
    copied,
    validation,
    handleTextChange,
    handleFormat,
    handleMinify,
    handleCopy,
    handleReset,
  };
}
