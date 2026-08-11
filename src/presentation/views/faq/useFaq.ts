'use client';

import { useState, useEffect } from 'react';
import { Faq } from '@/src/domain/faq/entity/faq';
import { FaqUseCase } from '@/src/domain/faq/usecase/faq_usecase';

export function useFaq(faqUseCase: FaqUseCase, initialFaqs: Faq[]) {
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [faqs, setFaqs] = useState<Faq[]>(initialFaqs);
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [loading, setLoading] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(searchQuery);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Fetch search results when debounced query changes
  useEffect(() => {
    const fetchFaqs = async () => {
      setLoading(true);
      try {
        const results = await faqUseCase.getFaqs(debouncedQuery);
        setFaqs(results);
      } catch (error) {
        console.error('Failed to search FAQs:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchFaqs();
  }, [debouncedQuery, faqUseCase]);

  const toggleExpand = (id: string) => {
    setExpandedId(expandedId === id ? null : id);
  };

  // Extract categories from initial list
  const categories = ['All', ...Array.from(new Set(initialFaqs.map((faq) => faq.category)))];

  // Filter local view results based on category selection
  const filteredFaqs =
    selectedCategory === 'All' ? faqs : faqs.filter((faq) => faq.category === selectedCategory);

  return {
    searchQuery,
    setSearchQuery,
    selectedCategory,
    setSelectedCategory,
    faqs: filteredFaqs,
    categories,
    loading,
    expandedId,
    toggleExpand,
  };
}
