'use client';

import { Dispatch, SetStateAction } from 'react';
import { MatchType } from '@/src/core/utils/types';
import { RequestScenario } from '@/src/domain/request-scenario/entity/request_scenario';
import { getErrorMessage } from '@/src/core/utils/error';

type ToastInput = {
  type: 'success' | 'error' | 'info' | 'warning';
  title: string;
  description?: string;
};

type CreateRequestScenarioInput = Omit<RequestScenario, 'id' | 'createdAt' | 'updatedAt'>;

type RequestScenarioFormValues = {
  name: string;
  priority: number;
  queryParams: string;
  headers: string;
  body: string;
  status: boolean;
};

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

function parseJsonObject(value: string, fallback: Record<string, unknown>): Record<string, unknown> {
  const trimmed = value.trim();
  if (!trimmed) return fallback;
  try {
    const parsed = JSON.parse(trimmed);
    if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
      return parsed as Record<string, unknown>;
    }
    return fallback;
  } catch {
    return fallback;
  }
}

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
  const handleSaveReqScenario = async (values: RequestScenarioFormValues) => {
    const name = values.name.trim();
    const priority = Number(values.priority) || 100;
    const status = !!values.status;
    const queryParams = parseJsonObject(values.queryParams, {});
    const headers = parseJsonObject(values.headers, {});
    const bodyValue = (() => {
      const trimmed = values.body.trim();
      if (!trimmed) return {};
      try {
        return JSON.parse(trimmed);
      } catch {
        return values.body;
      }
    })();
    const matchType: MatchType = 'EXACT';

    try {
      if (editingReqScenarioId) {
        await updateRequestScenario(editingReqScenarioId, {
          name,
          description: '',
          matchType,
          priority,
          status,
          headers,
          queryParams,
          pathParams: {},
          body: bodyValue,
        });
        addToast({ type: 'success', title: 'Scenario Updated', description: `Updated ${name}` });
      } else {
        const created = await createRequestScenario({
          apiId,
          name,
          description: '',
          matchType,
          priority,
          status,
          headers,
          queryParams,
          pathParams: {},
          body: bodyValue,
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
