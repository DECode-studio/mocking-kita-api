'use client';

import React from 'react';
import { useFaq } from './hook/useFaq';
import { Faq } from '@/src/client/domain/faq/entity/faq';
import { HelpCircle } from 'lucide-react';
import { FAQ_SEMANTIC_ID, FAQ_TEXT } from './constant';
import { ScrollToTopButton } from '@/src/client/presentation/components/shared/ScrollToTopButton';
import {
  FaqHero,
  FaqSearchBar,
  FaqCategoryFilter,
  FaqAccordionItem,
} from './components';

interface FaqViewProps {
  initialFaqs: Faq[];
}

export const FaqView: React.FC<FaqViewProps> = ({ initialFaqs }) => {
  const {
    searchQuery,
    setSearchQuery,
    selectedCategory,
    setSelectedCategory,
    faqs,
    categories,
    loading,
    expandedId,
    toggleExpand,
  } = useFaq(undefined, initialFaqs);

  return (
    <div id={FAQ_SEMANTIC_ID.CONTAINER} className="space-y-8 w-full">
      {/* Hero Header Component */}
      <FaqHero />

      {/* Search and Category Filter Section */}
      <div className="flex flex-col gap-4">
        {/* Search Bar Component */}
        <FaqSearchBar
          value={searchQuery}
          onChange={setSearchQuery}
          loading={loading}
        />

        {/* Category Filter Component */}
        <FaqCategoryFilter
          categories={categories}
          selectedCategory={selectedCategory}
          onSelectCategory={setSelectedCategory}
        />
      </div>

      {/* Accordion FAQ Items */}
      {faqs.length > 0 ? (
        <div id={FAQ_SEMANTIC_ID.ACCORDION_LIST} className="space-y-4">
          {faqs.map((faq) => (
            <FaqAccordionItem
              key={faq.id}
              faq={faq}
              isExpanded={expandedId === faq.id}
              onToggle={() => toggleExpand(faq.id)}
            />
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center p-12 text-center bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-850/80 shadow-xs">
          <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 dark:text-slate-500 mb-4">
            <HelpCircle className="w-6 h-6" />
          </div>
          <h3 className="font-semibold text-slate-900 dark:text-slate-100 mb-1 text-base">
            {FAQ_TEXT.EMPTY_TITLE}
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm font-normal">
            {FAQ_TEXT.EMPTY_DESC(searchQuery)}
          </p>
        </div>
      )}

      {/* Scroll to Top */}
      <ScrollToTopButton />
    </div>
  );
};

export default FaqView;