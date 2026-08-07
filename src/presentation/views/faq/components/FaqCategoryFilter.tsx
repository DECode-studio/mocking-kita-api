import React from 'react';
import { cn } from '@/src/core/utils/cn';
import { FAQ_TEXT } from '../constant/faqText';
import { FAQ_SEMANTIC_ID } from '../constant/faqSemanticId';

interface FaqCategoryFilterProps {
  categories: string[];
  selectedCategory: string;
  onSelectCategory: (category: string) => void;
}

export const FaqCategoryFilter: React.FC<FaqCategoryFilterProps> = ({
  categories,
  selectedCategory,
  onSelectCategory,
}) => {
  return (
    <div id={FAQ_SEMANTIC_ID.CATEGORY_LIST} className="flex items-center gap-2 overflow-x-auto pb-1.5 scrollbar-thin">
      {categories.map((category) => (
        <button
          key={category}
          type="button"
          onClick={() => onSelectCategory(category)}
          className={cn(
            'px-4 py-2 rounded-full text-xs font-semibold whitespace-nowrap transition-all border',
            selectedCategory === category
              ? 'bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 border-slate-900 dark:border-slate-100 shadow-sm'
              : 'bg-white dark:bg-slate-900 text-slate-650 dark:text-slate-450 border-slate-200 dark:border-slate-850 hover:bg-slate-50 dark:hover:bg-slate-800/50'
          )}
        >
          {category === 'All' ? FAQ_TEXT.ALL_CATEGORIES : category}
        </button>
      ))}
    </div>
  );
};

export default FaqCategoryFilter;
