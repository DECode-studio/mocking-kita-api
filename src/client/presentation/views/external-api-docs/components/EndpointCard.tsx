'use client';

import React from 'react';
import { Play, Copy, Check, ChevronDown, ChevronUp, Lock } from 'lucide-react';
import { ExternalEndpointSpec, EXTERNAL_API_DOCS_TEXT, EXTERNAL_API_DOCS_SEMANTIC_ID } from '../constant';
import { useEndpointCard } from '../hook/useEndpointCard';

interface EndpointCardProps {
  spec: ExternalEndpointSpec;
  authToken: string;
  onTestClick: (spec: ExternalEndpointSpec) => void;
}

export const EndpointCard: React.FC<EndpointCardProps> = ({ spec, authToken, onTestClick }) => {
  const {
    isExpanded,
    toggleExpanded,
    activeTab,
    setActiveTab,
    activeResponseIdx,
    setActiveResponseIdx,
    copiedCode,
    methodColorClass,
    generateCurl,
    handleCopy,
  } = useEndpointCard(spec, authToken);

  return (
    <div
      id={EXTERNAL_API_DOCS_SEMANTIC_ID.ENDPOINT_CARD(spec.id)}
      className="bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800/80 rounded-2xl shadow-sm overflow-hidden transition-all hover:border-purple-500/30"
    >
      {/* Header Bar */}
      <div
        className="p-4 sm:p-5 flex flex-wrap items-center justify-between gap-4 cursor-pointer hover:bg-slate-50/50 dark:hover:bg-slate-800/30"
        onClick={toggleExpanded}
      >
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <span className={`px-3 py-1 text-xs font-mono font-bold rounded-lg border shrink-0 ${methodColorClass}`}>
            {spec.method}
          </span>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 truncate">{spec.summary}</h3>
              {spec.requiresAuth && (
                <span className="text-[10px] px-2 py-0.5 bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 rounded-full font-medium flex items-center gap-1 shrink-0">
                  <Lock className="w-2.5 h-2.5" /> {EXTERNAL_API_DOCS_TEXT.AUTH_REQUIRED_BADGE}
                </span>
              )}
            </div>
            <p className="text-xs font-mono text-slate-500 dark:text-slate-400 mt-0.5 truncate">{spec.path}</p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            id={EXTERNAL_API_DOCS_SEMANTIC_ID.BTN_TEST_ENDPOINT(spec.id)}
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onTestClick(spec);
            }}
            className="px-3 py-1.5 text-xs font-semibold bg-purple-600 hover:bg-purple-700 text-white rounded-xl shadow-md shadow-purple-600/20 flex items-center gap-1.5 cursor-pointer transition-all hover:scale-105"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            <span>{EXTERNAL_API_DOCS_TEXT.BTN_TEST_ENDPOINT}</span>
          </button>
          <button
            type="button"
            onClick={toggleExpanded}
            className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg"
          >
            {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Expanded Details Body */}
      {isExpanded && (
        <div className="px-5 pb-5 pt-2 border-t border-slate-200 dark:border-slate-800 space-y-4 animate-in fade-in duration-200">
          <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">{spec.description}</p>

          {/* Sub Navigation Tabs */}
          <div className="flex border-b border-slate-200 dark:border-slate-800 gap-4">
            <button
              onClick={() => setActiveTab('request')}
              className={`pb-2 text-xs font-semibold border-b-2 transition-colors cursor-pointer ${
                activeTab === 'request'
                  ? 'border-purple-600 text-purple-600 dark:text-purple-400'
                  : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
              }`}
            >
              {EXTERNAL_API_DOCS_TEXT.TAB_REQUEST_CONTRACT}
            </button>
            <button
              onClick={() => setActiveTab('response')}
              className={`pb-2 text-xs font-semibold border-b-2 transition-colors cursor-pointer ${
                activeTab === 'response'
                  ? 'border-purple-600 text-purple-600 dark:text-purple-400'
                  : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
              }`}
            >
              {EXTERNAL_API_DOCS_TEXT.TAB_RESPONSE_EXAMPLES} ({spec.responseExamples.length})
            </button>
            <button
              onClick={() => setActiveTab('curl')}
              className={`pb-2 text-xs font-semibold border-b-2 transition-colors cursor-pointer ${
                activeTab === 'curl'
                  ? 'border-purple-600 text-purple-600 dark:text-purple-400'
                  : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
              }`}
            >
              {EXTERNAL_API_DOCS_TEXT.TAB_CURL_COMMAND}
            </button>
          </div>

          {/* Tab 1: Request Contract */}
          {activeTab === 'request' && (
            <div className="space-y-4">
              {spec.queryParams && spec.queryParams.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-xs font-semibold text-slate-800 dark:text-slate-200">{EXTERNAL_API_DOCS_TEXT.QUERY_PARAMS_HEADER}</h4>
                  <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-50 dark:bg-slate-950 text-slate-500 uppercase text-[10px]">
                        <tr>
                          <th className="px-3.5 py-2 font-mono">{EXTERNAL_API_DOCS_TEXT.TH_PARAM}</th>
                          <th className="px-3.5 py-2 font-mono">{EXTERNAL_API_DOCS_TEXT.TH_TYPE}</th>
                          <th className="px-3.5 py-2 font-mono">{EXTERNAL_API_DOCS_TEXT.TH_REQUIRED}</th>
                          <th className="px-3.5 py-2 font-mono">{EXTERNAL_API_DOCS_TEXT.TH_DESCRIPTION}</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
                        {spec.queryParams.map((q) => (
                          <tr key={q.name}>
                            <td className="px-3.5 py-2 font-mono font-semibold text-purple-600 dark:text-purple-400">{q.name}</td>
                            <td className="px-3.5 py-2 font-mono text-[11px]">{q.type}</td>
                            <td className="px-3.5 py-2">
                              {q.required ? (
                                <span className="text-rose-500 font-bold">{EXTERNAL_API_DOCS_TEXT.LABEL_REQUIRED_YES}</span>
                              ) : (
                                <span className="text-slate-400">{EXTERNAL_API_DOCS_TEXT.LABEL_REQUIRED_OPTIONAL}</span>
                              )}
                            </td>
                            <td className="px-3.5 py-2">{q.description}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {spec.requestBodyExample && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-semibold text-slate-800 dark:text-slate-200">{EXTERNAL_API_DOCS_TEXT.SAMPLE_REQUEST_BODY}</h4>
                    <button
                      onClick={() => handleCopy(JSON.stringify(spec.requestBodyExample, null, 2))}
                      className="text-[11px] text-slate-500 hover:text-slate-800 dark:hover:text-white flex items-center gap-1 cursor-pointer"
                    >
                      {copiedCode ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
                      <span>{copiedCode ? EXTERNAL_API_DOCS_TEXT.BTN_COPIED : EXTERNAL_API_DOCS_TEXT.BTN_COPY_JSON}</span>
                    </button>
                  </div>
                  <pre className="p-3.5 bg-slate-950 rounded-xl text-xs font-mono text-slate-200 overflow-x-auto border border-slate-800">
                    {JSON.stringify(spec.requestBodyExample, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          )}

          {/* Tab 2: Response Examples */}
          {activeTab === 'response' && (
            <div className="space-y-3">
              <div className="flex gap-2">
                {spec.responseExamples.map((ex, idx) => (
                  <button
                    key={idx}
                    onClick={() => setActiveResponseIdx(idx)}
                    className={`px-3 py-1 text-xs font-mono rounded-lg transition-colors cursor-pointer ${
                      activeResponseIdx === idx
                        ? 'bg-purple-600 text-white font-semibold'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    {ex.title}
                  </button>
                ))}
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono text-slate-500">
                    {EXTERNAL_API_DOCS_TEXT.RESPONSE_PAYLOAD_LABEL} ({spec.responseExamples[activeResponseIdx]?.status} Status)
                  </span>
                  <button
                    onClick={() =>
                      handleCopy(JSON.stringify(spec.responseExamples[activeResponseIdx]?.body, null, 2))
                    }
                    className="text-[11px] text-slate-500 hover:text-slate-800 dark:hover:text-white flex items-center gap-1 cursor-pointer"
                  >
                    {copiedCode ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
                    <span>{copiedCode ? EXTERNAL_API_DOCS_TEXT.BTN_COPIED : EXTERNAL_API_DOCS_TEXT.BTN_COPY_JSON}</span>
                  </button>
                </div>
                <pre className="p-3.5 bg-slate-950 rounded-xl text-xs font-mono text-emerald-400 overflow-x-auto border border-slate-800">
                  {JSON.stringify(spec.responseExamples[activeResponseIdx]?.body, null, 2)}
                </pre>
              </div>
            </div>
          )}

          {/* Tab 3: cURL Command */}
          {activeTab === 'curl' && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-semibold text-slate-800 dark:text-slate-200">{EXTERNAL_API_DOCS_TEXT.TERMINAL_CURL_LABEL}</h4>
                <button
                  onClick={() => handleCopy(generateCurl())}
                  className="text-[11px] text-purple-600 dark:text-purple-400 hover:underline flex items-center gap-1 cursor-pointer font-semibold"
                >
                  {copiedCode ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
                  <span>{copiedCode ? EXTERNAL_API_DOCS_TEXT.BTN_COPIED : EXTERNAL_API_DOCS_TEXT.BTN_COPY_CURL}</span>
                </button>
              </div>
              <pre className="p-3.5 bg-slate-950 rounded-xl text-xs font-mono text-amber-300 overflow-x-auto border border-slate-800 leading-relaxed">
                {generateCurl()}
              </pre>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
