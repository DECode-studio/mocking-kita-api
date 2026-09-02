import { describe, it, expect, vi, beforeEach } from 'vitest';
import { FaqRemoteRepository } from '@/src/data/faq/repository/faq_repository';
import * as apiClient from '@/src/core/http-client/api-client';

describe('FaqRemoteRepository', () => {
  let repository: FaqRemoteRepository;

  const mockFaq = { id: 'f1', question: 'Q?', answer: 'A!', category: 'General' };

  beforeEach(() => {
    repository = new FaqRemoteRepository();
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
