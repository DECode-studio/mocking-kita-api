import { Faq } from '../entity/faq';
import { FaqRepository } from '../repository/faq_repository';

export interface FaqUseCase {
  getFaqs(search?: string): Promise<Faq[]>;
}

export class FaqUseCaseImpl implements FaqUseCase {
  constructor(private readonly faqRepository: FaqRepository) {}

  getFaqs(search?: string): Promise<Faq[]> {
    return this.faqRepository.getFaqs(search);
  }
}
