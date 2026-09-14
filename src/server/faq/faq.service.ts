import { Faq } from '@/src/client/domain/faq/entity/faq';
import faqsJson from './faq.data.json';

export function getFaqs(search?: string): Faq[] {
  const faqs = faqsJson as Faq[];
  if (!search) return faqs;

  const query = search.toLowerCase().trim();
  return faqs.filter(
    (faq) =>
      faq.question.toLowerCase().includes(query) ||
      faq.answer.toLowerCase().includes(query) ||
      faq.category.toLowerCase().includes(query)
  );
}
