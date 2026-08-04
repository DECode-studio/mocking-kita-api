'use client';

import { Dispatch, FormEvent, SetStateAction } from 'react';
import { ResponseScenario } from '@/src/domain/response-scenario/entity/response_scenario';
import { getErrorMessage } from '@/src/core/utils/error';

type ToastInput = {
  type: 'success' | 'error' | 'info' | 'warning';
  title: string;
  description?: string;
};

type CreateResponseScenarioInput = Omit<ResponseScenario, 'id' | 'createdAt' | 'updatedAt'>;

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
  const handleSaveRespScenario = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!activeReqScenarioId) return;

    const formData = new FormData(e.currentTarget);
    const name = formData.get('name') as string;
    const description = formData.get('description') as string;
    const statusCode = Number(formData.get('statusCode')) || 200;
    const delayMs = Number(formData.get('delayMs')) || 0;
    const weight = Number(formData.get('weight')) || 100;
    const priority = Number(formData.get('priority')) || 100;
    const status = formData.get('status') === 'on';

    try {
      if (editingRespScenarioId) {
        await updateResponseScenario(editingRespScenarioId, {
          name,
          description,
          statusCode,
          delayMs,
          weight,
          priority,
          status,
        });
        addToast({ type: 'success', title: 'Response Updated', description: `Updated ${name}` });
      } else {
        await createResponseScenario({
          requestScenarioId: activeReqScenarioId,
          name,
          description,
          statusCode,
          headers: { 'content-type': 'application/json' },
          body: { success: true, message: 'Mock response payload' },
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
