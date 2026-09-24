'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  ScenarioFlowStep,
  VariableExtractor,
  AssertionRule,
} from '@/src/client/domain/scenario-flow/entity/scenario_flow';
import { RequestBodyType } from '@/src/core/utils/types';
import { ApiCollection } from '@/src/client/domain/api/entity/api_collection';
import { Project } from '@/src/client/domain/project/entity/project';
import { Environment, getEnvironmentBaseUrl } from '@/src/client/domain/environment/entity/environment';
import { ROUTES } from '@/src/core/constants/routes';
import { SCENARIO_FLOW_DETAIL_TEXT } from '../constant';

export interface FormFieldItem {
  id: string;
  key: string;
  value: string;
  isFile?: boolean;
  enabled: boolean;
}

export function jsonToFormFields(jsonStr: string): FormFieldItem[] {
  try {
    const trimmed = jsonStr.trim();
    if (!trimmed || trimmed === '{}') return [];
    const parsed = JSON.parse(trimmed);
    if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) return [];
    return Object.entries(parsed).map(([key, val], idx) => {
      const isFile =
        typeof val === 'object' &&
        val !== null &&
        ('filename' in (val as Record<string, unknown>) || 'type' in (val as Record<string, unknown>));
      const displayVal = isFile
        ? String((val as Record<string, unknown>).filename || '')
        : typeof val === 'object'
        ? JSON.stringify(val)
        : String(val ?? '');
      return {
        id: `ff-${idx}-${Math.random().toString(36).substring(2, 7)}`,
        key,
        value: displayVal,
        isFile,
        enabled: true,
      };
    });
  } catch {
    return [];
  }
}

export function formFieldsToJson(fields: FormFieldItem[]): string {
  const obj: Record<string, unknown> = {};
  for (const field of fields) {
    if (field.enabled !== false && field.key.trim() !== '') {
      if (field.isFile) {
        obj[field.key.trim()] = {
          filename: field.value.trim() || 'file.bin',
          type: 'application/octet-stream',
        };
      } else {
        const val = field.value;
        if (val === 'true') obj[field.key.trim()] = true;
        else if (val === 'false') obj[field.key.trim()] = false;
        else if (val !== '' && !isNaN(Number(val)) && !val.startsWith('0') && val !== '0') {
          obj[field.key.trim()] = Number(val);
        } else if (val === '0') {
          obj[field.key.trim()] = 0;
        } else if (val.startsWith('{') || val.startsWith('[')) {
          try {
            obj[field.key.trim()] = JSON.parse(val);
          } catch {
            obj[field.key.trim()] = val;
          }
        } else {
          obj[field.key.trim()] = val;
        }
      }
    }
  }
  return JSON.stringify(obj, null, 2);
}

export interface UseAddStepModalProps {
  isOpen: boolean;
  onClose: () => void;
  editingStep?: ScenarioFlowStep | null;
  projectApis: ApiCollection[];
  projects?: Project[];
  environments?: Environment[];
  stepCount: number;
  projectId?: string;
  onSave: (stepData: Partial<ScenarioFlowStep> & { name: string; stepOrder: number }) => Promise<void>;
  onLoadScenarios?: (apiId: string) => Promise<any[]>;
}

export const useAddStepModal = ({
  isOpen,
  onClose,
  editingStep,
  projectApis,
  projects = [],
  environments = [],
  stepCount,
  projectId,
  onSave,
  onLoadScenarios,
}: UseAddStepModalProps) => {
  const [activeTab, setActiveTab] = useState('basic');
  const [filterProjectId, setFilterProjectId] = useState<string>('ALL');
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [delayMs, setDelayMs] = useState(0);
  const [continueOnError, setContinueOnError] = useState(false);

  // Selected API & Scenario
  const [selectedApiId, setSelectedApiId] = useState('');
  const [selectedScenarioId, setSelectedScenarioId] = useState('');
  const [methodOverride, setMethodOverride] = useState('');
  const [pathOverride, setPathOverride] = useState('');
  const [targetEnvironmentType, setTargetEnvironmentType] = useState<'DEFAULT' | 'LOCAL'>('DEFAULT');
  const [targetEnvironment, setTargetEnvironment] = useState('');

  // Overrides
  const [headersJson, setHeadersJson] = useState('{}');
  const [queryParamsJson, setQueryParamsJson] = useState('{}');
  const [bodyJson, setBodyJson] = useState('{}');
  const [bodyType, setBodyType] = useState<RequestBodyType>('JSON');
  const [bodyInputMode, setBodyInputMode] = useState<'fields' | 'raw'>('raw');
  const [formFields, setFormFields] = useState<FormFieldItem[]>([]);
  const [focusedFieldId, setFocusedFieldId] = useState<string | null>(null);

  // Extractors & Assertions
  const [extractors, setExtractors] = useState<VariableExtractor[]>([]);
  const [assertions, setAssertions] = useState<AssertionRule[]>([]);

  // Scenarios loaded for the selected API
  const [availableScenarios, setAvailableScenarios] = useState<any[]>([]);
  const [isLoadingScenarios, setIsLoadingScenarios] = useState(false);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastFocusedField, setLastFocusedField] = useState<'path' | 'headers' | 'queryParams' | 'body'>('body');

  const handleAddFormField = useCallback(() => {
    const newField: FormFieldItem = {
      id: `ff-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      key: '',
      value: '',
      isFile: false,
      enabled: true,
    };
    setFormFields((prev) => {
      const updated = [...prev, newField];
      setBodyJson(formFieldsToJson(updated));
      return updated;
    });
    setFocusedFieldId(newField.id);
  }, []);

  const handleRemoveFormField = useCallback((id: string) => {
    setFormFields((prev) => {
      const updated = prev.filter((f) => f.id !== id);
      setBodyJson(formFieldsToJson(updated));
      return updated;
    });
    setFocusedFieldId((current) => (current === id ? null : current));
  }, []);

  const handleUpdateFormField = useCallback((id: string, patch: Partial<FormFieldItem>) => {
    setFormFields((prev) => {
      const updated = prev.map((f) => (f.id === id ? { ...f, ...patch } : f));
      setBodyJson(formFieldsToJson(updated));
      return updated;
    });
  }, []);

  const handleInsertTokenToField = useCallback((fieldId: string, token: string) => {
    setFormFields((prev) => {
      const updated = prev.map((f) =>
        f.id === fieldId ? { ...f, value: f.value ? `${f.value}${token}` : token } : f
      );
      setBodyJson(formFieldsToJson(updated));
      return updated;
    });
  }, []);

  const handleInsertToken = useCallback((token: string) => {
    const cleanKey = (fallback: string) =>
      token
        .replace(/^\{\{\s*(?:datasheet\.|env\.)?/, '')
        .replace(/\}\}.*$/, '')
        .replace(/[^a-zA-Z0-9_]/g, '_')
        .replace(/_+/g, '_')
        .replace(/^_|_$/g, '') || fallback;

    if (lastFocusedField === 'path') {
      setPathOverride((prev) => (prev ? `${prev}${token}` : token));
    } else if (lastFocusedField === 'headers') {
      try {
        const parsed = JSON.parse(headersJson.trim() || '{}');
        parsed[cleanKey('header')] = token;
        setHeadersJson(JSON.stringify(parsed, null, 2));
      } catch {
        setHeadersJson((prev) => (prev ? `${prev}\n"${token}"` : token));
      }
    } else if (lastFocusedField === 'queryParams') {
      try {
        const parsed = JSON.parse(queryParamsJson.trim() || '{}');
        parsed[cleanKey('param')] = token;
        setQueryParamsJson(JSON.stringify(parsed, null, 2));
      } catch {
        setQueryParamsJson((prev) => (prev ? `${prev}\n"${token}"` : token));
      }
    } else {
      if (bodyInputMode === 'fields') {
        const targetId = focusedFieldId || (formFields.length > 0 ? formFields[formFields.length - 1].id : null);
        if (targetId) {
          handleInsertTokenToField(targetId, token);
        } else {
          const newField: FormFieldItem = {
            id: `ff-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
            key: cleanKey('field'),
            value: token,
            isFile: false,
            enabled: true,
          };
          const updated = [...formFields, newField];
          setFormFields(updated);
          setFocusedFieldId(newField.id);
          setBodyJson(formFieldsToJson(updated));
        }
      } else {
        try {
          const parsed = JSON.parse(bodyJson.trim() || '{}');
          parsed[cleanKey('field')] = token;
          const newJson = JSON.stringify(parsed, null, 2);
          setBodyJson(newJson);
          setFormFields(jsonToFormFields(newJson));
        } catch {
          const newJson = bodyJson ? `${bodyJson}\n"${token}"` : token;
          setBodyJson(newJson);
        }
      }
    }
  }, [lastFocusedField, headersJson, queryParamsJson, bodyInputMode, focusedFieldId, formFields, bodyJson, handleInsertTokenToField]);

  // Helper to load scenarios for an API
  const loadScenariosForApi = useCallback(async (apiId: string) => {
    if (!apiId) {
      setAvailableScenarios([]);
      return [];
    }
    setIsLoadingScenarios(true);
    try {
      if (onLoadScenarios) {
        const list = await onLoadScenarios(apiId);
        setAvailableScenarios(list || []);
        return list || [];
      }
    } catch {
      // ignore
    } finally {
      setIsLoadingScenarios(false);
    }
    return [];
  }, [onLoadScenarios]);

  useEffect(() => {
    if (editingStep) {
      setName(editingStep.name);
      setDescription(editingStep.description || '');
      setDelayMs(editingStep.delayMs || 0);
      setContinueOnError(editingStep.continueOnError || false);
      setSelectedApiId(editingStep.apiId || '');
      setSelectedScenarioId(editingStep.requestScenarioId || '');

      const matchedApi = projectApis.find((a) => a.id === editingStep.apiId) || editingStep.api;
      const matchedScenario = editingStep.requestScenario;

      const effectiveMethod = editingStep.methodOverride || matchedApi?.methodRequest || 'GET';
      const effectivePath = editingStep.pathOverride || matchedApi?.path || '';

      const effectiveHeaders = editingStep.headersOverride ?? matchedScenario?.headers ?? {};
      const effectiveQueryParams = editingStep.queryParamsOverride ?? matchedScenario?.queryParams ?? {};
      const effectiveBody =
        editingStep.bodyOverride !== undefined && editingStep.bodyOverride !== null
          ? editingStep.bodyOverride
          : matchedScenario?.body ?? {};

      setMethodOverride(effectiveMethod);
      setPathOverride(effectivePath);
      setHeadersJson(typeof effectiveHeaders === 'string' ? effectiveHeaders : JSON.stringify(effectiveHeaders || {}, null, 2));
      setQueryParamsJson(typeof effectiveQueryParams === 'string' ? effectiveQueryParams : JSON.stringify(effectiveQueryParams || {}, null, 2));
      const effectiveBodyType: RequestBodyType =
        (editingStep.bodyType as RequestBodyType) ||
        (matchedScenario?.bodyType as RequestBodyType) ||
        'JSON';
      setBodyType(effectiveBodyType);
      const parsedBodyStr = typeof effectiveBody === 'string' ? effectiveBody : JSON.stringify(effectiveBody || {}, null, 2);
      setBodyJson(parsedBodyStr);
      setFormFields(jsonToFormFields(parsedBodyStr));
      setBodyInputMode(effectiveBodyType === 'FORM_DATA' || effectiveBodyType === 'URL_ENCODED' ? 'fields' : 'raw');

      setExtractors((editingStep.extractors as VariableExtractor[]) || []);
      setAssertions((editingStep.assertions as AssertionRule[]) || []);
      setTargetEnvironmentType(editingStep.targetEnvironmentType === 'LOCAL' ? 'LOCAL' : 'DEFAULT');
      setTargetEnvironment(editingStep.targetEnvironment || (editingStep.api as any)?.targetEnvironment || '');

      if (editingStep.apiId) {
        loadScenariosForApi(editingStep.apiId);
      } else {
        setAvailableScenarios([]);
      }
    } else {
      setName(`Step ${stepCount + 1}`);
      setDescription('');
      setDelayMs(0);
      setContinueOnError(false);
      setSelectedApiId('');
      setSelectedScenarioId('');
      setMethodOverride('');
      setPathOverride('');
      setTargetEnvironmentType('DEFAULT');
      setTargetEnvironment('');
      setHeadersJson('{}');
      setQueryParamsJson('{}');
      setBodyJson('{}');
      setBodyType('JSON');
      setBodyInputMode('raw');
      setFormFields([]);
      setExtractors([]);
      setAssertions([
        { type: 'statusCode', operator: 'equals', expected: 200 },
      ]);
      setAvailableScenarios([]);
    }
    setError(null);
  }, [editingStep, stepCount, isOpen, projectApis, loadScenariosForApi]);

  const filteredApis = useMemo(() => {
    if (filterProjectId === 'ALL') return projectApis;
    return projectApis.filter((a) => a.projectId === filterProjectId);
  }, [projectApis, filterProjectId]);

  const groupedApis = useMemo(() => {
    const map = new Map<string, { projectId: string; projectName: string; apis: ApiCollection[] }>();
    for (const api of filteredApis) {
      const pId = api.projectId || 'other';
      if (!map.has(pId)) {
        const pName = projects.find((p) => p.id === pId)?.name || 'Project APIs';
        map.set(pId, { projectId: pId, projectName: pName, apis: [] });
      }
      map.get(pId)!.apis.push(api);
    }
    return Array.from(map.values());
  }, [filteredApis, projects]);

  const serviceEnvironmentGroups = useMemo(() => {
    if (!environments || environments.length === 0) return [];
    
    // Filter base URL services
    const baseUrlEnvs = environments.filter((e) => e.isBaseUrl !== false);

    return baseUrlEnvs.map((env) => {
      const slug = env.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') || env.id;
      
      const stages: { stage: string; url: string }[] = [];
      if (env.values) {
        if (env.values.DEVELOPMENT) stages.push({ stage: 'DEVELOPMENT', url: String(env.values.DEVELOPMENT) });
        if (env.values.TESTING) stages.push({ stage: 'TESTING', url: String(env.values.TESTING) });
        if (env.values.STAGING) stages.push({ stage: 'STAGING', url: String(env.values.STAGING) });
        if (env.values.PRODUCTION) stages.push({ stage: 'PRODUCTION', url: String(env.values.PRODUCTION) });
      }
      
      // Legacy fallback
      if (stages.length === 0 && getEnvironmentBaseUrl(env)) {
        stages.push({
          stage: env.environmentType || 'DEVELOPMENT',
          url: getEnvironmentBaseUrl(env),
        });
      }

      return {
        id: env.id,
        label: env.name,
        slug,
        env,
        stages,
      };
    });
  }, [environments]);

  const selectedServiceGroup = useMemo(() => {
    if (!targetEnvironment) return null;
    const cleanTarget = targetEnvironment.toLowerCase().trim();
    return (
      serviceEnvironmentGroups.find(
        (g) =>
          g.id === cleanTarget ||
          g.slug === cleanTarget ||
          g.slug.includes(cleanTarget) ||
          cleanTarget.includes(g.slug) ||
          g.label.toLowerCase() === cleanTarget ||
          g.label.toLowerCase().includes(cleanTarget)
      ) || null
    );
  }, [serviceEnvironmentGroups, targetEnvironment]);

  const selectedApi = useMemo(() => {
    return projectApis.find((a) => a.id === selectedApiId) || editingStep?.api || null;
  }, [projectApis, selectedApiId, editingStep]);

  const handleOpenApiDetail = useCallback(() => {
    if (!selectedApi) return;
    const pId = selectedApi.projectId || (projects.length > 0 ? projects[0].id : null);
    if (!pId) return;
    const url = ROUTES.API_DETAIL(pId, selectedApi.id);
    window.open(url, '_blank', 'noopener,noreferrer');
  }, [selectedApi, projects]);

  const handleApiChange = useCallback(async (apiId: string) => {
    setSelectedApiId(apiId);
    setSelectedScenarioId('');
    const matched = projectApis.find((a) => a.id === apiId);
    if (matched) {
      setMethodOverride(matched.methodRequest);
      setPathOverride(matched.path);
      if (!name || name.startsWith('Step ')) {
        setName(`${matched.methodRequest} ${matched.path}`);
      }
      const scenarios = await loadScenariosForApi(apiId);
      if (scenarios && scenarios.length > 0) {
        const first = scenarios[0];
        setSelectedScenarioId(first.id);
        if (first.headers && Object.keys(first.headers).length > 0) {
          setHeadersJson(JSON.stringify(first.headers, null, 2));
        }
        if (first.bodyType) {
          setBodyType(first.bodyType as RequestBodyType);
          if (first.bodyType === 'FORM_DATA' || first.bodyType === 'URL_ENCODED') {
            setBodyInputMode('fields');
          }
        }
        if (first.body && (typeof first.body !== 'object' || Object.keys(first.body).length > 0)) {
          const bodyStr = typeof first.body === 'string' ? first.body : JSON.stringify(first.body, null, 2);
          setBodyJson(bodyStr);
          setFormFields(jsonToFormFields(bodyStr));
        }
      }
    } else {
      setAvailableScenarios([]);
    }
  }, [projectApis, name, loadScenariosForApi]);

  const handleScenarioChange = useCallback((scenarioId: string) => {
    setSelectedScenarioId(scenarioId);
    const scenario = availableScenarios.find((s) => s.id === scenarioId);
    if (scenario) {
      if (scenario.bodyType) {
        setBodyType(scenario.bodyType as RequestBodyType);
        if (scenario.bodyType === 'FORM_DATA' || scenario.bodyType === 'URL_ENCODED') {
          setBodyInputMode('fields');
        }
      }
      if (scenario.headers) {
        setHeadersJson(JSON.stringify(scenario.headers, null, 2));
      }
      if (scenario.queryParams) {
        setQueryParamsJson(JSON.stringify(scenario.queryParams, null, 2));
      }
      if (scenario.body !== undefined && scenario.body !== null) {
        const bodyStr = typeof scenario.body === 'string' ? scenario.body : JSON.stringify(scenario.body, null, 2);
        setBodyJson(bodyStr);
        setFormFields(jsonToFormFields(bodyStr));
      }
    }
  }, [availableScenarios]);

  // Extractors Handlers
  const addExtractor = useCallback(() => {
    setExtractors((prev) => [
      ...prev,
      { variable: `var_${prev.length + 1}`, from: 'body', path: '' },
    ]);
  }, []);

  const removeExtractor = useCallback((idx: number) => {
    setExtractors((prev) => prev.filter((_, i) => i !== idx));
  }, []);

  const updateExtractor = useCallback((idx: number, field: keyof VariableExtractor, val: any) => {
    setExtractors((prev) => {
      const updated = [...prev];
      updated[idx] = { ...updated[idx], [field]: val };
      return updated;
    });
  }, []);

  // Assertions Handlers
  const addAssertion = useCallback(() => {
    setAssertions((prev) => [
      ...prev,
      { type: 'statusCode', operator: 'equals', expected: 200 },
    ]);
  }, []);

  const removeAssertion = useCallback((idx: number) => {
    setAssertions((prev) => prev.filter((_, i) => i !== idx));
  }, []);

  const updateAssertion = useCallback((idx: number, field: keyof AssertionRule, val: any) => {
    setAssertions((prev) => {
      const updated = [...prev];
      updated[idx] = { ...updated[idx], [field]: val };
      return updated;
    });
  }, []);

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError(SCENARIO_FLOW_DETAIL_TEXT.ERR_STEP_NAME_REQUIRED);
      return;
    }

    let parsedHeaders = null;
    let parsedQueryParams = null;
    let parsedBody = null;

    try {
      if (headersJson.trim() && headersJson.trim() !== '{}') {
        parsedHeaders = JSON.parse(headersJson);
      }
      if (queryParamsJson.trim() && queryParamsJson.trim() !== '{}') {
        parsedQueryParams = JSON.parse(queryParamsJson);
      }
      if (bodyJson.trim() && bodyJson.trim() !== '{}') {
        parsedBody = JSON.parse(bodyJson);
      }
    } catch {
      setError(SCENARIO_FLOW_DETAIL_TEXT.ERR_INVALID_JSON_STEP);
      return;
    }

    setIsSubmitting(true);
    setError(null);
    try {
      let effectiveBodyOverride = parsedBody;
      if (bodyType === 'NONE') {
        effectiveBodyOverride = null;
      } else if (bodyInputMode === 'fields') {
        try {
          effectiveBodyOverride = JSON.parse(formFieldsToJson(formFields));
        } catch {
          effectiveBodyOverride = parsedBody;
        }
      }

      await onSave({
        name: name.trim(),
        description: description.trim() || undefined,
        apiId: selectedApiId || undefined,
        requestScenarioId: selectedScenarioId || undefined,
        stepOrder: editingStep ? editingStep.stepOrder : stepCount + 1,
        delayMs: Number(delayMs) || 0,
        continueOnError,
        methodOverride: methodOverride.trim() || undefined,
        pathOverride: pathOverride.trim() || undefined,
        targetEnvironmentType: targetEnvironmentType === 'LOCAL' ? 'LOCAL' : 'DEFAULT',
        targetEnvironment: targetEnvironment.trim() || undefined,
        headersOverride: parsedHeaders,
        queryParamsOverride: parsedQueryParams,
        bodyOverride: effectiveBodyOverride,
        bodyType,
        extractors,
        assertions,
      });
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  }, [
    name,
    headersJson,
    queryParamsJson,
    bodyJson,
    bodyType,
    bodyInputMode,
    formFields,
    onSave,
    selectedApiId,
    selectedScenarioId,
    editingStep,
    stepCount,
    delayMs,
    continueOnError,
    methodOverride,
    pathOverride,
    targetEnvironmentType,
    targetEnvironment,
    extractors,
    assertions,
    onClose,
  ]);

  return {
    activeTab,
    setActiveTab,
    filterProjectId,
    setFilterProjectId,
    name,
    setName,
    description,
    setDescription,
    delayMs,
    setDelayMs,
    continueOnError,
    setContinueOnError,
    selectedApiId,
    setSelectedApiId,
    selectedScenarioId,
    setSelectedScenarioId,
    methodOverride,
    setMethodOverride,
    pathOverride,
    setPathOverride,
    targetEnvironmentType,
    setTargetEnvironmentType,
    targetEnvironment,
    setTargetEnvironment,
    headersJson,
    setHeadersJson,
    queryParamsJson,
    setQueryParamsJson,
    bodyJson,
    setBodyJson,
    bodyType,
    setBodyType,
    bodyInputMode,
    setBodyInputMode,
    formFields,
    focusedFieldId,
    setFocusedFieldId,
    extractors,
    assertions,
    availableScenarios,
    isLoadingScenarios,
    isSubmitting,
    error,
    lastFocusedField,
    setLastFocusedField,
    filteredApis,
    groupedApis,
    serviceEnvironmentGroups,
    selectedServiceGroup,
    selectedApi,
    handleAddFormField,
    handleRemoveFormField,
    handleUpdateFormField,
    handleInsertTokenToField,
    handleInsertToken,
    handleApiChange,
    handleScenarioChange,
    addExtractor,
    removeExtractor,
    updateExtractor,
    addAssertion,
    removeAssertion,
    updateAssertion,
    handleOpenApiDetail,
    handleSubmit,
  };
};
