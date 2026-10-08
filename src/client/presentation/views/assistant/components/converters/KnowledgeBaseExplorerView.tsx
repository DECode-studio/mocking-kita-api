'use client';

import React, { useState } from 'react';
import {
  BookOpen,
  Search,
  ChevronRight,
  Sparkles,
} from 'lucide-react';
import { MOCKING_KITA_KNOWLEDGE, KnowledgeSection } from '@/src/core/ai/knowledge-base';
import { useAIStore } from '@/src/client/presentation/stores/aiStore';

export const KnowledgeBaseExplorerView: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSection, setSelectedSection] = useState<KnowledgeSection>(MOCKING_KITA_KNOWLEDGE[0]);
  const { sendMessage, setActiveStudioTab } = useAIStore();

  const filteredSections = MOCKING_KITA_KNOWLEDGE.filter((sec) => {
    const q = searchQuery.toLowerCase();
    return (
      sec.title.toLowerCase().includes(q) ||
      sec.summary.toLowerCase().includes(q) ||
      sec.content.toLowerCase().includes(q)
    );
  });

  const askAboutSection = (sec: KnowledgeSection) => {
    setActiveStudioTab('chat');
    sendMessage(`Jelaskan lebih detail tentang modul "${sec.title}" dan bagaimana implementasinya di Mocking Kita Studio.`);
  };

  return (
    <div className="space-y-6">
      <div className="p-5 rounded-2xl bg-linear-to-r from-purple-900/20 via-indigo-900/20 to-slate-900/40 border border-purple-500/20 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-purple-400" />
            <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
              Mocking Kita Product Knowledge & Skills Catalog
            </h3>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Dokumentasi komprehensif 9 modul produk dan 5 technical skills bawaan Mocking Kita.
          </p>
        </div>

        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari dokumentasi & skill..."
            className="w-full pl-9 pr-3 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white/80 dark:bg-slate-900/80 text-xs focus:outline-none focus:ring-2 focus:ring-purple-500/30"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-4 space-y-2 max-h-150 overflow-y-auto pr-1">
          {filteredSections.map((sec) => {
            const isSelected = sec.id === selectedSection.id;
            return (
              <button
                key={sec.id}
                type="button"
                onClick={() => setSelectedSection(sec)}
                className={`w-full text-left p-3.5 rounded-2xl border transition-all flex items-start justify-between gap-2 ${
                  isSelected
                    ? 'bg-purple-500/15 border-purple-500/40 text-purple-900 dark:text-purple-100 shadow-xs'
                    : 'bg-white dark:bg-slate-900/60 border-slate-200 dark:border-slate-800/80 hover:border-slate-300 dark:hover:border-slate-700 text-slate-700 dark:text-slate-300'
                }`}
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5 mb-1">
                    <span
                      className={`text-[10px] px-2 py-0.2 rounded-full font-semibold uppercase ${
                        sec.category === 'product'
                          ? 'bg-purple-500/20 text-purple-600 dark:text-purple-300'
                          : 'bg-indigo-500/20 text-indigo-600 dark:text-indigo-300'
                      }`}
                    >
                      {sec.category}
                    </span>
                  </div>
                  <h4 className="text-xs font-bold truncate">{sec.title}</h4>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-2 mt-1">
                    {sec.summary}
                  </p>
                </div>
                <ChevronRight className={`w-4 h-4 shrink-0 mt-1 text-slate-400 ${isSelected ? 'text-purple-500' : ''}`} />
              </button>
            );
          })}
        </div>

        <div className="lg:col-span-8 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xl shadow-slate-950/5 space-y-4 max-h-150 overflow-y-auto">
          <div className="flex items-start justify-between pb-4 border-b border-slate-200 dark:border-slate-800 gap-4">
            <div>
              <span className="text-[11px] px-2 py-0.5 rounded-full font-semibold uppercase bg-purple-500/15 text-purple-600 dark:text-purple-300">
                {selectedSection.category} Module
              </span>
              <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 mt-1.5">
                {selectedSection.title}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                {selectedSection.summary}
              </p>
            </div>

            <button
              type="button"
              onClick={() => askAboutSection(selectedSection)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-linear-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs font-semibold shadow-md shadow-purple-500/20 transition-all shrink-0"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Tanyakan ke AI</span>
            </button>
          </div>

          <div className="prose prose-slate dark:prose-invert max-w-none text-xs leading-relaxed whitespace-pre-wrap font-sans text-slate-800 dark:text-slate-200">
            {selectedSection.content}
          </div>
        </div>
      </div>
    </div>
  );
};
