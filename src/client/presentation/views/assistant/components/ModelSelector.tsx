'use client';

import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check, Brain, Zap } from 'lucide-react';
import { useAIStore } from '@/src/client/presentation/stores/aiStore';
import { NIM_MODELS, DEFAULT_NIM_MODEL } from '@/src/core/constants/ai-models';

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
  const { selectedModel, setSelectedModel, isStreaming } = useAIStore();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const activeModel = NIM_MODELS[selectedModel] || NIM_MODELS[DEFAULT_NIM_MODEL];

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
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shrink-0" />
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
          className={`absolute ${alignClasses} ${placementClasses} w-80 max-w-[calc(100vw-2rem)] rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-150`}
        >
          <div className="p-2.5 bg-slate-50 dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800/80 text-[11px] font-semibold text-slate-500 uppercase tracking-wider flex items-center justify-between">
            <span>PILIH MODEL NVIDIA NIM</span>
            <span className="text-[10px] lowercase font-normal text-slate-400">5 models</span>
          </div>
          <div className="p-1.5 space-y-1 max-h-72 overflow-y-auto">
            {Object.values(NIM_MODELS).map((model) => {
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
                        : 'bg-purple-500/20 text-purple-500'
                    }`}
                  >
                    {model.supportsReasoning ? (
                      <Brain className="w-4 h-4" />
                    ) : (
                      <Zap className="w-4 h-4" />
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1">
                      <span className="text-xs font-bold truncate">{model.name}</span>
                      {isSelected && <Check className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400 shrink-0" />}
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-2 mt-0.5">
                      {model.description}
                    </p>
                    <div className="mt-1 flex items-center gap-1.5 text-[10px] text-purple-600 dark:text-purple-400 font-medium">
                      <span>{model.badge}</span>
                      <span>•</span>
                      <span className="truncate">{model.recommendedFor}</span>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
