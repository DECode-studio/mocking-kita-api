import { describe, it, expect, vi, beforeEach } from 'vitest';
import { FaqRepositoryImpl } from '@/src/client/data/faq/repository/faq_repository_impl';
import * as apiClient from '@/src/core/http-client/api-client';

describe('FaqRepositoryImpl', () => {
  let repository: FaqRepositoryImpl;

  const mockFaq = { id: 'f1', question: 'Q?', answer: 'A!', category: 'General' };

  beforeEach(() => {
    repository = new FaqRepositoryImpl();
    vi.restoreAllMocks();
  });

  it('getFaqs should call apiRequest with search param when provided', async () => {
    vi.spyOn(apiClient, 'apiRequest').mockResolvedValue({ success: true, data: [mockFaq] });

    const res = await repository.getFaqs('mock');

    expect(apiClient.apiRequest).toHaveBeenCalledWith('/api/faq?search=mock');
    expect(res).toEqual([mockFaq]);
  });

  it('getFaqs should call apiRequest without search param when empty', async () => {
    vi.spyOn(apiClient, 'apiRequest').mockResolvedValue({ success: true, data: [mockFaq] });

    const res = await repository.getFaqs();

    expect(apiClient.apiRequest).toHaveBeenCalledWith('/api/faq');
    expect(res).toEqual([mockFaq]);
  });
});
