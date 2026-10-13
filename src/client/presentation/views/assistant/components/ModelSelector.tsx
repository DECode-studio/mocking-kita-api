'use client';

import React, { useState, useRef, useEffect, useMemo } from 'react';
import { ChevronDown, Check, Brain, Zap, Search, RefreshCw, Cpu, Layers } from 'lucide-react';
import { useAIStore } from '@/src/client/presentation/stores/aiStore';
import { inferModelMetadata, DEFAULT_AI_MODEL } from '@/src/core/constants/ai-models';

export interface ModelSelectorProps {
  placement?: 'top' | 'bottom';
  align?: 'left' | 'right';
  fullWidth?: boolean;
}

export const ModelSelector: React.FC<ModelSelectorProps> = ({
  placement = 'top',
  align = 'left',
  fullWidth = false,
}) => {
  const {
    selectedModel,
    setSelectedModel,
    availableModels,
    isModelsLoading,
    isRouterOnline,
    loadAvailableModels,
    isStreaming,
  } = useAIStore();

  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadAvailableModels();
  }, [loadAvailableModels]);

  const activeModel = useMemo(() => {
    const found = availableModels.find((m) => m.id === selectedModel);
    return found || inferModelMetadata(selectedModel || DEFAULT_AI_MODEL);
  }, [availableModels, selectedModel]);

  const filteredModels = useMemo(() => {
    if (!searchQuery.trim()) return availableModels;
    const q = searchQuery.toLowerCase();
    return availableModels.filter(
      (m) =>
        m.name.toLowerCase().includes(q) ||
        m.id.toLowerCase().includes(q) ||
        m.provider.toLowerCase().includes(q) ||
        m.badge.toLowerCase().includes(q)
    );
  }, [availableModels, searchQuery]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const placementClasses =
    placement === 'top'
      ? 'bottom-full mb-2 origin-bottom'
      : 'top-full mt-2 origin-top';

  const alignClasses =
    align === 'right' ? 'right-0' : 'left-0';

  return (
    <div className={`relative ${fullWidth ? 'w-full block' : 'inline-block'} text-left`} ref={dropdownRef}>
      <button
        type="button"
        disabled={isStreaming}
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center gap-2 px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700/80 bg-white/90 dark:bg-slate-800/90 hover:bg-slate-100 dark:hover:bg-slate-700/90 text-xs font-medium text-slate-800 dark:text-slate-100 shadow-xs transition-all disabled:opacity-50 ${
          fullWidth ? 'w-full justify-between' : ''
        }`}
      >
        <div className="flex items-center gap-2 min-w-0">
          <span
            className={`w-2 h-2 rounded-full shrink-0 ${
              isRouterOnline ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'
            }`}
            title={isRouterOnline ? 'Router AI Online' : 'Router AI Offline / Standby'}
          />
          <span className="font-semibold truncate">{activeModel.name}</span>
          <span className="text-[10px] px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-600 dark:text-purple-300 font-mono shrink-0">
            {activeModel.badge}
          </span>
        </div>
        <ChevronDown
          className={`w-3.5 h-3.5 text-slate-400 transition-transform shrink-0 ${
            isOpen ? (placement === 'top' ? '' : 'rotate-180') : placement === 'top' ? 'rotate-180' : ''
          }`}
        />
      </button>

      {isOpen && (
        <div
          className={`absolute ${alignClasses} ${placementClasses} w-88 max-w-[calc(100vw-2rem)] rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-150`}
        >
          {/* Header */}
          <div className="p-2.5 bg-slate-50 dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800/80 text-[11px] font-semibold text-slate-500 flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <span
                className={`w-2 h-2 rounded-full ${
                  isRouterOnline ? 'bg-emerald-500' : 'bg-rose-500'
                }`}
              />
              <span className="uppercase tracking-wider">
                {isRouterOnline ? 'ROUTER AI MODELS' : 'ROUTER AI (STANDBY)'}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-normal text-slate-400">
                {filteredModels.length} models
              </span>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  loadAvailableModels();
                }}
                disabled={isModelsLoading}
                title="Refresh Model dari Router AI"
                className="p-1 rounded-md hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
              >
                <RefreshCw className={`w-3 h-3 ${isModelsLoading ? 'animate-spin' : ''}`} />
              </button>
            </div>
          </div>

          {/* Search Bar for Models */}
          <div className="p-2 border-b border-slate-100 dark:border-slate-800">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari model atau provider..."
                className="w-full pl-8 pr-3 py-1.5 text-xs rounded-xl bg-slate-100 dark:bg-slate-800/60 border border-transparent focus:border-purple-500/50 focus:outline-none text-slate-800 dark:text-slate-200 placeholder:text-slate-400"
              />
            </div>
          </div>

          {/* Models List */}
          <div className="p-1.5 space-y-1 max-h-72 overflow-y-auto">
            {filteredModels.length === 0 ? (
              <div className="p-4 text-center text-xs text-slate-400">
                Tidak ada model yang cocok dengan &quot;{searchQuery}&quot;
              </div>
            ) : (
              filteredModels.map((model) => {
                const isSelected = model.id === selectedModel;
                return (
                  <button
                    key={model.id}
                    type="button"
                    onClick={() => {
                      setSelectedModel(model.id);
                      setIsOpen(false);
                    }}
                    className={`w-full text-left p-2.5 rounded-xl transition-all flex items-start gap-3 ${
                      isSelected
                        ? 'bg-purple-500/15 border border-purple-500/30 text-purple-900 dark:text-purple-100'
                        : 'hover:bg-slate-100 dark:hover:bg-slate-800/70 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    <div
                      className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${
                        model.supportsReasoning
                          ? 'bg-indigo-500/20 text-indigo-500'
                          : model.provider.includes('Combo')
                          ? 'bg-amber-500/20 text-amber-500'
                          : 'bg-purple-500/20 text-purple-500'
                      }`}
                    >
                      {model.supportsReasoning ? (
                        <Brain className="w-4 h-4" />
                      ) : model.provider.includes('Combo') ? (
                        <Layers className="w-4 h-4" />
                      ) : (
                        <Cpu className="w-4 h-4" />
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1">
                        <span className="text-xs font-bold truncate">{model.name}</span>
                        {isSelected && <Check className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400 shrink-0" />}
                      </div>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-1 mt-0.5">
                        {model.description}
                      </p>
                      <div className="mt-1 flex items-center gap-1.5 text-[10px] text-purple-600 dark:text-purple-400 font-medium">
                        <span className="px-1.5 py-0.2 rounded bg-purple-500/10 text-purple-500 font-mono">
                          {model.badge}
                        </span>
                        <span>•</span>
                        <span className="truncate text-slate-400">{model.provider}</span>
                      </div>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
};
