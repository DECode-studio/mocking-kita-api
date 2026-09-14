import React from 'react';
import { HelpCircle, ChevronDown } from 'lucide-react';
import { cn } from '@/src/core/utils/cn';
import { Faq } from '@/src/client/domain/faq/entity/faq';

interface FaqAccordionItemProps {
  faq: Faq;
  isExpanded: boolean;
  onToggle: () => void;
}

export const FaqAccordionItem: React.FC<FaqAccordionItemProps> = ({ faq, isExpanded, onToggle }) => {
  return (
    <div
      className={cn(
        'group rounded-2xl border transition-all duration-200 bg-white dark:bg-slate-900 overflow-hidden',
        isExpanded
          ? 'border-purple-500/40 shadow-md shadow-purple-500/5 dark:shadow-none'
          : 'border-slate-200 dark:border-slate-850/80 hover:border-slate-300 dark:hover:border-slate-700/60'
      )}
    >
      <button
        type="button"
        onClick={onToggle}
        className="w-full text-left px-5 py-4 flex items-center justify-between gap-4 select-none focus:outline-none"
      >
        <div className="flex items-start gap-3">
          <HelpCircle
            className={cn(
              'w-5 h-5 mt-0.5 shrink-0 transition-colors',
              isExpanded ? 'text-purple-500' : 'text-slate-400 dark:text-slate-500'
            )}
          />
          <div>
            <span className="inline-block text-[9px] font-bold px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-450 uppercase tracking-wider mb-1">
              {faq.category}
            </span>
            <h3 className="font-bold text-slate-900 dark:text-slate-100 text-sm sm:text-base leading-snug">
              {faq.question}
            </h3>
          </div>
        </div>
        <div
          className={cn(
            'p-1.5 rounded-lg bg-slate-50 dark:bg-slate-800/50 text-slate-400 dark:text-slate-500 group-hover:text-slate-600 dark:group-hover:text-slate-300 transition-all shrink-0',
            isExpanded && 'rotate-180 bg-purple-500/10 text-purple-600 dark:text-purple-400'
          )}
        >
          <ChevronDown className="w-4 h-4" />
        </div>
      </button>

      <div
        className={cn(
          'transition-all duration-300 ease-in-out overflow-hidden',
          isExpanded
            ? 'max-h-125 border-t border-slate-100 dark:border-slate-800/50'
            : 'max-h-0'
        )}
      >
        <div className="px-5 py-4 text-sm text-slate-600 dark:text-slate-400 leading-relaxed bg-slate-50/50 dark:bg-slate-900/30 font-normal">
          {faq.answer}
        </div>
      </div>
    </div>
  );
};

export default FaqAccordionItem;
