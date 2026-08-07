import { Faq } from '@/src/domain/faq/entity/faq';

export interface FaqDataSource {
  getFaqs(search?: string): Faq[];
}
