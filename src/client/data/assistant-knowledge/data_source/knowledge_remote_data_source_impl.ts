import { AssistantKnowledgeItem, SaveKnowledgeInput } from '@/src/client/domain/assistant-knowledge/entity/knowledge_item';
import { apiRequest } from '@/src/core/http-client/api-client';
import { KnowledgeRemoteDataSource } from './knowledge_remote_data_source';

export class KnowledgeRemoteDataSourceImpl implements KnowledgeRemoteDataSource {
  async getItems(category?: 'product' | 'skill'): Promise<AssistantKnowledgeItem[]> {
    const url = category ? `/api/assistant/knowledge?category=${category}` : '/api/assistant/knowledge';
    const res = await apiRequest<{ error: boolean; data: AssistantKnowledgeItem[] }>(url);
    return res.data || [];
  }

  async getItem(type: 'product' | 'skill', id: string): Promise<AssistantKnowledgeItem | null> {
    const url = `/api/assistant/knowledge?type=${type}&id=${encodeURIComponent(id)}`;
    const res = await apiRequest<{ error: boolean; data: AssistantKnowledgeItem }>(url);
    return res.data || null;
  }

  async saveItem(item: SaveKnowledgeInput): Promise<AssistantKnowledgeItem> {
    const res = await apiRequest<{ error: boolean; data: AssistantKnowledgeItem }>('/api/assistant/knowledge', {
      method: 'POST',
      body: item,
    });
    return res.data;
  }

  async deleteItem(type: 'product' | 'skill', id: string): Promise<boolean> {
    const url = `/api/assistant/knowledge?type=${type}&id=${encodeURIComponent(id)}`;
    const res = await apiRequest<{ error: boolean; message: string }>(url, {
      method: 'DELETE',
    });
    return !res.error;
  }

  async importFile(type: 'product' | 'skill', file: File): Promise<{ success: boolean; message: string }> {
    const formData = new FormData();
    formData.append('type', type);
    formData.append('file', file);

    const response = await fetch('/api/assistant/knowledge/import', {
      method: 'POST',
      body: formData,
      credentials: 'include',
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({ message: 'Import failed' }));
      throw new Error(err.message || 'Import failed');
    }

    const res = await response.json();
    return {
      success: !res.error,
      message: res.message || 'Import successful',
    };
  }
}

