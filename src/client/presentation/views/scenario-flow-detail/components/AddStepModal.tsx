'use client';

import React, { useState, useEffect } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import * as Tabs from '@radix-ui/react-tabs';
import * as Switch from '@radix-ui/react-switch';
import {
  X,
  Plus,
  Trash2,
  Key,
  ShieldCheck,
  Code2,
  Settings,
  Layers,
  Server,
  Globe,
  Laptop,
  ExternalLink,
} from 'lucide-react';
import {
  ScenarioFlowStep,
  VariableExtractor,
  AssertionRule,
} from '@/src/client/domain/scenario-flow/entity/scenario_flow';
import { ApiCollection } from '@/src/client/domain/api/entity/api_collection';
import { Project } from '@/src/client/domain/project/entity/project';
import { Environment, getEnvironmentBaseUrl } from '@/src/client/domain/environment/entity/environment';
import { ROUTES } from '@/src/core/constants/routes';
import { ApiSearchSelect } from '@/src/client/presentation/components/shared/ApiSearchSelect';
import { DataSheetVariablePicker } from '@/src/client/presentation/components/shared/DataSheetVariablePicker';
import { EnvironmentVariablePicker } from '@/src/client/presentation/components/shared/EnvironmentVariablePicker';
import { SCENARIO_FLOW_DETAIL_SEMANTIC_ID } from '../constant';

interface AddStepModalProps {
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

export const AddStepModal: React.FC<AddStepModalProps> = ({
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
}) => {
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

  // Extractors & Assertions
  const [extractors, setExtractors] = useState<VariableExtractor[]>([]);
  const [assertions, setAssertions] = useState<AssertionRule[]>([]);

  // Scenarios loaded for the selected API
  const [availableScenarios, setAvailableScenarios] = useState<any[]>([]);
  const [isLoadingScenarios, setIsLoadingScenarios] = useState(false);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastFocusedField, setLastFocusedField] = useState<'path' | 'headers' | 'queryParams' | 'body'>('body');

  const handleInsertToken = (token: string) => {
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
      try {
        const parsed = JSON.parse(bodyJson.trim() || '{}');
        parsed[cleanKey('field')] = token;
        setBodyJson(JSON.stringify(parsed, null, 2));
      } catch {
        setBodyJson((prev) => (prev ? `${prev}\n"${token}"` : token));
      }
    }
  };

  // Helper to load scenarios for an API
  const loadScenariosForApi = async (apiId: string) => {
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
  };

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
      setBodyJson(typeof effectiveBody === 'string' ? effectiveBody : JSON.stringify(effectiveBody || {}, null, 2));
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
      setExtractors([]);
      setAssertions([
        { type: 'statusCode', operator: 'equals', expected: 200 },
      ]);
      setAvailableScenarios([]);
    }
    setError(null);
  }, [editingStep, stepCount, isOpen]);

  const filteredApis = React.useMemo(() => {
    if (filterProjectId === 'ALL') return projectApis;
    return projectApis.filter((a) => a.projectId === filterProjectId);
  }, [projectApis, filterProjectId]);

  const groupedApis = React.useMemo(() => {
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

  const serviceEnvironmentGroups = React.useMemo(() => {
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

  const selectedServiceGroup = React.useMemo(() => {
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

  const selectedApi = React.useMemo(() => {
    return projectApis.find((a) => a.id === selectedApiId) || editingStep?.api || null;
  }, [projectApis, selectedApiId, editingStep]);

  const handleOpenApiDetail = () => {
    if (!selectedApi) return;
    const pId = selectedApi.projectId || (projects.length > 0 ? projects[0].id : null);
    if (!pId) return;
    const url = ROUTES.API_DETAIL(pId, selectedApi.id);
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  // When API selection changes, auto-fill method/path and default scenario
  const handleApiChange = async (apiId: string) => {
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
        if (first.queryParams && Object.keys(first.queryParams).length > 0) {
          setQueryParamsJson(JSON.stringify(first.queryParams, null, 2));
        }
        if (first.body && (typeof first.body !== 'object' || Object.keys(first.body).length > 0)) {
          setBodyJson(typeof first.body === 'string' ? first.body : JSON.stringify(first.body, null, 2));
        }
      }
    } else {
      setAvailableScenarios([]);
    }
  };

  const handleScenarioChange = (scenarioId: string) => {
    setSelectedScenarioId(scenarioId);
    const scenario = availableScenarios.find((s) => s.id === scenarioId);
    if (scenario) {
      if (scenario.headers) {
        setHeadersJson(JSON.stringify(scenario.headers, null, 2));
      }
      if (scenario.queryParams) {
        setQueryParamsJson(JSON.stringify(scenario.queryParams, null, 2));
      }
      if (scenario.body !== undefined && scenario.body !== null) {
        setBodyJson(typeof scenario.body === 'string' ? scenario.body : JSON.stringify(scenario.body, null, 2));
      }
    }
  };

  // Extractors Handlers
  const addExtractor = () => {
    setExtractors([
      ...extractors,
      { variable: `var_${extractors.length + 1}`, from: 'body', path: '' },
    ]);
  };

  const removeExtractor = (idx: number) => {
    setExtractors(extractors.filter((_, i) => i !== idx));
  };

  const updateExtractor = (idx: number, field: keyof VariableExtractor, val: any) => {
    const updated = [...extractors];
    updated[idx] = { ...updated[idx], [field]: val };
    setExtractors(updated);
  };

  // Assertions Handlers
  const addAssertion = () => {
    setAssertions([
      ...assertions,
      { type: 'statusCode', operator: 'equals', expected: 200 },
    ]);
  };

  const removeAssertion = (idx: number) => {
    setAssertions(assertions.filter((_, i) => i !== idx));
  };

  const updateAssertion = (idx: number, field: keyof AssertionRule, val: any) => {
    const updated = [...assertions];
    updated[idx] = { ...updated[idx], [field]: val };
    setAssertions(updated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Step name is required');
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
      setError('Invalid JSON format in Headers, Query Params, or Body override.');
      return;
    }

    setIsSubmitting(true);
    setError(null);
    try {
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
        bodyOverride: parsedBody,
        extractors,
        assertions,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog.Root open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs z-50 animate-in fade-in" />
        <Dialog.Content
          id={SCENARIO_FLOW_DETAIL_SEMANTIC_ID.MODAL_ADD_STEP}
          className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-2xl z-50 max-h-[90vh] overflow-y-auto space-y-5"
        >
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-purple-500/10 dark:bg-purple-500/20 text-purple-600 dark:text-purple-400 flex items-center justify-center">
                <Layers className="w-4 h-4" />
              </div>
              <div>
                <Dialog.Title className="text-base font-bold text-slate-900 dark:text-white">
                  {editingStep ? 'Edit Step' : 'Add Step to Flow'}
                </Dialog.Title>
                <Dialog.Description className="text-xs text-slate-500 dark:text-slate-400">
                  Configure API endpoint, dynamic parameters, extractors, and assertions
                </Dialog.Description>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Tabs */}
            <Tabs.Root value={activeTab} onValueChange={setActiveTab}>
              <Tabs.List className="flex border-b border-slate-200 dark:border-slate-800 gap-4 mb-4">
                <Tabs.Trigger
                  value="basic"
                  className={`pb-2 text-xs font-semibold flex items-center gap-1.5 border-b-2 transition-colors ${
                    activeTab === 'basic'
                      ? 'border-purple-600 text-purple-600 dark:text-purple-400'
                      : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-slate-200'
                  }`}
                >
                  <Settings className="w-3.5 h-3.5" /> Basic & API
                </Tabs.Trigger>
                <Tabs.Trigger
                  value="payload"
                  className={`pb-2 text-xs font-semibold flex items-center gap-1.5 border-b-2 transition-colors ${
                    activeTab === 'payload'
                      ? 'border-purple-600 text-purple-600 dark:text-purple-400'
                      : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-slate-200'
                  }`}
                >
                  <Code2 className="w-3.5 h-3.5" /> Overrides & Body
                </Tabs.Trigger>
                <Tabs.Trigger
                  value="extractors"
                  className={`pb-2 text-xs font-semibold flex items-center gap-1.5 border-b-2 transition-colors ${
                    activeTab === 'extractors'
                      ? 'border-purple-600 text-purple-600 dark:text-purple-400'
                      : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-slate-200'
                  }`}
                >
                  <Key className="w-3.5 h-3.5" /> Extractors ({extractors.length})
                </Tabs.Trigger>
                <Tabs.Trigger
                  value="assertions"
                  className={`pb-2 text-xs font-semibold flex items-center gap-1.5 border-b-2 transition-colors ${
                    activeTab === 'assertions'
                      ? 'border-purple-600 text-purple-600 dark:text-purple-400'
                      : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-slate-200'
                  }`}
                >
                  <ShieldCheck className="w-3.5 h-3.5" /> Assertions ({assertions.length})
                </Tabs.Trigger>
              </Tabs.List>

              {/* Tab: Basic & API */}
              <Tabs.Content value="basic" className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Step Name <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Authenticate User or Fetch Profile"
                    className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-purple-500/30"
                  />
                </div>

                {/* Project Filter and API Selector */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                      Select API
                    </label>
                    {projects.length > 1 && (
                      <div className="flex items-center gap-1.5">
                        <span className="text-[11px] text-slate-500">Project:</span>
                        <select
                          value={filterProjectId}
                          onChange={(e) => setFilterProjectId(e.target.value)}
                          className="px-2 py-0.5 text-[11px] rounded-md border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-200 focus:outline-hidden focus:ring-1 focus:ring-purple-500"
                        >
                          <option value="ALL">All Projects ({projectApis.length})</option>
                          {projects.map((p) => (
                            <option key={p.id} value={p.id}>
                              {p.name}
                            </option>
                          ))}
                        </select>
                      </div>
                    )}
                  </div>

                  <ApiSearchSelect
                    groupedApis={groupedApis}
                    selectedApiId={selectedApiId}
                    selectedApi={selectedApi}
                    onSelect={handleApiChange}
                  />

                  {selectedApiId && availableScenarios.length > 0 && (
                    <div className="pt-1.5 space-y-1">
                      <div className="flex items-center justify-between">
                        <label className="text-[11px] font-medium text-slate-600 dark:text-slate-400">
                          Request Scenario Preset
                        </label>
                        {isLoadingScenarios && (
                          <span className="text-[10px] text-purple-500 animate-pulse">Loading scenarios...</span>
                        )}
                      </div>
                      <select
                        value={selectedScenarioId}
                        onChange={(e) => handleScenarioChange(e.target.value)}
                        className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-200 focus:outline-hidden focus:ring-1 focus:ring-purple-500"
                      >
                        <option value="">-- Custom / Step specific parameters --</option>
                        {availableScenarios.map((sc) => (
                          <option key={sc.id} value={sc.id}>
                            {sc.name} {sc.description ? `(${sc.description})` : ''}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>

                {/* Method & Path */}
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Method
                    </label>
                    <select
                      value={methodOverride}
                      onChange={(e) => setMethodOverride(e.target.value)}
                      className="w-full px-3 py-2 text-xs font-mono font-bold rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white"
                    >
                      <option value="GET">GET</option>
                      <option value="POST">POST</option>
                      <option value="PUT">PUT</option>
                      <option value="PATCH">PATCH</option>
                      <option value="DELETE">DELETE</option>
                    </select>
                  </div>
                  <div className="col-span-2">
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                        Endpoint Path <span className="text-slate-400 font-normal">(supports &#123;&#123;var&#125;&#125;)</span>
                      </label>
                      <div className="flex items-center gap-1.5">
                        <EnvironmentVariablePicker
                          buttonLabel="Env"
                          triggerClassName="text-[10px] py-0.5 px-2"
                          projectId={projectId}
                          onInsert={(token) => setPathOverride((prev) => (prev ? `${prev}${token}` : token))}
                        />
                        <DataSheetVariablePicker
                          buttonLabel="Data Sheet"
                          triggerClassName="text-[10px] py-0.5 px-2"
                          projectId={projectId}
                          onInsert={(token) => setPathOverride((prev) => (prev ? `${prev}${token}` : token))}
                        />
                      </div>
                    </div>
                    <input
                      type="text"
                      value={pathOverride}
                      onFocus={() => setLastFocusedField('path')}
                      onChange={(e) => setPathOverride(e.target.value)}
                      placeholder="/api/v1/users/{{userId}}"
                      className="w-full px-3 py-2 text-xs font-mono rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white"
                    />
                  </div>
                </div>

                {/* Target Environment: Default (Global Header) vs Local */}
                <div className="space-y-1.5 pt-1">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center justify-between">
                    <span className="flex items-center gap-1.5">
                      <Server className="w-3.5 h-3.5 text-purple-500" />
                      Target Environment Base URL
                    </span>
                    <span className="text-[10px] font-normal text-slate-400">
                      {targetEnvironmentType === 'LOCAL'
                        ? 'Khusus step ini ke local APP_URL'
                        : 'Mengikuti switcher env di header flow'}
                    </span>
                  </label>
                  <div className="grid grid-cols-2 gap-2.5">
                    <button
                      type="button"
                      onClick={() => setTargetEnvironmentType('DEFAULT')}
                      className={`flex items-center justify-center gap-2 p-2.5 rounded-xl border text-xs font-semibold transition-all cursor-pointer ${
                        targetEnvironmentType === 'DEFAULT'
                          ? 'border-purple-500/50 bg-purple-500/10 text-purple-600 dark:text-purple-400 shadow-2xs font-bold ring-1 ring-purple-500/30'
                          : 'border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950 text-slate-600 dark:text-slate-400 hover:border-slate-300 dark:hover:border-slate-700'
                      }`}
                    >
                      <Globe className="w-3.5 h-3.5" />
                      <span>Default (Ikuti Header)</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setTargetEnvironmentType('LOCAL')}
                      className={`flex items-center justify-center gap-2 p-2.5 rounded-xl border text-xs font-semibold transition-all cursor-pointer ${
                        targetEnvironmentType === 'LOCAL'
                          ? 'border-emerald-500/50 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 shadow-2xs font-bold ring-1 ring-emerald-500/30'
                          : 'border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950 text-slate-600 dark:text-slate-400 hover:border-slate-300 dark:hover:border-slate-700'
                      }`}
                    >
                      <Laptop className="w-3.5 h-3.5" />
                      <span>Local (Khusus Step Ini)</span>
                    </button>
                  </div>

                  {/* Service Environment Preset Dropdown when Default (Ikuti Header) is active */}
                  {targetEnvironmentType === 'DEFAULT' && serviceEnvironmentGroups.length > 0 && (
                    <div className="pt-2 space-y-1.5 animate-in fade-in slide-in-from-top-1">
                      <div className="flex items-center justify-between">
                        <label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300">
                          Pilih Service Base URL / Target Environment
                        </label>
                        <span className="text-[10px] text-slate-400 font-normal">
                          dari daftar Environments proyek
                        </span>
                      </div>
                      <select
                        value={targetEnvironment}
                        onChange={(e) => setTargetEnvironment(e.target.value)}
                        className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-purple-500/30 font-medium"
                      >
                        <option value="">-- Auto (Gunakan Base URL Terkait API / Flow Default) --</option>
                        {serviceEnvironmentGroups.map((group) => (
                          <option key={group.slug} value={group.slug}>
                            🌐 {group.label}
                          </option>
                        ))}
                      </select>

                      {/* Preview of Base URLs for selected service */}
                      {selectedServiceGroup && (
                        <div className="p-2.5 rounded-lg border border-purple-500/20 bg-purple-500/5 dark:bg-purple-950/20 text-[11px] space-y-1.5">
                          <div className="text-[10px] font-bold text-purple-600 dark:text-purple-400 uppercase tracking-wider">
                            Base URLs terdaftar untuk {selectedServiceGroup.label}:
                          </div>
                          <div className="space-y-1">
                            {selectedServiceGroup.stages.map((s) => (
                              <div key={s.stage} className="flex items-center justify-between font-mono text-[10px]">
                                <span className="font-bold px-1.5 py-0.2 rounded bg-purple-500/10 text-purple-600 dark:text-purple-300">
                                  {s.stage}
                                </span>
                                <span className="text-slate-600 dark:text-slate-400 truncate max-w-[320px]" title={s.url}>
                                  {s.url}
                                </span>
                              </div>
                            ))}
                            {selectedServiceGroup.stages.length === 0 && (
                              <div className="text-[10px] text-slate-400 italic">
                                Belum ada URL stage yang dikonfigurasi
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Options: Delay & ContinueOnError */}
                <div className="grid grid-cols-2 gap-4 pt-2">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Step Delay (ms)
                    </label>
                    <input
                      type="number"
                      min={0}
                      value={delayMs}
                      onChange={(e) => setDelayMs(Number(e.target.value))}
                      placeholder="0"
                      className="w-full px-3 py-2 text-xs font-mono rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white"
                    />
                  </div>

                  <div className="flex items-center justify-between p-2.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950">
                    <div>
                      <span className="text-xs font-semibold text-slate-900 dark:text-white block">
                        Continue on Error
                      </span>
                      <span className="text-[10px] text-slate-500">Don't halt flow on error</span>
                    </div>
                    <Switch.Root
                      checked={continueOnError}
                      onCheckedChange={setContinueOnError}
                      className="w-8 h-4 bg-slate-300 dark:bg-slate-700 rounded-full relative data-[state=checked]:bg-purple-600 outline-hidden transition-colors"
                    >
                      <Switch.Thumb className="block w-3.5 h-3.5 bg-white rounded-full transition-transform duration-100 translate-x-0.5 will-change-transform data-[state=checked]:translate-x-3.5" />
                    </Switch.Root>
                  </div>
                </div>
              </Tabs.Content>

              {/* Tab: Overrides & Body */}
              <Tabs.Content value="payload" className="space-y-4">
                <div className="flex items-center justify-between p-2.5 bg-purple-50/60 dark:bg-purple-950/30 border border-purple-100 dark:border-purple-800/60 rounded-xl">
                  <div>
                    <span className="text-xs text-purple-700 dark:text-purple-300 font-medium block">
                      Use dynamic variables, envs, or datasets:
                    </span>
                    <span className="text-[10px] text-slate-500 dark:text-slate-400">
                      Token will be inserted into active field (focused: <span className="font-semibold font-mono text-purple-600 dark:text-purple-400">{lastFocusedField}</span>)
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <EnvironmentVariablePicker
                      buttonLabel="Env Variables"
                      projectId={projectId}
                      onInsert={handleInsertToken}
                    />
                    <DataSheetVariablePicker
                      buttonLabel="Data Sheet Variables"
                      projectId={projectId}
                      onInsert={handleInsertToken}
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                      Headers Override (JSON)
                    </label>
                    <span className="text-[11px] text-slate-400 font-mono">
                      e.g. &#123; "Authorization": "Bearer &#123;&#123;token&#125;&#125;" &#123;
                    </span>
                  </div>
                  <textarea
                    rows={3}
                    value={headersJson}
                    onFocus={() => setLastFocusedField('headers')}
                    onChange={(e) => setHeadersJson(e.target.value)}
                    className="w-full px-3 py-2 text-xs font-mono rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-950 text-slate-200"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Query Parameters Override (JSON)
                  </label>
                  <textarea
                    rows={2}
                    value={queryParamsJson}
                    onFocus={() => setLastFocusedField('queryParams')}
                    onChange={(e) => setQueryParamsJson(e.target.value)}
                    className="w-full px-3 py-2 text-xs font-mono rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-950 text-slate-200"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                      Request Body (JSON)
                    </label>
                    <span className="text-[11px] text-purple-600 dark:text-purple-400 font-mono">
                      Supports &#123;&#123;var&#125;&#125;, &#123;&#123;$uuid&#125;&#125;, &#123;&#123;$timestamp&#125;&#125;
                    </span>
                  </div>
                  <textarea
                    rows={6}
                    value={bodyJson}
                    onFocus={() => setLastFocusedField('body')}
                    onChange={(e) => setBodyJson(e.target.value)}
                    className="w-full px-3 py-2 text-xs font-mono rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-950 text-slate-200"
                  />
                </div>
              </Tabs.Content>

              {/* Tab: Variable Extractors */}
              <Tabs.Content value="extractors" className="space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-xs text-slate-500">
                    Extract data from this response to reuse in subsequent steps as &#123;&#123;variable&#125;&#125;.
                  </p>
                  <button
                    type="button"
                    onClick={addExtractor}
                    className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-950/40 rounded-lg hover:bg-purple-100 dark:hover:bg-purple-900/50"
                  >
                    <Plus className="w-3.5 h-3.5" /> Add Extractor
                  </button>
                </div>

                {extractors.length === 0 ? (
                  <p className="text-xs text-slate-400 italic py-6 text-center border border-dashed border-slate-200 dark:border-slate-800 rounded-xl">
                    No extractors configured. Click 'Add Extractor' to pass tokens, IDs, or values to next steps.
                  </p>
                ) : (
                  <div className="space-y-2">
                    {extractors.map((ext, idx) => (
                      <div
                        key={idx}
                        className="flex items-center gap-2 p-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800"
                      >
                        <input
                          type="text"
                          placeholder="Variable name (e.g. authToken)"
                          value={ext.variable}
                          onChange={(e) => updateExtractor(idx, 'variable', e.target.value)}
                          className="flex-1 px-2 py-1 text-xs font-mono rounded border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                        />
                        <span className="text-xs text-slate-400">←</span>
                        <select
                          value={ext.from}
                          onChange={(e) => updateExtractor(idx, 'from', e.target.value as any)}
                          className="px-2 py-1 text-xs rounded border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                        >
                          <option value="body">Response Body</option>
                          <option value="headers">Headers</option>
                          <option value="status">Status Code</option>
                        </select>
                        <input
                          type="text"
                          placeholder="Path (e.g. data.token or items[0].id)"
                          value={ext.path}
                          onChange={(e) => updateExtractor(idx, 'path', e.target.value)}
                          className="flex-1 px-2 py-1 text-xs font-mono rounded border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                        />
                        <button
                          type="button"
                          onClick={() => removeExtractor(idx)}
                          className="p-1 text-slate-400 hover:text-rose-500 rounded"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </Tabs.Content>

              {/* Tab: Assertions */}
              <Tabs.Content value="assertions" className="space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-xs text-slate-500">
                    Verify response values to ensure the API behaves as expected.
                  </p>
                  <button
                    type="button"
                    onClick={addAssertion}
                    className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/40 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/50"
                  >
                    <Plus className="w-3.5 h-3.5" /> Add Assertion
                  </button>
                </div>

                {assertions.length === 0 ? (
                  <p className="text-xs text-slate-400 italic py-6 text-center border border-dashed border-slate-200 dark:border-slate-800 rounded-xl">
                    No assertions configured. Defaults to HTTP 2xx/3xx check.
                  </p>
                ) : (
                  <div className="space-y-2">
                    {assertions.map((ast, idx) => (
                      <div
                        key={idx}
                        className="flex items-center gap-2 p-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 flex-wrap"
                      >
                        <select
                          value={ast.type}
                          onChange={(e) => updateAssertion(idx, 'type', e.target.value as any)}
                          className="px-2 py-1 text-xs rounded border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-medium"
                        >
                          <option value="statusCode">Status Code</option>
                          <option value="bodyPath">Body Path</option>
                          <option value="header">Header</option>
                          <option value="responseTime">Response Time (ms)</option>
                        </select>

                        {ast.type !== 'statusCode' && ast.type !== 'responseTime' && (
                          <input
                            type="text"
                            placeholder="Path e.g. data.id"
                            value={ast.path || ''}
                            onChange={(e) => updateAssertion(idx, 'path', e.target.value)}
                            className="w-32 px-2 py-1 text-xs font-mono rounded border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                          />
                        )}

                        <select
                          value={ast.operator}
                          onChange={(e) => updateAssertion(idx, 'operator', e.target.value as any)}
                          className="px-2 py-1 text-xs rounded border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                        >
                          <option value="equals">equals</option>
                          <option value="notEquals">not equals</option>
                          <option value="contains">contains</option>
                          <option value="exists">exists</option>
                          <option value="notExists">not exists</option>
                          <option value="greaterThan">&gt; greater than</option>
                          <option value="lessThan">&lt; less than</option>
                          <option value="in_datasheet">in data sheet</option>
                        </select>

                        {ast.operator === 'in_datasheet' ? (
                          <div className="flex items-center gap-1 flex-1 min-w-40">
                            <input
                              type="text"
                              placeholder="Sheet code e.g. emails"
                              value={ast.expected !== undefined ? String(ast.expected) : ''}
                              onChange={(e) => updateAssertion(idx, 'expected', e.target.value)}
                              className="flex-1 px-2 py-1 text-xs font-mono rounded border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                            />
                            <DataSheetVariablePicker
                              buttonLabel="Pick Sheet"
                              triggerClassName="text-[10px] py-0.5 px-2"
                              onInsert={(token) => {
                                const cleanCode = token
                                  .replace(/^\{\{\s*datasheet\./, '')
                                  .replace(/\..*$/, '')
                                  .replace(/\[.*$/, '')
                                  .replace(/\}\}/, '');
                                updateAssertion(idx, 'expected', cleanCode);
                              }}
                            />
                          </div>
                        ) : ast.operator !== 'exists' && ast.operator !== 'notExists' ? (
                          <div className="flex items-center gap-1 flex-1 min-w-40">
                            <input
                              type="text"
                              placeholder="Expected"
                              value={ast.expected !== undefined ? String(ast.expected) : ''}
                              onChange={(e) => updateAssertion(idx, 'expected', e.target.value)}
                              className="flex-1 px-2 py-1 text-xs font-mono rounded border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                            />
                            <EnvironmentVariablePicker
                              buttonLabel="Env"
                              triggerClassName="text-[10px] py-0.5 px-1.5"
                              projectId={projectId}
                              onInsert={(token) => updateAssertion(idx, 'expected', token)}
                            />
                            <DataSheetVariablePicker
                              buttonLabel="Tag"
                              triggerClassName="text-[10px] py-0.5 px-1.5"
                              projectId={projectId}
                              onInsert={(token) => updateAssertion(idx, 'expected', token)}
                            />
                          </div>
                        ) : null}

                        <button
                          type="button"
                          onClick={() => removeAssertion(idx)}
                          className="p-1 text-slate-400 hover:text-rose-500 rounded"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </Tabs.Content>
            </Tabs.Root>

            {error && (
              <p className="text-xs text-rose-500 font-semibold">{error}</p>
            )}

            <div className="flex items-center justify-between flex-wrap gap-2.5 pt-3 border-t border-slate-100 dark:border-slate-800">
              {/* Left: Button to edit Request & Response scenarios in API Detail when mode is LOCAL */}
              <div>
                {targetEnvironmentType === 'LOCAL' && selectedApi && (
                  <button
                    type="button"
                    onClick={handleOpenApiDetail}
                    className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 hover:border-emerald-500/50 rounded-lg transition-all cursor-pointer shadow-2xs"
                    title="Buka halaman API Detail di tab baru untuk mengedit Request & Response Scenarios lokal"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span>Edit Req & Res Scenario (API Detail)</span>
                  </button>
                )}
              </div>

              {/* Right: Cancel & Submit buttons */}
              <div className="flex items-center gap-2.5">
                <button
                  type="button"
                  onClick={onClose}
                  disabled={isSubmitting}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 text-xs font-semibold text-white bg-purple-600 hover:bg-purple-500 active:bg-purple-700 rounded-lg shadow-sm shadow-purple-500/20 disabled:opacity-50 transition-all cursor-pointer"
                >
                  {isSubmitting ? 'Saving...' : editingStep ? 'Update Step' : 'Add Step'}
                </button>
              </div>
            </div>
          </form>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
};
