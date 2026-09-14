import { Faq } from '@/src/client/domain/faq/entity/faq';
import { apiRequest } from '@/src/core/http-client/api-client';
import { FaqDataSource } from './faq_data_source';

export class FaqRemoteDataSourceImpl implements FaqDataSource {
  async getFaqs(search?: string): Promise<Faq[]> {
    const url = search ? `/api/faq?search=${encodeURIComponent(search)}` : '/api/faq';
    const res = await apiRequest<{ success: boolean; data: Faq[] }>(url);
    return res.data || [];
  }
}
