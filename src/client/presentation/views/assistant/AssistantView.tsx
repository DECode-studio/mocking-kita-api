'use client';

import React from 'react';
import {
  Sparkles,
  Bot,
  Layers,
  Code2,
  Cpu,
  BookOpen,
  Plus,
  Trash2,
  MessageSquare,
} from 'lucide-react';
import { useAssistant } from './hook/useAssistant';
import { ASSISTANT_TEXT, ASSISTANT_SEMANTIC_ID } from './constant';
import {
  ChatMessage,
  ChatInput,
  ModelSelector,
  InsomniaConverterView,
  OpenApiGeneratorView,
  VariableSimulatorView,
  KnowledgeBaseExplorerView,
} from './components';

export const AssistantView: React.FC = () => {
  const {
    sessions,
    currentSession,
    activeSessionId,
    createNewSession,
    selectSession,
    deleteSession,
    activeStudioTab,
    setActiveStudioTab,
    messagesEndRef,
  } = useAssistant();

  return (
    <div id={ASSISTANT_SEMANTIC_ID.CONTAINER} className="space-y-4 pb-2">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-2 border-b border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-linear-to-tr from-purple-600 via-indigo-600 to-purple-500 flex items-center justify-center text-white shadow-lg shadow-purple-500/25 shrink-0">
            <Sparkles className="w-6 h-6 animate-spin-slow" />
          </div>
          <div>
            <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <span>{ASSISTANT_TEXT.TITLE}</span>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-purple-500/15 text-purple-600 dark:text-purple-300 border border-purple-500/20">
                {ASSISTANT_TEXT.BADGE}
              </span>
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {ASSISTANT_TEXT.SUBTITLE}
            </p>
          </div>
        </div>

        {/* Studio Navigation Tabs */}
        <div className="flex items-center gap-1.5 p-1 rounded-2xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 overflow-x-auto text-xs font-semibold">
          <button
            id={ASSISTANT_SEMANTIC_ID.CHAT_TAB}
            type="button"
            onClick={() => setActiveStudioTab('chat')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl transition-all shrink-0 ${
              activeStudioTab === 'chat'
                ? 'bg-white dark:bg-slate-800 text-purple-600 dark:text-purple-400 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
            }`}
          >
            <Bot className="w-4 h-4" />
            <span>{ASSISTANT_TEXT.TABS.CHAT}</span>
          </button>

          <button
            id={ASSISTANT_SEMANTIC_ID.INSOMNIA_TAB}
            type="button"
            onClick={() => setActiveStudioTab('insomnia')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl transition-all shrink-0 ${
              activeStudioTab === 'insomnia'
                ? 'bg-white dark:bg-slate-800 text-purple-600 dark:text-purple-400 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>{ASSISTANT_TEXT.TABS.INSOMNIA}</span>
          </button>

          <button
            id={ASSISTANT_SEMANTIC_ID.OPENAPI_TAB}
            type="button"
            onClick={() => setActiveStudioTab('openapi')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl transition-all shrink-0 ${
              activeStudioTab === 'openapi'
                ? 'bg-white dark:bg-slate-800 text-purple-600 dark:text-purple-400 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
            }`}
          >
            <Code2 className="w-4 h-4" />
            <span>{ASSISTANT_TEXT.TABS.OPENAPI}</span>
          </button>

          <button
            id={ASSISTANT_SEMANTIC_ID.SIMULATOR_TAB}
            type="button"
            onClick={() => setActiveStudioTab('simulator')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl transition-all shrink-0 ${
              activeStudioTab === 'simulator'
                ? 'bg-white dark:bg-slate-800 text-purple-600 dark:text-purple-400 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
            }`}
          >
            <Cpu className="w-4 h-4" />
            <span>{ASSISTANT_TEXT.TABS.SIMULATOR}</span>
          </button>

          <button
            id={ASSISTANT_SEMANTIC_ID.KNOWLEDGE_TAB}
            type="button"
            onClick={() => setActiveStudioTab('knowledge')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl transition-all shrink-0 ${
              activeStudioTab === 'knowledge'
                ? 'bg-white dark:bg-slate-800 text-purple-600 dark:text-purple-400 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
            }`}
          >
            <BookOpen className="w-4 h-4" />
            <span>{ASSISTANT_TEXT.TABS.KNOWLEDGE}</span>
          </button>
        </div>
      </div>

      {/* Studio Content Body */}
      {activeStudioTab === 'chat' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-[calc(100vh-190px)] min-h-145">
          {/* Left: Chat Sessions History Sidebar (3 cols) */}
          <div className="lg:col-span-3 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/70 p-4 flex flex-col shadow-xs">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800 shrink-0">
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                {ASSISTANT_TEXT.SESSIONS_TITLE}
              </span>
              <button
                type="button"
                onClick={createNewSession}
                className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold shadow-xs transition-all"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>{ASSISTANT_TEXT.NEW_SESSION}</span>
              </button>
            </div>

            {/* Sessions List */}
            <div className="flex-1 overflow-y-auto space-y-1 py-3 pr-1">
              {sessions.map((session) => {
                const isActive = session.id === activeSessionId;
                return (
                  <div
                    key={session.id}
                    className={`group flex items-center justify-between p-2.5 rounded-xl transition-all cursor-pointer ${
                      isActive
                        ? 'bg-purple-500/15 border border-purple-500/30 text-purple-900 dark:text-purple-100 font-semibold'
                        : 'hover:bg-slate-100 dark:hover:bg-slate-800/70 text-slate-700 dark:text-slate-300'
                    }`}
                    onClick={() => selectSession(session.id)}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <MessageSquare className="w-3.5 h-3.5 text-purple-500 shrink-0" />
                      <span className="text-xs truncate">{session.title}</span>
                    </div>

                    {sessions.length > 1 && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteSession(session.id);
                        }}
                        title="Hapus Sesi"
                        className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-rose-500/20 text-slate-400 hover:text-rose-500 transition-all shrink-0"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Model Selector Card at bottom of sessions */}
            <div className="pt-3 border-t border-slate-200 dark:border-slate-800 shrink-0 space-y-2">
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
                {ASSISTANT_TEXT.MODEL_SELECT_LABEL}
              </span>
              <ModelSelector placement="top" align="left" fullWidth />
            </div>
          </div>

          {/* Right: Active Chat Conversation & Input (9 cols) */}
          <div className="lg:col-span-9 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex flex-col shadow-xl shadow-slate-950/5 overflow-hidden">
            <div className="flex-1 p-6 overflow-y-auto space-y-4 bg-slate-50/40 dark:bg-slate-950/40">
              {currentSession?.messages.map((msg) => (
                <ChatMessage key={msg.id} message={msg} />
              ))}
              <div ref={messagesEndRef} />
            </div>

            <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shrink-0">
              <ChatInput compact={false} />
            </div>
          </div>
        </div>
      )}

      {activeStudioTab === 'insomnia' && <InsomniaConverterView />}
      {activeStudioTab === 'openapi' && <OpenApiGeneratorView />}
      {activeStudioTab === 'simulator' && <VariableSimulatorView />}
      {activeStudioTab === 'knowledge' && <KnowledgeBaseExplorerView />}
    </div>
  );
};
