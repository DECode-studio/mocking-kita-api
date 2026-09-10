'use client';

import { Dispatch, SetStateAction } from 'react';
import { BodyPathRule, MatchStrategy, MatchType, RequestBodyType } from '@/src/core/utils/types';
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
  matchStrategy?: MatchStrategy;
  queryParams: string;
  headers: string;
  body: string;
  bodyType: RequestBodyType;
  bodyRules?: BodyPathRule[];
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
  requestScenarios: RequestScenario[];
};

function toComparable(value: unknown): unknown {
  if (value === null || value === undefined) return null;
  if (Array.isArray(value)) {
    return value.map(toComparable);
  }
  if (typeof value === 'object') {
    return Object.keys(value as Record<string, unknown>)
      .sort()
      .reduce<Record<string, unknown>>((acc, key) => {
        acc[key] = toComparable((value as Record<string, unknown>)[key]);
        return acc;
      }, {});
  }
  return value;
}

function deepEqual(a: unknown, b: unknown): boolean {
  return JSON.stringify(toComparable(a)) === JSON.stringify(toComparable(b));
}

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
  requestScenarios,
}: RequestScenarioDeps) {
  const handleSaveReqScenario = async (values: RequestScenarioFormValues) => {
    const name = values.name.trim();
    const priority = Number(values.priority) || 100;
    const status = !!values.status;
    const matchStrategy: MatchStrategy = values.matchStrategy || 'ALL';
    const queryParams = parseJsonObject(values.queryParams, {});
    const headers = parseJsonObject(values.headers, {});
    const bodyRules = (values.bodyRules || []).filter((r) => r && r.path && r.path.trim().length > 0);
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

    if (status) {
      const duplicate = requestScenarios.find((scenario) => {
        if (scenario.id === editingReqScenarioId || !scenario.status || scenario.deletedAt) {
          return false;
        }
        return (
          scenario.matchType === matchType &&
          (scenario.matchStrategy || 'ALL') === matchStrategy &&
          scenario.bodyType === values.bodyType &&
          deepEqual(headers, scenario.headers) &&
          deepEqual(queryParams, scenario.queryParams) &&
          deepEqual(scenario.pathParams || {}, {}) &&
          deepEqual(bodyValue, scenario.body) &&
          deepEqual(bodyRules, scenario.bodyRules || [])
        );
      });

      if (duplicate) {
        addToast({
          type: 'error',
          title: 'Duplicate Scenario Matchmaking',
          description: `An active request scenario ("${duplicate.name}") already exists with the exact same matchmaking criteria.`,
        });
        return;
      }
    }

    try {
      if (editingReqScenarioId) {
        await updateRequestScenario(editingReqScenarioId, {
          name,
          description: '',
          matchType,
          matchStrategy,
          priority,
          status,
          headers,
          queryParams,
          pathParams: {},
          body: bodyValue,
          bodyType: values.bodyType,
          bodyRules,
        });
        addToast({ type: 'success', title: 'Scenario Updated', description: `Updated ${name}` });
      } else {
        const created = await createRequestScenario({
          apiId,
          name,
          description: '',
          matchType,
          matchStrategy,
          priority,
          status,
          headers,
          queryParams,
          pathParams: {},
          body: bodyValue,
          bodyType: values.bodyType,
          bodyRules,
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
