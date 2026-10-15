'use client';

import React from 'react';
import {
  Code2,
  Sparkles,
  Upload,
  AlertCircle,
  Copy,
  Check,
} from 'lucide-react';
import { useOpenApiGenerator } from '../hook/useOpenApiGenerator';
import { ASSISTANT_TEXT, ASSISTANT_SEMANTIC_ID } from '../constant';

export const OpenApiGenerator: React.FC = () => {
  const {
    rawInput,
    setRawInput,
    result,
    copiedIdx,
    handleConvert,
    handleFileUpload,
    handleResetSample,
    copySampleJson,
  } = useOpenApiGenerator();

  return (
    <div id={ASSISTANT_SEMANTIC_ID.CONVERTER_OPENAPI_CONTAINER} className="space-y-6">
      <div className="p-5 rounded-2xl bg-linear-to-r from-emerald-900/20 via-teal-900/20 to-slate-900/40 border border-emerald-500/20 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Code2 className="w-5 h-5 text-emerald-400" />
            <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
              {ASSISTANT_TEXT.CONVERTERS.OPENAPI_TITLE}
            </h3>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-2xl">
            {ASSISTANT_TEXT.CONVERTERS.OPENAPI_DESC}
          </p>
        </div>

        <label className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-md shadow-emerald-600/30 cursor-pointer transition-all shrink-0">
          <Upload className="w-4 h-4" />
          <span>{ASSISTANT_TEXT.CONVERTERS.OPENAPI_UPLOAD_BTN}</span>
          <input
            id={ASSISTANT_SEMANTIC_ID.CONVERTER_OPENAPI_UPLOAD_INPUT}
            type="file"
            accept=".json,.yaml,.yml"
            onChange={handleFileUpload}
            className="hidden"
          />
        </label>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="flex flex-col space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              {ASSISTANT_TEXT.CONVERTERS.OPENAPI_PASTE_LABEL}
            </span>
            <button
              id={ASSISTANT_SEMANTIC_ID.CONVERTER_OPENAPI_RESET_BTN}
              type="button"
              onClick={handleResetSample}
              className="text-xs text-emerald-500 hover:text-emerald-400 underline"
            >
              {ASSISTANT_TEXT.CONVERTERS.INSOMNIA_LOAD_SAMPLE}
            </button>
          </div>

          <textarea
            id={ASSISTANT_SEMANTIC_ID.CONVERTER_OPENAPI_INPUT}
            value={rawInput}
            onChange={(e) => setRawInput(e.target.value)}
            rows={16}
            placeholder={ASSISTANT_TEXT.CONVERTERS.OPENAPI_PLACEHOLDER}
            className="w-full font-mono text-xs p-4 rounded-2xl border border-slate-300 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 resize-none leading-relaxed shadow-inner"
          />

          <button
            id={ASSISTANT_SEMANTIC_ID.CONVERTER_OPENAPI_GENERATE_BTN}
            type="button"
            onClick={handleConvert}
            className="w-full py-2.5 rounded-xl bg-linear-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold shadow-lg shadow-emerald-500/25 transition-all flex items-center justify-center gap-2"
          >
            <Sparkles className="w-4 h-4" />
            <span>{ASSISTANT_TEXT.CONVERTERS.OPENAPI_GENERATE_BTN}</span>
          </button>
        </div>

        <div className="flex flex-col space-y-3">
          <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
            {ASSISTANT_TEXT.CONVERTERS.OPENAPI_RESULT_LABEL}
          </span>

          {result?.error ? (
            <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-500 text-xs flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold">{ASSISTANT_TEXT.CONVERTERS.OPENAPI_ERROR_TITLE}</span>
                <p className="mt-1 font-mono">{result.error}</p>
              </div>
            </div>
          ) : result?.endpoints && result.endpoints.length > 0 ? (
            <div className="space-y-3 flex-1 flex flex-col">
              <div className="flex items-center gap-2 flex-wrap text-xs">
                <span className="px-2.5 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-600 dark:text-emerald-300 font-semibold">
                  {result.totalEndpoints} Endpoint Terdeteksi
                </span>
                <span className="px-2.5 py-1 rounded-full bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                  {result.collections?.length} Koleksi
                </span>
                <span className="px-2.5 py-1 rounded-full bg-purple-500/15 text-purple-600 dark:text-purple-300">
                  {result.title} (v{result.version})
                </span>
              </div>

              <div className="space-y-3 max-h-105 overflow-y-auto pr-1">
                {result.endpoints.map((ep, idx) => (
                  <div
                    key={idx}
                    className="p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs space-y-2.5"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <span
                          className={`px-2 py-0.5 rounded text-[11px] font-bold font-mono ${
                            ep.method === 'GET'
                              ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400'
                              : ep.method === 'POST'
                              ? 'bg-blue-500/20 text-blue-600 dark:text-blue-400'
                              : ep.method === 'PUT'
                              ? 'bg-amber-500/20 text-amber-600 dark:text-amber-400'
                              : 'bg-rose-500/20 text-rose-600 dark:text-rose-400'
                          }`}
                        >
                          {ep.method}
                        </span>
                        <span className="font-mono text-xs font-semibold text-slate-800 dark:text-slate-200 truncate">
                          {ep.path}
                        </span>
                      </div>
                      <span className="text-[10px] px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-500 shrink-0">
                        {ep.collection}
                      </span>
                    </div>

                    <p className="text-xs text-slate-500 dark:text-slate-400">{ep.summary}</p>

                    {ep.responses.map((res, rIdx) => (
                      <div key={rIdx} className="rounded-xl bg-slate-950 p-2.5 text-xs font-mono space-y-1">
                        <div className="flex items-center justify-between text-[11px] text-slate-400 border-b border-slate-800 pb-1">
                          <span className="text-emerald-400 font-bold">HTTP {res.statusCode} ({res.description})</span>
                          <button
                            type="button"
                            onClick={() => copySampleJson(res.sampleBody, idx * 10 + rIdx)}
                            className="flex items-center gap-1 text-slate-400 hover:text-white"
                          >
                            {copiedIdx === idx * 10 + rIdx ? (
                              <Check className="w-3 h-3 text-emerald-400" />
                            ) : (
                              <Copy className="w-3 h-3" />
                            )}
                            <span className="text-[10px]">{ASSISTANT_TEXT.CONVERTERS.OPENAPI_COPY_MOCK}</span>
                          </button>
                        </div>
                        <pre className="text-slate-300 text-[11px] max-h-24 overflow-auto pt-1">
                          {JSON.stringify(res.sampleBody, null, 2)}
                        </pre>
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="flex-1 rounded-2xl border border-dashed border-slate-300 dark:border-slate-800 flex flex-col items-center justify-center p-8 text-center text-slate-400">
              <Code2 className="w-10 h-10 text-slate-500 mb-2 stroke-1" />
              <p className="text-xs font-medium">{ASSISTANT_TEXT.CONVERTERS.OPENAPI_EMPTY_HINT}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export const OpenApiGeneratorView = OpenApiGenerator;

