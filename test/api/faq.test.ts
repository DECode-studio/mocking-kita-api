import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GET } from '@/src/app/api/faq/route';
import { faqDataSource } from '@/src/data/faq/data_source/faq_data_source_impl';
import { NextRequest } from 'next/server';

vi.mock('@/src/data/faq/data_source/faq_data_source_impl', () => ({
  faqDataSource: {
    getFaqs: vi.fn(),
  },
}));

describe('/api/faq route', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('GET should return faqs list', async () => {
    const mockFaq = [{ id: 'f1', question: 'Q?', answer: 'A!', category: 'General' }];
    (faqDataSource.getFaqs as any).mockReturnValue(mockFaq);

    const req = new NextRequest('http://localhost/api/faq?search=mock');
    const res = await GET(req);
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.success).toBe(true);
    expect(json.data).toEqual(mockFaq);
    expect(faqDataSource.getFaqs).toHaveBeenCalledWith('mock');
  });
});
