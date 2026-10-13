'use client';

import React, { useState } from 'react';
import {
  FileCode,
  Copy,
  Check,
  Download,
  AlertCircle,
  Layers,
  Sparkles,
  Upload,
} from 'lucide-react';
import { convertInsomniaToScenarioFlow, InsomniaConvertResult } from '@/src/core/ai/insomnia-to-scenario';

const SAMPLE_INSOMNIA_PAYLOAD = `{
  "_type": "export",
  "__export_format": 4,
  "__export_date": "2026-10-08T00:00:00.000Z",
  "resources": [
    {
      "_id": "wrk_1",
      "_type": "workspace",
      "name": "Auth & Profile Service"
    },
    {
      "_id": "env_base",
      "_type": "environment",
      "name": "Base Environment",
      "data": {
        "baseUrl": "https://api-dev.mockingkita.com"
      }
    },
    {
      "_id": "req_login",
      "_type": "request",
      "name": "User Login",
      "method": "POST",
      "url": "{{baseUrl}}/v1/auth/login",
      "headers": [
        { "name": "Content-Type", "value": "application/json" }
      ],
      "body": {
        "mimeType": "application/json",
        "text": "{\\"username\\": \\"admin@mockingkita.com\\", \\"password\\": \\"secret123\\"}"
      }
    },
    {
      "_id": "req_profile",
      "_type": "request",
      "name": "Get User Profile",
      "method": "GET",
      "url": "{{baseUrl}}/v1/users/me",
      "headers": [
        { "name": "Authorization", "value": "Bearer {% response 'body', 'req_login', 'b64::JC5kYXRhLnRva2Vu::46bf', 'never', 60 %}" }
      ]
    }
  ]
}`;

export const InsomniaConverterView: React.FC = () => {
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

  return (
    <div className="space-y-6">
      <div className="p-5 rounded-2xl bg-linear-to-r from-purple-900/20 via-indigo-900/20 to-slate-900/40 border border-purple-500/20 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Layers className="w-5 h-5 text-purple-400" />
            <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
              Insomnia Collection → Scenario Flow Template Converter
            </h3>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-2xl">
            Konversi export koleksi Insomnia (YAML/JSON v4/v5) menjadi Scenario Flow Template JSON v1 standar dengan auto-mapping environment, request scenarios, topological sort, dan ekstraksi variabel tag chaining.
          </p>
        </div>

        <label className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold shadow-md shadow-purple-600/30 cursor-pointer transition-all shrink-0">
          <Upload className="w-4 h-4" />
          <span>Upload File Insomnia</span>
          <input type="file" accept=".json,.yaml,.yml" onChange={handleFileUpload} className="hidden" />
        </label>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="flex flex-col space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              Paste Insomnia Export (YAML / JSON):
            </span>
            <button
              type="button"
              onClick={() => setRawInput(SAMPLE_INSOMNIA_PAYLOAD)}
              className="text-xs text-purple-500 hover:text-purple-400 underline"
            >
              Muat Contoh
            </button>
          </div>

          <textarea
            value={rawInput}
            onChange={(e) => setRawInput(e.target.value)}
            rows={16}
            placeholder="Paste JSON atau YAML export dari Insomnia di sini..."
            className="w-full font-mono text-xs p-4 rounded-2xl border border-slate-300 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-purple-500/30 resize-none leading-relaxed shadow-inner"
          />

          <button
            type="button"
            onClick={handleConvert}
            className="w-full py-2.5 rounded-xl bg-linear-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs font-bold shadow-lg shadow-purple-500/25 transition-all flex items-center justify-center gap-2"
          >
            <Sparkles className="w-4 h-4" />
            <span>Konversi Sekarang</span>
          </button>
        </div>

        <div className="flex flex-col space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              Hasil Template JSON (v1):
            </span>

            {result?.success && (
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={copyTemplateJson}
                  className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs transition-colors"
                >
                  {isCopied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{isCopied ? 'Tersalin' : 'Salin JSON'}</span>
                </button>
                <button
                  type="button"
                  onClick={downloadTemplateJson}
                  className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-purple-600 hover:bg-purple-500 text-white text-xs transition-colors"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download .json</span>
                </button>
              </div>
            )}
          </div>

          {result?.error ? (
            <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-500 text-xs flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold">Gagal Konversi:</span>
                <p className="mt-1 font-mono">{result.error}</p>
              </div>
            </div>
          ) : result?.template ? (
            <div className="space-y-3 flex-1 flex flex-col">
              {result.summary && (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center text-xs">
                  <div className="p-2.5 rounded-xl bg-purple-500/10 border border-purple-500/20">
                    <span className="text-slate-400 text-[10px] block">Total Steps</span>
                    <span className="text-sm font-bold text-purple-400">{result.summary.totalSteps}</span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-indigo-500/10 border border-indigo-500/20">
                    <span className="text-slate-400 text-[10px] block">Environments</span>
                    <span className="text-sm font-bold text-indigo-400">{result.summary.environmentsExtracted}</span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                    <span className="text-slate-400 text-[10px] block">Tag Chaining</span>
                    <span className="text-sm font-bold text-emerald-400">{result.summary.chainingTagsFound}</span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20">
                    <span className="text-slate-400 text-[10px] block">Variabel</span>
                    <span className="text-sm font-bold text-amber-400">{result.summary.variablesFound.length}</span>
                  </div>
                </div>
              )}

              <pre className="flex-1 font-mono text-xs p-4 rounded-2xl border border-slate-300 dark:border-slate-800 bg-slate-950 text-slate-200 overflow-auto max-h-95 leading-relaxed shadow-inner">
                <code>{JSON.stringify(result.template, null, 2)}</code>
              </pre>
            </div>
          ) : (
            <div className="flex-1 rounded-2xl border border-dashed border-slate-300 dark:border-slate-800 flex flex-col items-center justify-center p-8 text-center text-slate-400">
              <FileCode className="w-10 h-10 text-slate-500 mb-2 stroke-1" />
              <p className="text-xs font-medium">Klik "Konversi Sekarang" atau upload file untuk melihat hasil template JSON.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
