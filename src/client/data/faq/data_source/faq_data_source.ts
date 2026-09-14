import { Faq } from '@/src/client/domain/faq/entity/faq';

export interface FaqDataSource {
  getFaqs(search?: string): Promise<Faq[]>;
}
