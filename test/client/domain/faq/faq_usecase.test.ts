import { describe, it, expect, vi, beforeEach } from 'vitest';
import { FaqUseCaseImpl } from '@/src/client/domain/faq/usecase/faq_usecase_impl';
import { FaqRepository } from '@/src/client/domain/faq/repository/faq_repository';
import { Faq } from '@/src/client/domain/faq/entity/faq';

describe('FaqUseCaseImpl', () => {
  let repository: Partial<FaqRepository>;
  let useCase: FaqUseCaseImpl;

  const mockFaq: Faq = {
    id: 'f1',
    question: 'How to mock APIs?',
    answer: 'Create a project and add endpoints.',
    category: 'General',
  };

  beforeEach(() => {
    repository = {
      getFaqs: vi.fn(),
    };
    useCase = new FaqUseCaseImpl(repository as FaqRepository);
  });

  it('should delegate getFaqs to repository', async () => {
    (repository.getFaqs as any).mockResolvedValue([mockFaq]);

    const result = await useCase.getFaqs('mock');

    expect(repository.getFaqs).toHaveBeenCalledWith('mock');
    expect(result).toEqual([mockFaq]);
  });
});
