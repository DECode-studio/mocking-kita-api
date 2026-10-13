'use client';

import React, { useState } from 'react';
import {
  Cpu,
  Sparkles,
  CheckCircle2,
  XCircle,
  ShieldCheck,
} from 'lucide-react';
import {
  simulateVariableInterpolation,
  simulateAssertions,
  SimulationResult,
  AssertionSimulationResult,
} from '@/src/core/ai/variable-simulator';

const SAMPLE_PAYLOAD_TO_INTERPOLATE = `{
  "transactionId": "{{$uuid}}",
  "timestamp": "{{$timestamp}}",
  "createdAt": "{{$isoDate}}",
  "user": {
    "name": "{{defaultUserName}}",
    "phone": "{{datasheet.customers.next.phoneNumber}}",
    "role": "{{userRole}}"
  },
  "authToken": "Bearer {{authToken}}"
}`;

const SAMPLE_VARIABLES = `{
  "defaultUserName": "Budi Pratama",
  "userRole": "SUPER_ADMIN",
  "authToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}`;

const SAMPLE_DATASHEET = `{
  "phoneNumber": "081298765432",
  "email": "budi.pratama@example.com"
}`;

export const VariableSimulatorView: React.FC = () => {
  const [templateInput, setTemplateInput] = useState(SAMPLE_PAYLOAD_TO_INTERPOLATE);
  const [varsInput, setVarsInput] = useState(SAMPLE_VARIABLES);
  const [dataSheetInput, setDataSheetInput] = useState(SAMPLE_DATASHEET);
  const [simulationResult, setSimulationResult] = useState<SimulationResult | null>(null);

  const [actualStatusCode, setActualStatusCode] = useState(200);
  const [actualResponseTime, setActualResponseTime] = useState(180);
  const [actualResponseBody, setActualResponseBody] = useState(`{
  "code": "SUCCESS",
  "message": "User verified successfully",
  "data": {
    "userId": "usr_99812",
    "status": "ACTIVE"
  }
}`);

  const [assertionResult, setAssertionResult] = useState<AssertionSimulationResult | null>(null);

  const handleSimulateVariables = () => {
    let parsedPayload: any = templateInput;
    try {
      parsedPayload = JSON.parse(templateInput);
    } catch {
      parsedPayload = templateInput;
    }

    let parsedVars: Record<string, any> = {};
    try {
      parsedVars = JSON.parse(varsInput);
    } catch {
      parsedVars = {};
    }

    let parsedSheet: Record<string, any> = {};
    try {
      parsedSheet = JSON.parse(dataSheetInput);
    } catch {
      parsedSheet = {};
    }

    const res = simulateVariableInterpolation(parsedPayload, {
      variables: parsedVars,
      dataSheetValues: parsedSheet,
    });
    setSimulationResult(res);
  };

  const handleTestAssertions = () => {
    let parsedBody: any = {};
    try {
      parsedBody = JSON.parse(actualResponseBody);
    } catch {
      parsedBody = actualResponseBody;
    }

    const res = simulateAssertions({
      actualStatusCode,
      actualResponseTime,
      actualBody: parsedBody,
      assertions: [
        {
          type: 'STATUS_CODE',
          operator: 'EQUALS',
          expectedValue: '200',
          message: 'Status code harus sama dengan 200 (OK)',
        },
        {
          type: 'RESPONSE_TIME',
          operator: 'LESS_THAN',
          expectedValue: '500',
          message: 'Response time harus di bawah 500ms',
        },
        {
          type: 'JSON_PATH',
          property: '$.code',
          operator: 'EQUALS',
          expectedValue: 'SUCCESS',
          message: 'Field $.code harus bernilai "SUCCESS"',
        },
        {
          type: 'JSON_PATH',
          property: '$.data.status',
          operator: 'EQUALS',
          expectedValue: 'ACTIVE',
          message: 'Status user harus bernilai "ACTIVE"',
        },
      ],
    });
    setAssertionResult(res);
  };

  return (
    <div className="space-y-6">
      {/* Section 1: Variable & Token Interpolation Simulator */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/70 p-5 shadow-xs space-y-4">
        <div className="p-4 rounded-xl bg-linear-to-r from-purple-900/20 via-indigo-900/20 to-slate-900/30 border border-purple-500/20 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <Cpu className="w-4 h-4 text-purple-400" />
              <span>Runtime Variable & Token Interpolation Simulator</span>
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Uji coba penggantian token dinamis `{'{{var}}'}`, generator `{'{{$uuid}}'}`, timestamp, dan Data Sheet iterator.
            </p>
          </div>

          <button
            type="button"
            onClick={handleSimulateVariables}
            className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold shadow-md shadow-purple-600/30 flex items-center gap-1.5 transition-all shrink-0 cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Simulasikan Variabel</span>
          </button>
        </div>

        {/* 3-Column Symmetric Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 items-stretch">
          {/* Column 1: Payload / String Template */}
          <div className="flex flex-col space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                1. Payload / String Template:
              </span>
              <button
                type="button"
                onClick={() => setTemplateInput(SAMPLE_PAYLOAD_TO_INTERPOLATE)}
                className="text-[11px] text-purple-600 dark:text-purple-400 hover:underline"
              >
                Reset Contoh
              </button>
            </div>
            <textarea
              value={templateInput}
              onChange={(e) => setTemplateInput(e.target.value)}
              placeholder="Paste JSON atau teks dengan token {{var}}..."
              className="flex-1 w-full min-h-75 font-mono text-xs p-3.5 rounded-xl border border-slate-300 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950 text-slate-800 dark:text-slate-200 resize-none focus:outline-none focus:ring-2 focus:ring-purple-500/30 shadow-inner leading-relaxed"
            />
          </div>

          {/* Column 2: Context Variables & Data Sheet */}
          <div className="flex flex-col space-y-2">
            <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              2. Context Variables & Data Sheet:
            </span>
            <div className="flex-1 flex flex-col gap-3 min-h-75">
              <div className="flex-1 flex flex-col">
                <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium mb-1">
                  Environment Variables (JSON):
                </span>
                <textarea
                  value={varsInput}
                  onChange={(e) => setVarsInput(e.target.value)}
                  placeholder="Variables JSON..."
                  className="flex-1 w-full min-h-30 font-mono text-xs p-3 rounded-xl border border-slate-300 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950 text-slate-800 dark:text-slate-200 resize-none focus:outline-none focus:ring-2 focus:ring-purple-500/30 shadow-inner"
                />
              </div>
              <div className="flex-1 flex flex-col">
                <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium mb-1">
                  Data Sheet Column Row (JSON):
                </span>
                <textarea
                  value={dataSheetInput}
                  onChange={(e) => setDataSheetInput(e.target.value)}
                  placeholder="DataSheet Column Values..."
                  className="flex-1 w-full min-h-30 font-mono text-xs p-3 rounded-xl border border-slate-300 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950 text-slate-800 dark:text-slate-200 resize-none focus:outline-none focus:ring-2 focus:ring-purple-500/30 shadow-inner"
                />
              </div>
            </div>
          </div>

          {/* Column 3: Interpolated Output */}
          <div className="flex flex-col space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                3. Hasil Interpolasi Evaluated:
              </span>
              {simulationResult && (
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 font-mono font-medium">
                  {simulationResult.replacedTokens.length} token diganti
                </span>
              )}
            </div>
            <pre className="flex-1 w-full min-h-75 font-mono text-xs p-3.5 rounded-xl border border-slate-300 dark:border-slate-800 bg-slate-950 text-slate-200 overflow-auto shadow-inner leading-relaxed select-text">
              <code>
                {simulationResult
                  ? JSON.stringify(simulationResult.interpolated, null, 2)
                  : '// Klik "Simulasikan Variabel" untuk melihat hasil evaluasi'}
              </code>
            </pre>
          </div>
        </div>
      </div>

      {/* Section 2: Assertion Rules & Response Validator Simulator */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/70 p-5 shadow-xs space-y-4">
        <div className="p-4 rounded-xl bg-linear-to-r from-emerald-900/20 via-teal-900/20 to-slate-900/30 border border-emerald-500/20 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>Assertion Rules & JSONPath Validator Simulator</span>
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Simulasi evaluasi asersi respon API (HTTP Status, response time, dan JSONPath match).
            </p>
          </div>

          <button
            type="button"
            onClick={handleTestAssertions}
            className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-md shadow-emerald-600/30 flex items-center gap-1.5 transition-all shrink-0 cursor-pointer"
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Uji Asersi</span>
          </button>
        </div>

        {/* 2-Column Symmetric Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 items-stretch">
          {/* Left Column: Input Actual Response */}
          <div className="flex flex-col space-y-3">
            <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              Input Respon API Aktual:
            </span>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] font-medium text-slate-500 dark:text-slate-400 block mb-1">
                  Actual HTTP Status:
                </label>
                <input
                  type="number"
                  value={actualStatusCode}
                  onChange={(e) => setActualStatusCode(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
                />
              </div>
              <div>
                <label className="text-[11px] font-medium text-slate-500 dark:text-slate-400 block mb-1">
                  Actual Response Time (ms):
                </label>
                <input
                  type="number"
                  value={actualResponseTime}
                  onChange={(e) => setActualResponseTime(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
                />
              </div>
            </div>

            <div className="flex-1 flex flex-col">
              <label className="text-[11px] font-medium text-slate-500 dark:text-slate-400 block mb-1">
                Actual Response Body (JSON):
              </label>
              <textarea
                value={actualResponseBody}
                onChange={(e) => setActualResponseBody(e.target.value)}
                placeholder="Paste response body JSON..."
                className="flex-1 w-full min-h-43.75 font-mono text-xs p-3 rounded-xl border border-slate-300 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950 text-slate-800 dark:text-slate-200 resize-none focus:outline-none focus:ring-2 focus:ring-emerald-500/30 shadow-inner leading-relaxed"
              />
            </div>
          </div>

          {/* Right Column: Assertion Results */}
          <div className="flex flex-col space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Hasil Evaluasi Asersi:
              </span>
              {assertionResult && (
                <span
                  className={`text-[10px] px-2 py-0.5 rounded-full font-semibold font-mono ${
                    assertionResult.passed
                      ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400'
                      : 'bg-rose-500/15 text-rose-600 dark:text-rose-400'
                  }`}
                >
                  {assertionResult.passed ? 'ALL PASSED (4/4)' : 'FAILED ASSERTIONS'}
                </span>
              )}
            </div>

            <div className="flex-1 rounded-xl border border-slate-300 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950 p-3 min-h-61.25 flex flex-col justify-start">
              {assertionResult ? (
                <div className="space-y-2.5 overflow-y-auto max-h-62.5 pr-1">
                  {assertionResult.results.map((res, idx) => (
                    <div
                      key={idx}
                      className={`p-3 rounded-xl border text-xs flex items-start gap-2.5 transition-all ${
                        res.passed
                          ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-700 dark:text-emerald-300'
                          : 'bg-rose-500/10 border-rose-500/30 text-rose-700 dark:text-rose-300'
                      }`}
                    >
                      {res.passed ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                      ) : (
                        <XCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold">{res.message}</div>
                        <div className="text-[11px] font-mono opacity-80 mt-0.5">
                          Actual: <span className="font-bold">{String(res.actualValue)}</span> | Expected:{' '}
                          <span className="font-bold">{String(res.expectedValue)}</span> ({res.operator})
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center p-6 text-center text-slate-400">
                  <ShieldCheck className="w-8 h-8 text-slate-500 mb-1.5 opacity-60" />
                  <p className="text-xs font-medium">Klik "Uji Asersi" untuk melihat simulasi validasi response.</p>
                  <p className="text-[11px] text-slate-500 mt-0.5">Evaluasi status code, latency (ms), dan aturan JSONPath.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
