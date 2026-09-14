'use client';


import React from 'react';
import { Copy, Check, Sparkles, Minimize2, RotateCcw, AlertTriangle } from 'lucide-react';
import { useJsonEditor } from '../hook/useJsonEditor';

interface JsonEditorProps {
  value: unknown;
  onChange: (value: unknown) => void;
  title?: string;
  rows?: number;
  readOnly?: boolean;
}

export const JsonEditor: React.FC<JsonEditorProps> = ({
  value,
  onChange,
  title = 'JSON Payload',
  rows = 10,
  readOnly = false,
}) => {
  const {
    text,
    copied,
    validation,
    handleTextChange,
    handleFormat,
    handleMinify,
    handleCopy,
    handleReset,
  } = useJsonEditor(value, onChange);

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <h4 className="text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
          {title}
        </h4>
        <div className="flex items-center gap-1.5">
          {!readOnly && (
            <>
              <button
                type="button"
                onClick={handleFormat}
                className="inline-flex items-center gap-1 px-2 py-0.5 text-[11px] font-medium text-slate-600 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 bg-slate-100 dark:bg-slate-800 rounded border border-slate-200 dark:border-slate-700 transition-colors"
                title="Prettify JSON"
              >
                <Sparkles className="w-3 h-3 text-amber-500" />
                Format
              </button>
              <button
                type="button"
                onClick={handleMinify}
                className="inline-flex items-center gap-1 px-2 py-0.5 text-[11px] font-medium text-slate-600 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 bg-slate-100 dark:bg-slate-800 rounded border border-slate-200 dark:border-slate-700 transition-colors"
                title="Minify JSON"
              >
                <Minimize2 className="w-3 h-3" />
                Minify
              </button>
              <button
                type="button"
                onClick={handleReset}
                className="inline-flex items-center gap-1 px-2 py-0.5 text-[11px] font-medium text-slate-600 dark:text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 bg-slate-100 dark:bg-slate-800 rounded border border-slate-200 dark:border-slate-700 transition-colors"
                title="Reset to empty object"
              >
                <RotateCcw className="w-3 h-3" />
                Reset
              </button>
            </>
          )}
          <button
            type="button"
            onClick={handleCopy}
            className="inline-flex items-center gap-1 px-2 py-0.5 text-[11px] font-medium text-slate-600 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 bg-slate-100 dark:bg-slate-800 rounded border border-slate-200 dark:border-slate-700 transition-colors"
            title="Copy JSON to clipboard"
          >
            {copied ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
            {copied ? 'Copied' : 'Copy'}
          </button>
        </div>
      </div>

      <div className="relative">
        <textarea
          value={text}
          onChange={handleTextChange}
          readOnly={readOnly}
          rows={rows}
          spellCheck={false}
          className={`w-full p-3 font-mono text-xs bg-slate-950 text-emerald-400 dark:text-emerald-300 rounded-lg border focus:ring-1 focus:outline-none resize-y leading-relaxed shadow-inner ${
            !validation.isValid ? 'border-rose-500/80 focus:ring-rose-500' : 'border-slate-800 focus:ring-indigo-500'
          }`}
        />
        {!validation.isValid && (
          <div className="mt-1.5 flex items-center gap-1.5 px-3 py-1.5 text-xs text-rose-400 bg-rose-950/40 border border-rose-800/60 rounded-md">
            <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
            <span>{validation.error}</span>
          </div>
        )}
      </div>
    </div>
  );
};