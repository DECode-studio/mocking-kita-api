import { ResponseScenario } from '@/src/domain/response-scenario/entity/response_scenario';
import { ResponseScenarioRepository } from '@/src/domain/response-scenario/repository/response_scenario_repository';
import { callDatabase } from '@/src/core/http-client/database-proxy-client';

export class ResponseScenarioRemoteRepository implements ResponseScenarioRepository {
  async getByRequestScenarioId(requestScenarioId: string): Promise<ResponseScenario[]> {
    const database = await callDatabase<{ responseScenarios: ResponseScenario[] }>('getDatabase');
    return database.responseScenarios.filter((responseScenario) => responseScenario.requestScenarioId === requestScenarioId);
  }

  async getById(id: string): Promise<ResponseScenario | null> {
    const database = await callDatabase<{ responseScenarios: ResponseScenario[] }>('getDatabase');
    return database.responseScenarios.find((responseScenario) => responseScenario.id === id) || null;
  }

  async create(input: Omit<ResponseScenario, 'id' | 'createdAt' | 'updatedAt'>): Promise<ResponseScenario> {
    return callDatabase<ResponseScenario>('createRespScenario', input);
  }

  async update(id: string, input: Partial<ResponseScenario>): Promise<ResponseScenario> {
    return callDatabase<ResponseScenario>('updateRespScenario', { id, input });
  }

  async softDelete(id: string): Promise<void> {
    await callDatabase<void>('softDeleteRespScenario', { id });
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
