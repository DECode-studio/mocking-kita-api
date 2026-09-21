'use client';

import React, { useState } from 'react';
import * as Tabs from '@radix-ui/react-tabs';
import {
  CheckCircle2,
  XCircle,
  Clock,
  Code2,
  Key,
  ShieldCheck,
  Send,
  DownloadCloud,
  Loader2,
} from 'lucide-react';
import { ScenarioFlowExecutionStep } from '@/src/client/domain/scenario-flow/entity/scenario_flow';

interface StepExecutionInspectorProps {
  step: ScenarioFlowExecutionStep | null;
  isRunning?: boolean;
}

export const StepExecutionInspector: React.FC<StepExecutionInspectorProps> = ({ step, isRunning }) => {
  const [activeTab, setActiveTab] = useState('response');

  if (isRunning) {
    return (
      <div className="h-64 flex flex-col items-center justify-center text-center p-6 bg-purple-50/40 dark:bg-purple-950/20 border border-purple-500/30 rounded-2xl space-y-3">
        <div className="w-12 h-12 rounded-2xl bg-purple-500/20 text-purple-600 dark:text-purple-400 flex items-center justify-center shadow-lg shadow-purple-500/20 animate-pulse">
          <Loader2 className="w-6 h-6 animate-spin text-purple-500" />
        </div>
        <div className="space-y-1">
          <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center justify-center gap-1.5">
            <span>Dispatching API Request...</span>
            <span className="w-2 h-2 rounded-full bg-purple-500 animate-ping" />
          </h4>
          <p className="text-[11px] text-slate-500 max-w-xs mx-auto">
            Executing HTTP request, calculating duration, and running assertions...
          </p>
        </div>
      </div>
    );
  }

  if (!step) {
    return (
      <div className="h-64 flex flex-col items-center justify-center text-center p-6 bg-slate-50/50 dark:bg-slate-950/40 border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl text-slate-400">
        <Code2 className="w-8 h-8 mb-2 opacity-50" />
        <p className="text-xs font-semibold">Select a step above to inspect its execution details</p>
        <p className="text-[11px] text-slate-500">View sent headers, payload, response body, and assertions</p>
      </div>
    );
  }

  const isSuccess = step.status === 'SUCCESS';
  const assertionResults = step.assertionResults || [];
  const extractedVars = step.extractedVariables || {};

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs space-y-4">
      {/* Top Inspector Header */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
        <div className="flex items-center gap-2.5">
          <span
            className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0 ${
              isSuccess ? 'bg-emerald-500' : 'bg-rose-500'
            }`}
          >
            {isSuccess ? <CheckCircle2 className="w-3.5 h-3.5" /> : <XCircle className="w-3.5 h-3.5" />}
          </span>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-900 dark:text-white font-mono">
                [{step.method}]
              </span>
              <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                {step.stepName}
              </span>
            </div>
            <p className="text-[11px] font-mono text-slate-500 line-clamp-1">{step.url}</p>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs font-mono">
          <span
            className={`px-2 py-0.5 rounded font-bold ${
              (step.httpStatusCode || 0) < 400
                ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                : 'bg-rose-500/10 text-rose-600 dark:text-rose-400'
            }`}
          >
            HTTP {step.httpStatusCode || 'N/A'}
          </span>
          <span className="text-slate-400 flex items-center gap-1">
            <Clock className="w-3 h-3" />
            {step.durationMs}ms
          </span>
        </div>
      </div>

      {/* Error Message banner if any */}
      {step.errorMessage && (
        <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl text-xs text-rose-600 dark:text-rose-400 font-mono">
          {step.errorMessage}
        </div>
      )}

      {/* Detail Tabs */}
      <Tabs.Root value={activeTab} onValueChange={setActiveTab}>
        <Tabs.List className="flex border-b border-slate-200 dark:border-slate-800 gap-4 mb-3">
          <Tabs.Trigger
            value="response"
            className={`pb-2 text-xs font-semibold flex items-center gap-1.5 border-b-2 transition-colors ${
              activeTab === 'response'
                ? 'border-purple-600 text-purple-600 dark:text-purple-400'
                : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            <DownloadCloud className="w-3.5 h-3.5" /> Response Body
          </Tabs.Trigger>
          <Tabs.Trigger
            value="request"
            className={`pb-2 text-xs font-semibold flex items-center gap-1.5 border-b-2 transition-colors ${
              activeTab === 'request'
                ? 'border-purple-600 text-purple-600 dark:text-purple-400'
                : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            <Send className="w-3.5 h-3.5" /> Request Sent
          </Tabs.Trigger>
          <Tabs.Trigger
            value="assertions"
            className={`pb-2 text-xs font-semibold flex items-center gap-1.5 border-b-2 transition-colors ${
              activeTab === 'assertions'
                ? 'border-purple-600 text-purple-600 dark:text-purple-400'
                : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" /> Assertions ({assertionResults.length})
          </Tabs.Trigger>
          <Tabs.Trigger
            value="variables"
            className={`pb-2 text-xs font-semibold flex items-center gap-1.5 border-b-2 transition-colors ${
              activeTab === 'variables'
                ? 'border-purple-600 text-purple-600 dark:text-purple-400'
                : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            <Key className="w-3.5 h-3.5" /> Extracted Variables
          </Tabs.Trigger>
        </Tabs.List>

        {/* Tab: Response */}
        <Tabs.Content value="response" className="space-y-3">
          <div className="bg-slate-950 rounded-xl p-3 font-mono text-xs text-slate-200 max-h-72 overflow-y-auto">
            <pre className="whitespace-pre-wrap word-break">
              {JSON.stringify(step.responseSnapshot?.body ?? null, null, 2)}
            </pre>
          </div>
          {step.responseSnapshot?.headers && (
            <div className="text-[11px] text-slate-500 font-mono">
              <span className="font-bold text-slate-600 dark:text-slate-400">Headers: </span>
              {Object.entries(step.responseSnapshot.headers)
                .slice(0, 5)
                .map(([k, v]) => `${k}: ${v}`)
                .join(', ')}
            </div>
          )}
        </Tabs.Content>

        {/* Tab: Request */}
        <Tabs.Content value="request" className="space-y-3">
          <div>
            <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
              Full Request URL
            </span>
            <div className="bg-slate-950 p-2.5 rounded-lg font-mono text-xs text-purple-300 word-break">
              {step.requestSnapshot?.url || step.url}
            </div>
          </div>

          <div>
            <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
              Request Headers
            </span>
            <div className="bg-slate-950 p-2.5 rounded-lg font-mono text-xs text-slate-300 max-h-36 overflow-y-auto">
              <pre>{JSON.stringify(step.requestSnapshot?.headers ?? {}, null, 2)}</pre>
            </div>
          </div>

          {step.requestSnapshot?.body !== undefined && (
            <div>
              <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                Request Body
              </span>
              <div className="bg-slate-950 p-2.5 rounded-lg font-mono text-xs text-slate-300 max-h-48 overflow-y-auto">
                <pre className="whitespace-pre-wrap word-break">
                  {typeof step.requestSnapshot.body === 'object'
                    ? JSON.stringify(step.requestSnapshot.body, null, 2)
                    : String(step.requestSnapshot.body)}
                </pre>
              </div>
            </div>
          )}
        </Tabs.Content>

        {/* Tab: Assertions */}
        <Tabs.Content value="assertions" className="space-y-2">
          {assertionResults.length === 0 ? (
            <p className="text-xs text-slate-400 italic py-4 text-center">
              No explicit assertions evaluated (verified HTTP 2xx/3xx).
            </p>
          ) : (
            <div className="space-y-2">
              {assertionResults.map((ast, idx) => (
                <div
                  key={idx}
                  className={`p-3 rounded-xl border text-xs flex items-start justify-between gap-3 ${
                    ast.passed
                      ? 'bg-emerald-500/5 border-emerald-500/20 text-slate-800 dark:text-slate-200'
                      : 'bg-rose-500/5 border-rose-500/20 text-rose-700 dark:text-rose-300'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    {ast.passed ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                    ) : (
                      <XCircle className="w-4 h-4 text-rose-500 shrink-0" />
                    )}
                    <span className="font-semibold font-mono">
                      {ast.rule.type} {ast.rule.operator} {String(ast.rule.expected ?? '')}
                    </span>
                  </div>
                  <div className="text-right font-mono text-[11px]">
                    <span className="text-slate-400">Actual: </span>
                    <span className="font-bold">{JSON.stringify(ast.actual)}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Tabs.Content>

        {/* Tab: Extracted Variables */}
        <Tabs.Content value="variables" className="space-y-2">
          {Object.keys(extractedVars).length === 0 ? (
            <p className="text-xs text-slate-400 italic py-4 text-center">
              No variables were extracted by this step.
            </p>
          ) : (
            <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden text-xs">
              <table className="w-full text-left">
                <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500">
                  <tr>
                    <th className="px-3 py-2 font-semibold">Variable</th>
                    <th className="px-3 py-2 font-semibold">Value Saved to Context</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-mono">
                  {Object.entries(extractedVars).map(([key, val]) => (
                    <tr key={key}>
                      <td className="px-3 py-2 text-purple-600 dark:text-purple-400 font-bold">
                        &#123;&#123;{key}&#125;&#125;
                      </td>
                      <td className="px-3 py-2 text-slate-900 dark:text-white break-all">
                        {typeof val === 'object' ? JSON.stringify(val) : String(val)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Tabs.Content>
      </Tabs.Root>
    </div>
  );
};
