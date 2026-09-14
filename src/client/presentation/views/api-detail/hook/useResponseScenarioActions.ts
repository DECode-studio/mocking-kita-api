'use client';


import { Dispatch, SetStateAction } from 'react';
import { ResponseScenario } from '@/src/client/domain/response-scenario/entity/response_scenario';
import { getErrorMessage } from '@/src/core/utils/error';

type ToastInput = {
  type: 'success' | 'error' | 'info' | 'warning';
  title: string;
  description?: string;
};

type CreateResponseScenarioInput = Omit<ResponseScenario, 'id' | 'createdAt' | 'updatedAt'>;

type ResponseScenarioFormValues = {
  name: string;
  statusCode: number;
  priority: number;
  weight: number;
  body: string;
  delayMs: number;
  status: boolean;
  responseType: 'JSON' | 'FILE';
  filePath?: string | null;
  fileName?: string | null;
};

type ResponseScenarioDeps = {
  activeReqScenarioId: string | null;
  editingRespScenarioId: string | null;
  setIsRespModalOpen: Dispatch<SetStateAction<boolean>>;
  setEditingRespScenario: Dispatch<SetStateAction<ResponseScenario | null>>;
  addToast: (toast: ToastInput) => void;
  createResponseScenario: (input: CreateResponseScenarioInput) => Promise<ResponseScenario>;
  updateResponseScenario: (id: string, input: Partial<ResponseScenario>) => Promise<ResponseScenario>;
};

export function useResponseScenarioActions({
  activeReqScenarioId,
  editingRespScenarioId,
  setIsRespModalOpen,
  setEditingRespScenario,
  addToast,
  createResponseScenario,
  updateResponseScenario,
}: ResponseScenarioDeps) {
  const handleSaveRespScenario = async (values: ResponseScenarioFormValues) => {
    if (!activeReqScenarioId) return;

    const name = values.name.trim();
    const statusCode = Number(values.statusCode) || 200;
    const delayMs = Number(values.delayMs) || 0;
    const weight = Number(values.weight) || 100;
    const priority = Number(values.priority) || 100;
    const status = !!values.status;
    const responseType = values.responseType;
    const filePath = values.filePath || null;
    const fileName = values.fileName || null;

    const bodyValue = (() => {
      const trimmed = values.body.trim();
      if (!trimmed) return {};
      try {
        return JSON.parse(trimmed);
      } catch {
        return values.body;
      }
    })();

    try {
      if (editingRespScenarioId) {
        await updateResponseScenario(editingRespScenarioId, {
          name,
          description: '',
          statusCode,
          delayMs,
          weight,
          priority,
          status,
          headers: responseType === 'FILE' ? {} : { 'content-type': 'application/json' },
          body: responseType === 'FILE' ? {} : bodyValue,
          responseType,
          filePath,
          fileName,
          requestScenarioId: activeReqScenarioId,
        });
        addToast({ type: 'success', title: 'Response Updated', description: `Updated ${name}` });
      } else {
        await createResponseScenario({
          requestScenarioId: activeReqScenarioId,
          name,
          description: '',
          statusCode,
          headers: responseType === 'FILE' ? {} : { 'content-type': 'application/json' },
          body: responseType === 'FILE' ? {} : bodyValue,
          responseType,
          filePath,
          fileName,
          delayMs,
          weight,
          priority,
          status,
        });
        addToast({ type: 'success', title: 'Response Created', description: `Created ${name}` });
      }
      setIsRespModalOpen(false);
      setEditingRespScenario(null);
    } catch (error: unknown) {
      addToast({ type: 'error', title: 'Error', description: getErrorMessage(error) });
    }
  };

  return { handleSaveRespScenario };
}