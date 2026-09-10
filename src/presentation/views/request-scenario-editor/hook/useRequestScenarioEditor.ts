'use client';

import { useState, useEffect, useCallback, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { ApiDetailSnapshot, ApiDetailUseCase } from '@/src/domain/api/usecase/api_detail_usecase';
import { RequestScenario } from '@/src/domain/request-scenario/entity/request_scenario';
import { BodyPathRule, MatchStrategy, MatchType, RequestBodyType } from '@/src/core/utils/types';
import { useUIStore } from '@/src/presentation/stores/uiStore';
import { getErrorMessage } from '@/src/core/utils/error';

interface UseRequestScenarioEditorProps {
  projectId: string;
  apiId: string;
  scenarioId?: string | null;
  initialDetail?: ApiDetailSnapshot;
  useCase: ApiDetailUseCase;
}

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

export function useRequestScenarioEditor({
  projectId,
  apiId,
  scenarioId,
  initialDetail,
  useCase,
}: UseRequestScenarioEditorProps) {
  const router = useRouter();
  const { addToast } = useUIStore();

  const [detail, setDetail] = useState<ApiDetailSnapshot | null>(initialDetail || null);
  const [isLoading, setIsLoading] = useState(!initialDetail);
  const [isSaving, setIsSaving] = useState(false);

  // Form states
  const [name, setName] = useState('');
  const [priority, setPriority] = useState(1);
  const [status, setStatus] = useState(true);
  const [matchStrategy, setMatchStrategy] = useState<MatchStrategy>('ALL');
  const [queryParams, setQueryParams] = useState('{}');
  const [headers, setHeaders] = useState('{}');
  const [body, setBody] = useState('{}');
  const [bodyType, setBodyType] = useState<RequestBodyType>('JSON');
  const [bodyRules, setBodyRules] = useState<BodyPathRule[]>([]);
  const [strictBodyStructure, setStrictBodyStructure] = useState<boolean>(true);

  const isEditMode = Boolean(scenarioId);

  const loadData = useCallback(async () => {
    try {
      setIsLoading(true);
      const data = await useCase.load(projectId, apiId, scenarioId);
      setDetail(data);
    } catch (error) {
      addToast({
        type: 'error',
        title: 'Failed to load details',
        description: getErrorMessage(error),
      });
    } finally {
      setIsLoading(false);
    }
  }, [apiId, projectId, scenarioId, useCase, addToast]);

  useEffect(() => {
    if (!initialDetail) {
      loadData();
    }
  }, [initialDetail, loadData]);

  // Populate form values when target scenario is loaded
  useEffect(() => {
    if (!detail) return;

    if (scenarioId) {
      const target = detail.requestScenarios.find((s) => s.id === scenarioId);
      if (target) {
        setName(target.name);
        setPriority(target.priority || 1);
        setStatus(target.status);
        setMatchStrategy(target.matchStrategy || 'ALL');
        setQueryParams(JSON.stringify(target.queryParams || {}, null, 2));
        setHeaders(JSON.stringify(target.headers || {}, null, 2));
        setBody(
          typeof target.body === 'string'
            ? target.body
            : JSON.stringify(target.body || {}, null, 2)
        );
        setBodyType(target.bodyType || 'JSON');
        setBodyRules(target.bodyRules || []);
        setStrictBodyStructure(target.strictBodyStructure !== undefined ? target.strictBodyStructure : true);
      }
    } else {
      // Create mode defaults
      const maxPriority = detail.requestScenarios.reduce((max, s) => Math.max(max, s.priority || 0), 0);
      setPriority(maxPriority + 1);
      setName('');
      setStatus(true);
      setMatchStrategy('ALL');
      setQueryParams('{}');
      setHeaders('{}');
      setBody('{}');
      setBodyType('JSON');
      setBodyRules([]);
      setStrictBodyStructure(true);
    }
  }, [detail, scenarioId]);

  const targetScenario: RequestScenario | null =
    (scenarioId && detail?.requestScenarios.find((s) => s.id === scenarioId)) || null;

  const handleCancel = () => {
    router.push(`/projects/${projectId}/apis/${apiId}`);
  };

  const handleSubmit = async (e?: FormEvent) => {
    if (e) e.preventDefault();

    const trimmedName = name.trim();
    if (!trimmedName) {
      addToast({
        type: 'error',
        title: 'Validation Error',
        description: 'Scenario Name is required.',
      });
      return;
    }

    const priorityNum = Number(priority) || 1;
    const qParams = parseJsonObject(queryParams, {});
    const hdrs = parseJsonObject(headers, {});
    const sanitizedBodyRules = (bodyRules || []).filter(
      (r) => r && r.path && r.path.trim().length > 0
    );

    const bodyValue = (() => {
      const trimmed = body.trim();
      if (!trimmed) return {};
      try {
        return JSON.parse(trimmed);
      } catch {
        return body;
      }
    })();

    const matchType: MatchType = 'EXACT';

    // Duplicate check for active scenario
    if (status && detail?.requestScenarios) {
      const duplicate = detail.requestScenarios.find((scenario) => {
        if (scenario.id === scenarioId || !scenario.status || scenario.deletedAt) {
          return false;
        }
        return (
          scenario.matchType === matchType &&
          (scenario.matchStrategy || 'ALL') === matchStrategy &&
          scenario.bodyType === bodyType &&
          deepEqual(hdrs, scenario.headers) &&
          deepEqual(qParams, scenario.queryParams) &&
          deepEqual(scenario.pathParams || {}, {}) &&
          deepEqual(bodyValue, scenario.body) &&
          deepEqual(sanitizedBodyRules, scenario.bodyRules || []) &&
          (scenario.strictBodyStructure !== undefined ? scenario.strictBodyStructure : true) === strictBodyStructure
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
      setIsSaving(true);
      if (scenarioId) {
        await useCase.updateRequestScenario(scenarioId, {
          name: trimmedName,
          description: '',
          matchType,
          matchStrategy,
          priority: priorityNum,
          status,
          headers: hdrs,
          queryParams: qParams,
          pathParams: {},
          body: bodyValue,
          bodyType,
          bodyRules: sanitizedBodyRules,
          strictBodyStructure,
        });
        addToast({
          type: 'success',
          title: 'Scenario Updated',
          description: `Successfully updated "${trimmedName}".`,
        });
      } else {
        await useCase.createRequestScenario({
          apiId,
          name: trimmedName,
          description: '',
          matchType,
          matchStrategy,
          priority: priorityNum,
          status,
          headers: hdrs,
          queryParams: qParams,
          pathParams: {},
          body: bodyValue,
          bodyType,
          bodyRules: sanitizedBodyRules,
          strictBodyStructure,
        });
        addToast({
          type: 'success',
          title: 'Scenario Created',
          description: `Successfully created "${trimmedName}".`,
        });
      }

      router.push(`/projects/${projectId}/apis/${apiId}`);
    } catch (error) {
      addToast({
        type: 'error',
        title: 'Failed to save scenario',
        description: getErrorMessage(error),
      });
    } finally {
      setIsSaving(false);
    }
  };

  return {
    project: detail?.project || null,
    api: detail?.api || null,
    targetScenario,
    isEditMode,
    isLoading,
    isSaving,
    // Form fields & setters
    name,
    setName,
    priority,
    setPriority,
    status,
    setStatus,
    matchStrategy,
    setMatchStrategy,
    queryParams,
    setQueryParams,
    headers,
    setHeaders,
    body,
    setBody,
    bodyType,
    setBodyType,
    bodyRules,
    setBodyRules,
    strictBodyStructure,
    setStrictBodyStructure,
    // Handlers
    handleSubmit,
    handleCancel,
  };
}

