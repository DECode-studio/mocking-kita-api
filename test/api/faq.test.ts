import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GET } from '@/src/app/api/faq/route';
import { getFaqs } from '@/src/modules/faq/faq.service';
import { NextRequest } from 'next/server';

vi.mock('@/src/modules/faq/faq.service', () => ({
  getFaqs: vi.fn(),
}));

describe('/api/faq route', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('GET should return faqs list', async () => {
    const mockFaq = [{ id: 'f1', question: 'Q?', answer: 'A!', category: 'General' }];
    (getFaqs as any).mockReturnValue(mockFaq);

    const req = new NextRequest('http://localhost/api/faq?search=mock');
    const res = await GET(req);
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.success).toBe(true);
    expect(json.data).toEqual(mockFaq);
    expect(getFaqs).toHaveBeenCalledWith('mock');
  });
});
