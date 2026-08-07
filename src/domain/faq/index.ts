import { FaqRemoteRepository } from '@/src/data/faq/repository/faq_repository';
import { FaqUseCaseImpl } from './usecase/faq_usecase';

export function createFaqUseCase() {
  return new FaqUseCaseImpl(new FaqRemoteRepository());
}
