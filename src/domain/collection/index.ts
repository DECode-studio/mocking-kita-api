import { CollectionRemoteRepository } from '@/src/data/collection/repository/collection_repository';
import { CollectionUseCase, CollectionUseCaseImpl } from './usecase/collection_usecase';

export function createCollectionUseCase(): CollectionUseCase {
  return new CollectionUseCaseImpl(new CollectionRemoteRepository());
}
