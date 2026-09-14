import { Faq } from '../entity/faq';
import { FaqRepository } from '../repository/faq_repository';
import { FaqUseCase } from './faq_usecase';

export class FaqUseCaseImpl implements FaqUseCase {
  constructor(private readonly faqRepository: FaqRepository) {}

  getFaqs(search?: string): Promise<Faq[]> {
    return this.faqRepository.getFaqs(search);
  }
}
