import { ResponseScenario } from '@/src/domain/response-scenario/entity/response_scenario';
import { ResponseScenarioRepository } from '@/src/domain/response-scenario/repository/response_scenario_repository';
import { createResponseScenarioRemote, getResponseScenario, listResponseScenariosByRequestScenario, softDeleteResponseScenarioRemote, updateResponseScenarioRemote } from '../api/response_scenario_api_client';

export class ResponseScenarioRemoteRepository implements ResponseScenarioRepository {
  async getByRequestScenarioId(requestScenarioId: string): Promise<ResponseScenario[]> {
    return listResponseScenariosByRequestScenario(requestScenarioId);
  }

  async getById(id: string): Promise<ResponseScenario | null> {
    return getResponseScenario(id);
  }

  async create(input: Omit<ResponseScenario, 'id' | 'createdAt' | 'updatedAt'>): Promise<ResponseScenario> {
    return createResponseScenarioRemote(input);
  }

  async update(id: string, input: Partial<ResponseScenario>): Promise<ResponseScenario> {
    return updateResponseScenarioRemote(id, input);
  }

  async softDelete(id: string): Promise<void> {
    await softDeleteResponseScenarioRemote(id);
  }

  async uploadFile(file: File): Promise<{ filePath: string; fileName: string }> {
    const formData = new FormData();
    formData.append('file', file);
    const response = await fetch('/api/upload', {
      method: 'POST',
      body: formData,
    });
    if (!response.ok) {
      const text = await response.text();
      throw new Error(text || 'Upload failed');
    }
    const data = await response.json();
    if (!data.success) {
      throw new Error(data.error || 'Upload failed');
    }
    return {
      filePath: data.filePath,
      fileName: data.fileName,
    };
  }
}
