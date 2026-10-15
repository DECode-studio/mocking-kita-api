'use client';

import React from 'react';
import {
  Cpu,
  Sparkles,
  CheckCircle2,
  XCircle,
  ShieldCheck,
} from 'lucide-react';
import { useVariableSimulator } from '../hook/useVariableSimulator';
import { ASSISTANT_TEXT, ASSISTANT_SEMANTIC_ID } from '../constant';

export const VariableSimulator: React.FC = () => {
  const {
    templateInput,
    setTemplateInput,
    varsInput,
    setVarsInput,
    dataSheetInput,
    setDataSheetInput,
    simulationResult,
    actualStatusCode,
    setActualStatusCode,
    actualResponseTime,
    setActualResponseTime,
    actualResponseBody,
    setActualResponseBody,
    assertionResult,
    handleResetSampleTemplate,
    handleSimulateVariables,
    handleTestAssertions,
  } = useVariableSimulator();

  return (
    <div id={ASSISTANT_SEMANTIC_ID.SIMULATOR_CONTAINER} className="space-y-6">
      {/* Section 1: Variable & Token Interpolation Simulator */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/70 p-5 shadow-xs space-y-4">
        <div className="p-4 rounded-xl bg-linear-to-r from-purple-900/20 via-indigo-900/20 to-slate-900/30 border border-purple-500/20 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <Cpu className="w-4 h-4 text-purple-400" />
              <span>{ASSISTANT_TEXT.CONVERTERS.SIMULATOR_VAR_TITLE}</span>
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              {ASSISTANT_TEXT.CONVERTERS.SIMULATOR_VAR_DESC}
            </p>
          </div>

          <button
            id={ASSISTANT_SEMANTIC_ID.SIMULATOR_RUN_BTN}
            type="button"
            onClick={handleSimulateVariables}
            className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold shadow-md shadow-purple-600/30 flex items-center gap-1.5 transition-all shrink-0 cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>{ASSISTANT_TEXT.CONVERTERS.SIMULATOR_VAR_BTN}</span>
          </button>
        </div>

        {/* 3-Column Symmetric Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 items-stretch">
          {/* Column 1: Payload / String Template */}
          <div className="flex flex-col space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                {ASSISTANT_TEXT.CONVERTERS.SIMULATOR_PAYLOAD_LABEL}
              </span>
              <button
                id={ASSISTANT_SEMANTIC_ID.SIMULATOR_RESET_BTN}
                type="button"
                onClick={handleResetSampleTemplate}
                className="text-[11px] text-purple-600 dark:text-purple-400 hover:underline"
              >
                {ASSISTANT_TEXT.CONVERTERS.SIMULATOR_RESET_EXAMPLE}
              </button>
            </div>
            <textarea
              id={ASSISTANT_SEMANTIC_ID.SIMULATOR_TEMPLATE_INPUT}
              value={templateInput}
              onChange={(e) => setTemplateInput(e.target.value)}
              placeholder={ASSISTANT_TEXT.CONVERTERS.SIMULATOR_PAYLOAD_PLACEHOLDER}
              className="flex-1 w-full min-h-75 font-mono text-xs p-3.5 rounded-xl border border-slate-300 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950 text-slate-800 dark:text-slate-200 resize-none focus:outline-none focus:ring-2 focus:ring-purple-500/30 shadow-inner leading-relaxed"
            />
          </div>

          {/* Column 2: Context Variables & Data Sheet */}
          <div className="flex flex-col space-y-2">
            <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              {ASSISTANT_TEXT.CONVERTERS.SIMULATOR_CONTEXT_LABEL}
            </span>
            <div className="flex-1 flex flex-col gap-3 min-h-75">
              <div className="flex-1 flex flex-col">
                <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium mb-1">
                  {ASSISTANT_TEXT.CONVERTERS.SIMULATOR_ENV_VARS_LABEL}
                </span>
                <textarea
                  id={ASSISTANT_SEMANTIC_ID.SIMULATOR_VARS_INPUT}
                  value={varsInput}
                  onChange={(e) => setVarsInput(e.target.value)}
                  placeholder={ASSISTANT_TEXT.CONVERTERS.SIMULATOR_VARS_PLACEHOLDER}
                  className="flex-1 w-full min-h-30 font-mono text-xs p-3 rounded-xl border border-slate-300 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950 text-slate-800 dark:text-slate-200 resize-none focus:outline-none focus:ring-2 focus:ring-purple-500/30 shadow-inner"
                />
              </div>
              <div className="flex-1 flex flex-col">
                <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium mb-1">
                  {ASSISTANT_TEXT.CONVERTERS.SIMULATOR_DATASHEET_LABEL}
                </span>
                <textarea
                  id={ASSISTANT_SEMANTIC_ID.SIMULATOR_DATASHEET_INPUT}
                  value={dataSheetInput}
                  onChange={(e) => setDataSheetInput(e.target.value)}
                  placeholder={ASSISTANT_TEXT.CONVERTERS.SIMULATOR_DATASHEET_PLACEHOLDER}
                  className="flex-1 w-full min-h-30 font-mono text-xs p-3 rounded-xl border border-slate-300 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950 text-slate-800 dark:text-slate-200 resize-none focus:outline-none focus:ring-2 focus:ring-purple-500/30 shadow-inner"
                />
              </div>
            </div>
          </div>

          {/* Column 3: Interpolated Output */}
          <div className="flex flex-col space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                {ASSISTANT_TEXT.CONVERTERS.SIMULATOR_OUTPUT_LABEL}
              </span>
              {simulationResult && (
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 font-mono font-medium">
                  {simulationResult.replacedTokens.length} {ASSISTANT_TEXT.CONVERTERS.SIMULATOR_TOKEN_REPLACED}
                </span>
              )}
            </div>
            <pre className="flex-1 w-full min-h-75 font-mono text-xs p-3.5 rounded-xl border border-slate-300 dark:border-slate-800 bg-slate-950 text-slate-200 overflow-auto shadow-inner leading-relaxed select-text">
              <code>
                {simulationResult
                  ? JSON.stringify(simulationResult.interpolated, null, 2)
                  : ASSISTANT_TEXT.CONVERTERS.SIMULATOR_EMPTY_OUTPUT}
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
              <span>{ASSISTANT_TEXT.CONVERTERS.SIMULATOR_AST_TITLE}</span>
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              {ASSISTANT_TEXT.CONVERTERS.SIMULATOR_AST_DESC}
            </p>
          </div>

          <button
            id={ASSISTANT_SEMANTIC_ID.SIMULATOR_ASSERTION_BTN}
            type="button"
            onClick={handleTestAssertions}
            className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-md shadow-emerald-600/30 flex items-center gap-1.5 transition-all shrink-0 cursor-pointer"
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>{ASSISTANT_TEXT.CONVERTERS.SIMULATOR_AST_BTN}</span>
          </button>
        </div>

        {/* 2-Column Symmetric Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 items-stretch">
          {/* Left Column: Input Actual Response */}
          <div className="flex flex-col space-y-3">
            <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              {ASSISTANT_TEXT.CONVERTERS.SIMULATOR_INPUT_RESPONSE_LABEL}
            </span>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] font-medium text-slate-500 dark:text-slate-400 block mb-1">
                  {ASSISTANT_TEXT.CONVERTERS.SIMULATOR_STATUS_LABEL}
                </label>
                <input
                  id={ASSISTANT_SEMANTIC_ID.SIMULATOR_STATUS_INPUT}
                  type="number"
                  value={actualStatusCode}
                  onChange={(e) => setActualStatusCode(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
                />
              </div>
              <div>
                <label className="text-[11px] font-medium text-slate-500 dark:text-slate-400 block mb-1">
                  {ASSISTANT_TEXT.CONVERTERS.SIMULATOR_LATENCY_LABEL}
                </label>
                <input
                  id={ASSISTANT_SEMANTIC_ID.SIMULATOR_LATENCY_INPUT}
                  type="number"
                  value={actualResponseTime}
                  onChange={(e) => setActualResponseTime(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
                />
              </div>
            </div>

            <div className="flex-1 flex flex-col">
              <label className="text-[11px] font-medium text-slate-500 dark:text-slate-400 block mb-1">
                {ASSISTANT_TEXT.CONVERTERS.SIMULATOR_BODY_LABEL}
              </label>
              <textarea
                id={ASSISTANT_SEMANTIC_ID.SIMULATOR_BODY_INPUT}
                value={actualResponseBody}
                onChange={(e) => setActualResponseBody(e.target.value)}
                placeholder={ASSISTANT_TEXT.CONVERTERS.SIMULATOR_BODY_PLACEHOLDER}
                className="flex-1 w-full min-h-43.75 font-mono text-xs p-3 rounded-xl border border-slate-300 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950 text-slate-800 dark:text-slate-200 resize-none focus:outline-none focus:ring-2 focus:ring-emerald-500/30 shadow-inner leading-relaxed"
              />
            </div>
          </div>

          {/* Right Column: Assertion Results */}
          <div className="flex flex-col space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                {ASSISTANT_TEXT.CONVERTERS.SIMULATOR_ASSERTION_RESULT_LABEL}
              </span>
              {assertionResult && (
                <span
                  className={`text-[10px] px-2 py-0.5 rounded-full font-semibold font-mono ${
                    assertionResult.passed
                      ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400'
                      : 'bg-rose-500/15 text-rose-600 dark:text-rose-400'
                  }`}
                >
                  {assertionResult.passed ? ASSISTANT_TEXT.CONVERTERS.SIMULATOR_ALL_PASSED : ASSISTANT_TEXT.CONVERTERS.SIMULATOR_FAILED}
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
                  <p className="text-xs font-medium">{ASSISTANT_TEXT.CONVERTERS.SIMULATOR_EMPTY_ASSERTION}</p>
                  <p className="text-[11px] text-slate-500 mt-0.5">{ASSISTANT_TEXT.CONVERTERS.SIMULATOR_EMPTY_ASSERTION_SUB}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export const VariableSimulatorView = VariableSimulator;

