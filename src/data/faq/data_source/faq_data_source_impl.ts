import { Faq } from '@/src/domain/faq/entity/faq';
import { FaqDataSource } from './faq_data_source';
import faqsJson from './faq_data.json';

export class FaqDataSourceImpl implements FaqDataSource {
  getFaqs(search?: string): Faq[] {
    const faqs: Faq[] = faqsJson as Faq[];
    if (!search) return faqs;

    const query = search.toLowerCase().trim();
    return faqs.filter(
      (faq) =>
        faq.question.toLowerCase().includes(query) ||
        faq.answer.toLowerCase().includes(query) ||
        faq.category.toLowerCase().includes(query)
    );
  }
}

export const faqDataSource = new FaqDataSourceImpl();
