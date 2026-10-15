import { AssistantKnowledgeItem, SaveKnowledgeInput } from '../entity/knowledge_item';
import { KnowledgeRepository } from '../repository/knowledge_repository';
import { KnowledgeUseCase } from './knowledge_usecase';

export class KnowledgeUseCaseImpl implements KnowledgeUseCase {
  constructor(private readonly knowledgeRepository: KnowledgeRepository) {}

  getItems(category?: 'product' | 'skill'): Promise<AssistantKnowledgeItem[]> {
    return this.knowledgeRepository.getItems(category);
  }

  getItem(type: 'product' | 'skill', id: string): Promise<AssistantKnowledgeItem | null> {
    return this.knowledgeRepository.getItem(type, id);
  }

  saveItem(item: SaveKnowledgeInput): Promise<AssistantKnowledgeItem> {
    return this.knowledgeRepository.saveItem(item);
  }

  deleteItem(type: 'product' | 'skill', id: string): Promise<boolean> {
    return this.knowledgeRepository.deleteItem(type, id);
  }

  importFile(type: 'product' | 'skill', file: File): Promise<{ success: boolean; message: string }> {
    return this.knowledgeRepository.importFile(type, file);
  }

  getExportUrl(type: 'product' | 'skill', id: string, asZip?: boolean): string {
    return this.knowledgeRepository.getExportUrl(type, id, asZip);
  }

  getAllSkillsZipExportUrl(): string {
    return this.knowledgeRepository.getAllSkillsZipExportUrl();
  }
}

