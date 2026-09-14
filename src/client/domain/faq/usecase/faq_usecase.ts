import { Faq } from '../entity/faq';

export interface FaqUseCase {
  getFaqs(search?: string): Promise<Faq[]>;
}

