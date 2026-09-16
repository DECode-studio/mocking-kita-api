'use client';

import React from 'react';
import {
  FileText,
  Download,
  Copy,
  Check,
  Search,
  Key,
  ShieldCheck,
  Sparkles,
  BookOpen,
  ExternalLink,
} from 'lucide-react';
import {
  EXTERNAL_API_DOCS_TEXT,
  EXTERNAL_API_DOCS_SEMANTIC_ID,
} from './constant';
import { EndpointCard } from './components/EndpointCard';
import { PlaygroundModal } from './components/PlaygroundModal';
import { useExternalApiDocs } from './hook/useExternalApiDocs';

export const ExternalApiDocsView: React.FC = () => {
  const {
    activeCategory,
    setActiveCategory,
    searchQuery,
    setSearchQuery,
    authToken,
    setAuthToken,
    copiedPostman,
    testingSpec,
    isPlaygroundOpen,
    setIsPlaygroundOpen,
    categories,
    filteredEndpoints,
    handleTestEndpoint,
    handleDownloadOpenApiJson,
    handleCopyPostmanUrl,
  } = useExternalApiDocs();

  return (
    <div id={EXTERNAL_API_DOCS_SEMANTIC_ID.CONTAINER} className="space-y-8 animate-in fade-in duration-300">
      {/* Hero Header Banner */}
      <div
        id={EXTERNAL_API_DOCS_SEMANTIC_ID.HERO_HEADER}
        className="relative overflow-hidden rounded-3xl bg-slate-900 border border-slate-800 p-6 sm:p-8 text-white shadow-2xl"
      >
        <div className="absolute -right-10 -bottom-10 w-96 h-96 bg-purple-600/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute right-40 top-0 w-64 h-64 bg-indigo-600/10 rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10 space-y-4 max-w-3xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-purple-500/10 border border-purple-500/20 text-purple-300 rounded-full text-xs font-semibold">
            <Sparkles className="w-3.5 h-3.5" />
            <span>{EXTERNAL_API_DOCS_TEXT.BADGE_TAG}</span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight font-display">
            {EXTERNAL_API_DOCS_TEXT.TITLE}
          </h1>

          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
            {EXTERNAL_API_DOCS_TEXT.SUBTITLE}
          </p>

          {/* Quick Action Download Buttons */}
          <div className="flex flex-wrap gap-3 pt-2">
            <button
              id={EXTERNAL_API_DOCS_SEMANTIC_ID.BTN_DOWNLOAD_OPENAPI}
              onClick={handleDownloadOpenApiJson}
              className="px-4 py-2 text-xs font-semibold bg-purple-600 hover:bg-purple-700 text-white rounded-xl shadow-lg shadow-purple-600/25 flex items-center gap-2 cursor-pointer transition-all hover:scale-105"
            >
              <Download className="w-4 h-4" />
              <span>{EXTERNAL_API_DOCS_TEXT.BTN_DOWNLOAD_OPENAPI}</span>
            </button>

            <button
              id={EXTERNAL_API_DOCS_SEMANTIC_ID.BTN_COPY_POSTMAN}
              onClick={handleCopyPostmanUrl}
              className="px-4 py-2 text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl flex items-center gap-2 cursor-pointer transition-all hover:scale-105"
            >
              {copiedPostman ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
              <span>{copiedPostman ? EXTERNAL_API_DOCS_TEXT.BTN_COPIED_POSTMAN_URL : EXTERNAL_API_DOCS_TEXT.BTN_COPY_POSTMAN_URL}</span>
            </button>

            <a
              id={EXTERNAL_API_DOCS_SEMANTIC_ID.BTN_VIEW_MARKDOWN}
              href="file:///Users/gadget/Development/experiment/mock-api-studio/docs/EXTERNAL_API_CONTRACT.md"
              target="_blank"
              rel="noreferrer"
              className="px-4 py-2 text-xs font-semibold bg-slate-800/80 hover:bg-slate-800 text-slate-300 border border-slate-700/80 rounded-xl flex items-center gap-2 transition-all hover:scale-105"
            >
              <FileText className="w-4 h-4 text-amber-400" />
              <span>{EXTERNAL_API_DOCS_TEXT.BTN_VIEW_MARKDOWN}</span>
              <ExternalLink className="w-3 h-3 text-slate-400" />
            </a>
          </div>
        </div>
      </div>

      {/* Global Token / Authentication Status Bar */}
      <div
        id={EXTERNAL_API_DOCS_SEMANTIC_ID.AUTH_BAR}
        className="p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4"
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-500 flex items-center justify-center shrink-0">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-xs font-bold text-slate-900 dark:text-slate-100">{EXTERNAL_API_DOCS_TEXT.AUTH_BAR_TITLE}</h3>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              {EXTERNAL_API_DOCS_TEXT.AUTH_BAR_SUBTITLE}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto">
          <div className="relative flex-1 md:w-80">
            <Key className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
            <input
              id={EXTERNAL_API_DOCS_SEMANTIC_ID.AUTH_TOKEN_INPUT}
              type="text"
              placeholder={EXTERNAL_API_DOCS_TEXT.PLACEHOLDER_AUTH_TOKEN}
              value={authToken}
              onChange={(e) => setAuthToken(e.target.value)}
              className="w-full text-xs font-mono pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-slate-100 focus:outline-none focus:border-purple-500"
            />
          </div>
          {authToken && (
            <button
              id={EXTERNAL_API_DOCS_SEMANTIC_ID.AUTH_TOKEN_CLEAR_BTN}
              onClick={() => setAuthToken('')}
              className="text-xs px-2.5 py-2 text-slate-500 hover:text-rose-500 font-semibold"
            >
              {EXTERNAL_API_DOCS_TEXT.BTN_CLEAR_TOKEN}
            </button>
          )}
        </div>
      </div>

      {/* Search & Category Filter Section */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
        {/* Category Pills */}
        <div
          id={EXTERNAL_API_DOCS_SEMANTIC_ID.CATEGORY_PILLS}
          className="flex flex-wrap gap-1.5 p-1 bg-slate-200/60 dark:bg-slate-900 border border-slate-200 dark:border-slate-800/80 rounded-2xl"
        >
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-3.5 py-1.5 text-xs font-semibold rounded-xl transition-all cursor-pointer ${
                activeCategory === cat
                  ? 'bg-purple-600 text-white shadow-md shadow-purple-600/20'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/50'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Search Input */}
        <div className="relative sm:w-72">
          <Search className="absolute left-3.5 top-2.5 w-4 h-4 text-slate-400" />
          <input
            id={EXTERNAL_API_DOCS_SEMANTIC_ID.SEARCH_INPUT}
            type="text"
            placeholder={EXTERNAL_API_DOCS_TEXT.SEARCH_PLACEHOLDER}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full text-xs pl-10 pr-3.5 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:border-purple-500"
          />
        </div>
      </div>

      {/* Endpoints List */}
      <div id={EXTERNAL_API_DOCS_SEMANTIC_ID.ENDPOINTS_LIST} className="space-y-4">
        {filteredEndpoints.length > 0 ? (
          filteredEndpoints.map((spec) => (
            <EndpointCard
              key={spec.id}
              spec={spec}
              authToken={authToken}
              onTestClick={handleTestEndpoint}
            />
          ))
        ) : (
          <div className="p-12 text-center bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-3">
            <BookOpen className="w-8 h-8 text-slate-400 mx-auto" />
            <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300">{EXTERNAL_API_DOCS_TEXT.NO_ENDPOINTS_TITLE}</h3>
            <p className="text-xs text-slate-500">{EXTERNAL_API_DOCS_TEXT.NO_ENDPOINTS_DESC}</p>
          </div>
        )}
      </div>

      {/* Interactive Testing Playground Modal */}
      <PlaygroundModal
        isOpen={isPlaygroundOpen}
        onOpenChange={setIsPlaygroundOpen}
        spec={testingSpec}
        authToken={authToken}
        apiKey="mock-studio-api-key"
        onAuthTokenChange={setAuthToken}
      />
    </div>
  );
};
