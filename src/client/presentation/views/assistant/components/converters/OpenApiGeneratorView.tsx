'use client';

import React, { useState } from 'react';
import {
  Code2,
  Sparkles,
  Upload,
  AlertCircle,
  Copy,
  Check,
} from 'lucide-react';
import { convertOpenApiToMockStudio, OpenApiConvertResult } from '@/src/core/ai/openapi-to-mock';

const SAMPLE_OPENAPI_PAYLOAD = `{
  "openapi": "3.0.3",
  "info": {
    "title": "Payment & Order Gateway",
    "version": "1.0.0"
  },
  "servers": [
    { "url": "https://api.mockingkita.com/v1" }
  ],
  "paths": {
    "/orders": {
      "post": {
        "tags": ["Orders"],
        "summary": "Create new order transaction",
        "requestBody": {
          "required": true,
          "content": {
            "application/json": {
              "schema": {
                "type": "object",
                "properties": {
                  "amount": { "type": "integer", "example": 150000 },
                  "customerEmail": { "type": "string", "format": "email" }
                }
              }
            }
          }
        },
        "responses": {
          "201": {
            "description": "Order created successfully",
            "content": {
              "application/json": {
                "schema": {
                  "type": "object",
                  "properties": {
                    "orderId": { "type": "string", "format": "uuid" },
                    "status": { "type": "string", "enum": ["PENDING", "PAID"] },
                    "createdAt": { "type": "string", "format": "date-time" }
                  }
                }
              }
            }
          }
        }
      },
      "get": {
        "tags": ["Orders"],
        "summary": "List customer orders",
        "responses": {
          "200": {
            "description": "List of orders",
            "content": {
              "application/json": {
                "schema": {
                  "type": "array",
                  "items": {
                    "type": "object",
                    "properties": {
                      "orderId": { "type": "string", "format": "uuid" },
                      "amount": { "type": "integer" }
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
  }
}`;

export const OpenApiGeneratorView: React.FC = () => {
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

  const copySampleJson = (body: any, idx: number) => {
    navigator.clipboard.writeText(JSON.stringify(body, null, 2));
    setCopiedIdx(idx);
    setTimeout(() => setCopiedIdx(null), 2000);
  };

  return (
    <div className="space-y-6">
      <div className="p-5 rounded-2xl bg-linear-to-r from-emerald-900/20 via-teal-900/20 to-slate-900/40 border border-emerald-500/20 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Code2 className="w-5 h-5 text-emerald-400" />
            <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
              OpenAPI / Swagger → Mock API & Scenario Generator
            </h3>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-2xl">
            Parse dokumen Swagger 2.0 / OpenAPI 3.x (JSON atau YAML) menjadi daftar endpoint terstruktur, sample mock response payload otomatis, dan pengelompokan koleksi.
          </p>
        </div>

        <label className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-md shadow-emerald-600/30 cursor-pointer transition-all shrink-0">
          <Upload className="w-4 h-4" />
          <span>Upload File OpenAPI</span>
          <input type="file" accept=".json,.yaml,.yml" onChange={handleFileUpload} className="hidden" />
        </label>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="flex flex-col space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              Paste OpenAPI / Swagger Document (JSON / YAML):
            </span>
            <button
              type="button"
              onClick={() => setRawInput(SAMPLE_OPENAPI_PAYLOAD)}
              className="text-xs text-emerald-500 hover:text-emerald-400 underline"
            >
              Muat Contoh
            </button>
          </div>

          <textarea
            value={rawInput}
            onChange={(e) => setRawInput(e.target.value)}
            rows={16}
            placeholder="Paste spesifikasi OpenAPI 3.x atau Swagger 2.0 di sini..."
            className="w-full font-mono text-xs p-4 rounded-2xl border border-slate-300 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 resize-none leading-relaxed shadow-inner"
          />

          <button
            type="button"
            onClick={handleConvert}
            className="w-full py-2.5 rounded-xl bg-linear-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold shadow-lg shadow-emerald-500/25 transition-all flex items-center justify-center gap-2"
          >
            <Sparkles className="w-4 h-4" />
            <span>Generate Mock APIs</span>
          </button>
        </div>

        <div className="flex flex-col space-y-3">
          <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
            Daftar Endpoint & Sample Mock Payload:
          </span>

          {result?.error ? (
            <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-500 text-xs flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold">Gagal Parsing:</span>
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
                            <span className="text-[10px]">Salin Mock</span>
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
              <p className="text-xs font-medium">Klik "Generate Mock APIs" untuk mem-parse endpoint dan membuat sample mock body.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
