import { Faq } from '@/src/client/domain/faq/entity/faq';
import { FaqRepository } from '@/src/client/domain/faq/repository/faq_repository';
import { FaqDataSource } from '../data_source/faq_data_source';
import { FaqRemoteDataSourceImpl } from '../data_source/faq_remote_data_source_impl';

export class FaqRepositoryImpl implements FaqRepository {
  constructor(private dataSource: FaqDataSource = new FaqRemoteDataSourceImpl()) {}

  async getFaqs(search?: string): Promise<Faq[]> {
    return this.dataSource.getFaqs(search);
  }
}
