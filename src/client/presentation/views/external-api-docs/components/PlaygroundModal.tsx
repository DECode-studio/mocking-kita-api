'use client';

import React from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { X, Play, Copy, Check, Clock, Shield } from 'lucide-react';
import { ExternalEndpointSpec, EXTERNAL_API_DOCS_TEXT, EXTERNAL_API_DOCS_SEMANTIC_ID } from '../constant';
import { usePlaygroundModal } from '../hook/usePlaygroundModal';

interface PlaygroundModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  spec: ExternalEndpointSpec | null;
  authToken: string;
  apiKey: string;
  onAuthTokenChange: (val: string) => void;
}

export const PlaygroundModal: React.FC<PlaygroundModalProps> = ({
  isOpen,
  onOpenChange,
  spec,
  authToken,
  apiKey,
  onAuthTokenChange,
}) => {
  const {
    requestBodyText,
    setRequestBodyText,
    queryParams,
    handleQueryChange,
    authHeaderType,
    setAuthHeaderType,
    customApiKey,
    setCustomApiKey,
    isLoading,
    responseStatus,
    responseTimeMs,
    responseData,
    copiedResponse,
    jsonError,
    handleRunTest,
    handleCopyResponse,
    methodColorClass,
  } = usePlaygroundModal(spec, authToken, apiKey, onAuthTokenChange);

  if (!spec) return null;

  return (
    <Dialog.Root open={isOpen} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs z-50 animate-in fade-in duration-200" />
        <Dialog.Content
          id={EXTERNAL_API_DOCS_SEMANTIC_ID.PLAYGROUND_DIALOG}
          className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-4xl max-h-[90vh] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-2xl z-50 flex flex-col focus:outline-none animate-in zoom-in-95 duration-200 overflow-hidden"
        >
          {/* Header */}
          <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800 shrink-0">
            <div className="flex items-center gap-3">
              <span className={`px-2.5 py-1 text-xs font-mono font-bold rounded-lg border ${methodColorClass}`}>
                {spec.method}
              </span>
              <div>
                <Dialog.Title className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                  <span>{spec.summary}</span>
                </Dialog.Title>
                <p className="text-xs font-mono text-slate-500 dark:text-slate-400 mt-0.5">{spec.path}</p>
              </div>
            </div>
            <button
              onClick={() => onOpenChange(false)}
              className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Scrollable Modal Content */}
          <div className="flex-1 overflow-y-auto py-4 space-y-6 pr-1">
            {/* Authentication Config */}
            {spec.requiresAuth && (
              <div className="p-4 bg-slate-50 dark:bg-slate-950/60 rounded-xl border border-slate-200 dark:border-slate-800/80 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                    <Shield className="w-3.5 h-3.5 text-purple-500" />
                    {EXTERNAL_API_DOCS_TEXT.PLAYGROUND_CREDENTIALS_TITLE}
                  </span>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setAuthHeaderType('bearer')}
                      className={`px-2.5 py-1 text-[11px] font-medium rounded-md transition-colors ${
                        authHeaderType === 'bearer'
                          ? 'bg-purple-600 text-white'
                          : 'bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                      }`}
                    >
                      {EXTERNAL_API_DOCS_TEXT.PLAYGROUND_TOKEN_TYPE_BEARER}
                    </button>
                    <button
                      type="button"
                      onClick={() => setAuthHeaderType('apiKey')}
                      className={`px-2.5 py-1 text-[11px] font-medium rounded-md transition-colors ${
                        authHeaderType === 'apiKey'
                          ? 'bg-purple-600 text-white'
                          : 'bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                      }`}
                    >
                      {EXTERNAL_API_DOCS_TEXT.PLAYGROUND_TOKEN_TYPE_APIKEY}
                    </button>
                  </div>
                </div>

                {authHeaderType === 'bearer' ? (
                  <div className="space-y-1">
                    <label className="text-[11px] text-slate-500 dark:text-slate-400">{EXTERNAL_API_DOCS_TEXT.LABEL_JWT_TOKEN}</label>
                    <input
                      type="text"
                      placeholder={EXTERNAL_API_DOCS_TEXT.PLACEHOLDER_JWT_TOKEN}
                      value={authToken}
                      onChange={(e) => onAuthTokenChange(e.target.value)}
                      className="w-full text-xs font-mono px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:border-purple-500"
                    />
                  </div>
                ) : (
                  <div className="space-y-1">
                    <label className="text-[11px] text-slate-500 dark:text-slate-400">{EXTERNAL_API_DOCS_TEXT.LABEL_API_KEY}</label>
                    <input
                      type="text"
                      placeholder={EXTERNAL_API_DOCS_TEXT.PLACEHOLDER_API_KEY}
                      value={customApiKey}
                      onChange={(e) => setCustomApiKey(e.target.value)}
                      className="w-full text-xs font-mono px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:border-purple-500"
                    />
                  </div>
                )}
              </div>
            )}

            {/* Query Parameters Section */}
            {spec.queryParams && spec.queryParams.length > 0 && (
              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block">{EXTERNAL_API_DOCS_TEXT.QUERY_PARAMS_HEADER}:</label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {spec.queryParams.map((q) => (
                    <div key={q.name} className="space-y-1">
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="font-mono font-semibold text-slate-800 dark:text-slate-200">
                          {q.name} {q.required && <span className="text-rose-500">*</span>}
                        </span>
                        <span className="text-slate-400 font-mono text-[10px]">{q.type}</span>
                      </div>
                      <input
                        type="text"
                        placeholder={q.description}
                        value={queryParams[q.name] || ''}
                        onChange={(e) => handleQueryChange(q.name, e.target.value)}
                        className="w-full text-xs font-mono px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-900 dark:text-slate-100 focus:outline-none focus:border-purple-500"
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Request Body Section */}
            {['POST', 'PUT', 'PATCH'].includes(spec.method) && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block">
                    {EXTERNAL_API_DOCS_TEXT.LABEL_REQUEST_BODY_JSON}
                  </label>
                  {jsonError && <span className="text-[11px] text-rose-500 font-medium">{jsonError}</span>}
                </div>
                <textarea
                  id={EXTERNAL_API_DOCS_SEMANTIC_ID.PLAYGROUND_BODY_INPUT}
                  rows={8}
                  value={requestBodyText}
                  onChange={(e) => setRequestBodyText(e.target.value)}
                  className="w-full text-xs font-mono p-3 bg-slate-950 text-slate-100 border border-slate-800 rounded-xl focus:outline-none focus:border-purple-500 leading-relaxed"
                />
              </div>
            )}

            {/* Action Bar */}
            <div className="flex justify-end pt-2">
              <button
                id={EXTERNAL_API_DOCS_SEMANTIC_ID.PLAYGROUND_SEND_BTN}
                type="button"
                onClick={handleRunTest}
                disabled={isLoading}
                className="px-5 py-2.5 text-xs font-semibold bg-purple-600 hover:bg-purple-700 text-white rounded-xl shadow-lg shadow-purple-600/25 flex items-center gap-2 cursor-pointer disabled:opacity-50 transition-all hover:scale-[1.02]"
              >
                {isLoading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>{EXTERNAL_API_DOCS_TEXT.BTN_EXECUTING}</span>
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4 fill-current" />
                    <span>{EXTERNAL_API_DOCS_TEXT.BTN_SEND_REQUEST}</span>
                  </>
                )}
              </button>
            </div>

            {/* Realtime Response Output */}
            {responseStatus !== null && (
              <div id={EXTERNAL_API_DOCS_SEMANTIC_ID.PLAYGROUND_RESPONSE_OUTPUT} className="mt-6 space-y-3 pt-4 border-t border-slate-200 dark:border-slate-800 animate-in fade-in duration-300">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span
                      className={`px-3 py-1 text-xs font-mono font-bold rounded-lg ${
                        responseStatus >= 200 && responseStatus < 300
                          ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20'
                          : 'bg-rose-500/10 text-rose-500 border border-rose-500/20'
                      }`}
                    >
                      {EXTERNAL_API_DOCS_TEXT.STATUS_LABEL} {responseStatus}
                    </span>
                    {responseTimeMs !== null && (
                      <span className="text-xs font-mono text-slate-500 dark:text-slate-400 flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" />
                        {responseTimeMs} ms
                      </span>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={handleCopyResponse}
                    className="px-3 py-1.5 text-[11px] font-medium text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer"
                  >
                    {copiedResponse ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-500" />
                        <span>{EXTERNAL_API_DOCS_TEXT.BTN_COPIED}</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>{EXTERNAL_API_DOCS_TEXT.COPY_OUTPUT_BTN}</span>
                      </>
                    )}
                  </button>
                </div>

                <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 max-h-80 overflow-y-auto">
                  <pre className="text-xs font-mono text-emerald-400 whitespace-pre-wrap leading-relaxed">
                    {JSON.stringify(responseData, null, 2)}
                  </pre>
                </div>
              </div>
            )}
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
};
