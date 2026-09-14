import { Faq } from '../entity/faq';

export interface FaqRepository {
  getFaqs(search?: string): Promise<Faq[]>;
}
