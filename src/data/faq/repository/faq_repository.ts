import { Faq } from '@/src/domain/faq/entity/faq';
import { FaqRepository } from '@/src/domain/faq/repository/faq_repository';
import { apiRequest } from '@/src/core/http-client/api-client';

export class FaqRemoteRepository implements FaqRepository {
  async getFaqs(search?: string): Promise<Faq[]> {
    const url = search ? `/api/faq?search=${encodeURIComponent(search)}` : '/api/faq';
    const res = await apiRequest<{ success: boolean; data: Faq[] }>(url);
    return res.data;
  }
}
