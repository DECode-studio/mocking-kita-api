'use client';

import { Dispatch, FormEvent, SetStateAction } from 'react';
import { MatchType } from '@/src/core/utils/types';
import { RequestScenario } from '@/src/domain/request-scenario/entity/request_scenario';
import { getErrorMessage } from '@/src/core/utils/error';

type ToastInput = {
  type: 'success' | 'error' | 'info' | 'warning';
  title: string;
  description?: string;
};

type CreateRequestScenarioInput = Omit<RequestScenario, 'id' | 'createdAt' | 'updatedAt'>;

type RequestScenarioDeps = {
  apiId: string;
  editingReqScenarioId: string | null;
  setSelectedReqScenarioId: Dispatch<SetStateAction<string | null>>;
  setIsReqModalOpen: Dispatch<SetStateAction<boolean>>;
  setEditingReqScenario: Dispatch<SetStateAction<RequestScenario | null>>;
  addToast: (toast: ToastInput) => void;
  createRequestScenario: (input: CreateRequestScenarioInput) => Promise<RequestScenario>;
  updateRequestScenario: (id: string, input: Partial<RequestScenario>) => Promise<RequestScenario>;
};

export function useRequestScenarioActions({
  apiId,
  editingReqScenarioId,
  setSelectedReqScenarioId,
  setIsReqModalOpen,
  setEditingReqScenario,
  addToast,
  createRequestScenario,
  updateRequestScenario,
}: RequestScenarioDeps) {
  const handleSaveReqScenario = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const name = formData.get('name') as string;
    const description = formData.get('description') as string;
    const matchType = formData.get('matchType') as MatchType;
    const priority = Number(formData.get('priority')) || 100;
    const status = formData.get('status') === 'on';

    try {
      if (editingReqScenarioId) {
        await updateRequestScenario(editingReqScenarioId, {
          name,
          description,
          matchType,
          priority,
          status,
        });
        addToast({ type: 'success', title: 'Scenario Updated', description: `Updated ${name}` });
      } else {
        const created = await createRequestScenario({
          apiId,
          name,
          description,
          matchType,
          priority,
          status,
          headers: {},
          queryParams: {},
          pathParams: {},
          body: {},
        });
        setSelectedReqScenarioId(created.id);
        addToast({ type: 'success', title: 'Scenario Created', description: `Created ${name}` });
      }
      setIsReqModalOpen(false);
      setEditingReqScenario(null);
    } catch (error: unknown) {
      addToast({ type: 'error', title: 'Error', description: getErrorMessage(error) });
    }
  };

  return { handleSaveReqScenario };
}
