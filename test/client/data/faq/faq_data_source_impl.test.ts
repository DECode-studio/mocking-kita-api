import { describe, it, expect, beforeEach, vi } from 'vitest';
import { FaqRemoteDataSourceImpl } from '@/src/client/data/faq/data_source/faq_remote_data_source_impl';
import * as apiClient from '@/src/core/http-client/api-client';

describe('FaqRemoteDataSourceImpl', () => {
  let dataSource: FaqRemoteDataSourceImpl;
  const mockFaq = { id: 'f1', question: 'Q?', answer: 'A!', category: 'General' };

  beforeEach(() => {
    dataSource = new FaqRemoteDataSourceImpl();
    vi.restoreAllMocks();
  });

  it('getFaqs without search query should fetch /api/faq', async () => {
    vi.spyOn(apiClient, 'apiRequest').mockResolvedValue({ success: true, data: [mockFaq] });

    const faqs = await dataSource.getFaqs();
    expect(apiClient.apiRequest).toHaveBeenCalledWith('/api/faq');
    expect(faqs).toEqual([mockFaq]);
  });

  it('getFaqs with search query should fetch /api/faq?search=...', async () => {
    vi.spyOn(apiClient, 'apiRequest').mockResolvedValue({ success: true, data: [mockFaq] });

    const faqs = await dataSource.getFaqs('mock');
    expect(apiClient.apiRequest).toHaveBeenCalledWith('/api/faq?search=mock');
    expect(faqs).toEqual([mockFaq]);
  });
});
