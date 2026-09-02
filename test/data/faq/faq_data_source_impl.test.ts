import { describe, it, expect, beforeEach } from 'vitest';
import { FaqDataSourceImpl } from '@/src/data/faq/data_source/faq_data_source_impl';

describe('FaqDataSourceImpl', () => {
  let dataSource: FaqDataSourceImpl;

  beforeEach(() => {
    dataSource = new FaqDataSourceImpl();
  });

  it('getFaqs without search query should return all FAQs', () => {
    const faqs = dataSource.getFaqs();
    expect(faqs.length).toBeGreaterThan(0);
  });

  it('getFaqs with search query should filter FAQs by query', () => {
    const faqs = dataSource.getFaqs('mock');
    expect(faqs.length).toBeGreaterThan(0);
    faqs.forEach((faq) => {
      const match =
        faq.question.toLowerCase().includes('mock') ||
        faq.answer.toLowerCase().includes('mock') ||
        faq.category.toLowerCase().includes('mock');
      expect(match).toBe(true);
    });
  });
});
