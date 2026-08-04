'use client';

import React from 'react';
import * as Tabs from '@radix-ui/react-tabs';
import * as Dialog from '@radix-ui/react-dialog';
import {
  ArrowLeft,
  Globe,
  Layers,
  FileCode,
  Plus,
  Search,
  Copy,
  Check,
  Edit2,
  Trash2,
  X,
  Play,
  Clock,
  Zap,
  Sliders,
  CheckCircle2,
  Code2,
  ExternalLink,
  ChevronRight,
  Sparkles,
} from 'lucide-react';
import { HttpMethodBadge } from '../../components/shared/HttpMethodBadge';
import { StatusCodeBadge } from '../../components/shared/StatusCodeBadge';
import { StatusBadge } from '../../components/shared/StatusBadge';
import { StatusSwitch } from '../../components/shared/StatusSwitch';
import { EnvironmentTypeBadge } from '../../components/shared/EnvironmentTypeBadge';
import { KeyValueEditor } from '../../components/shared/KeyValueEditor';
import { JsonEditor } from '../../components/shared/JsonEditor';
import { ConfirmDialog } from '../../components/shared/ConfirmDialog';
import { EmptyState } from '../../components/shared/EmptyState';
import { useApiDetailViewModel } from './useApiDetailViewModel';

export const ApiDetailView: React.FC = () => {
  const {
    db,
    projectId,
    project,
    api,
    projectEnvs,
    reqScenarios,
    respScenarios,
    activeReqScenario,
    environmentRows,
    handleToggleEnabled,
    handleUpdatePathOverride,
    activeMainTab,
    setActiveMainTab,
    scenarioSearch,
    setScenarioSearch,
    selectedReqScenarioId,
    setSelectedReqScenarioId,
    isReqModalOpen,
    setIsReqModalOpen,
    editingReqScenario,
    setEditingReqScenario,
    isRespModalOpen,
    setIsRespModalOpen,
    editingRespScenario,
    setEditingRespScenario,
    deletingReqId,
    setDeletingReqId,
    deletingRespId,
    setDeletingRespId,
    copiedUrl,
    handleSaveReqScenario,
    handleSaveRespScenario,
    handleCopyResolvedUrl,
    createRequestScenario,
    updateRequestScenario,
    createResponseScenario,
    updateResponseScenario,
    router,
    toggleApiCollectionStatus,
    toggleRequestScenarioStatus,
    duplicateRequestScenario,
    deleteRequestScenario,
    toggleResponseScenarioStatus,
    duplicateResponseScenario,
    deleteResponseScenario,
  } = useApiDetailViewModel();

  if (!api || !project) {
    return (
      <div className="py-16 text-center space-y-3">
        <h2 className="text-base font-bold text-slate-800 dark:text-slate-200">API Endpoint Not Found</h2>
        <button
          onClick={() => router.push(`/projects/${projectId}`)}
          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-indigo-600 rounded-md"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Back to Project
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
        <div className="space-y-1">
          <button
            onClick={() => router.push(`/projects/${projectId}`)}
            className="inline-flex items-center gap-1 text-xs text-slate-500 hover:text-slate-900 dark:hover:text-slate-100 transition-colors mb-1"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Back to {project.name}
          </button>

          <div className="flex flex-wrap items-center gap-3">
            <HttpMethodBadge method={api.methodRequest} size="lg" />
            <h1 className="text-xl font-mono font-bold tracking-tight text-slate-900 dark:text-slate-100">
              {api.path}
            </h1>
            <StatusBadge status={api.status} />
          </div>

          <p className="text-xs text-slate-500 dark:text-slate-400">
            {api.name} {api.description ? `• ${api.description}` : ''}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <StatusSwitch
            checked={api.status}
            onCheckedChange={() => toggleApiCollectionStatus(api.id)}
            label={api.status ? 'API Active' : 'API Disabled'}
          />
        </div>
      </div>

      {/* Main Tabs Navigation */}
      <Tabs.Root value={activeMainTab} onValueChange={setActiveMainTab} className="space-y-4">
        <Tabs.List className="flex border-b border-slate-200 dark:border-slate-800 gap-6">
          <Tabs.Trigger
            value="scenarios"
            className={`pb-2.5 text-xs font-semibold transition-colors ${
              activeMainTab === 'scenarios'
                ? 'text-indigo-600 dark:text-indigo-400 border-b-2 border-indigo-600 dark:border-indigo-400'
                : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            Request & Response Scenarios ({reqScenarios.length})
          </Tabs.Trigger>

          <Tabs.Trigger
            value="environments"
            className={`pb-2.5 text-xs font-semibold transition-colors ${
              activeMainTab === 'environments'
                ? 'text-indigo-600 dark:text-indigo-400 border-b-2 border-indigo-600 dark:border-indigo-400'
                : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            Environment Overrides ({projectEnvs.length})
          </Tabs.Trigger>

          <Tabs.Trigger
            value="overview"
            className={`pb-2.5 text-xs font-semibold transition-colors ${
              activeMainTab === 'overview'
                ? 'text-indigo-600 dark:text-indigo-400 border-b-2 border-indigo-600 dark:border-indigo-400'
                : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            Endpoint Overview
          </Tabs.Trigger>
        </Tabs.List>

        {/* --- TAB 1: SCENARIOS (Master Detail Workspace) --- */}
        <Tabs.Content value="scenarios" className="focus:outline-none">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 min-h-150">
            {/* Left Sidebar: Scenario List */}
            <div className="lg:col-span-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 space-y-3 flex flex-col justify-between shadow-xs">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                    Request Scenarios
                  </h3>
                  <button
                    type="button"
                    onClick={() => {
                      setEditingReqScenario(null);
                      setIsReqModalOpen(true);
                    }}
                    className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded-md transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" /> Add
                  </button>
                </div>

                {/* Scenario Search */}
                <div className="relative">
                  <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    value={scenarioSearch}
                    onChange={(e) => setScenarioSearch(e.target.value)}
                    placeholder="Filter scenarios..."
                    className="w-full pl-8 pr-2.5 py-1 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-md text-slate-900 dark:text-slate-100 focus:outline-none"
                  />
                </div>

                {/* Scenarios List */}
                <div className="space-y-1.5 max-h-125 overflow-y-auto pr-1">
                  {reqScenarios.length === 0 ? (
                    <div className="p-4 border border-dashed border-slate-200 dark:border-slate-800 rounded-lg text-center">
                      <p className="text-xs text-slate-500">No request scenarios configured.</p>
                      <button
                        onClick={() => {
                          setEditingReqScenario(null);
                          setIsReqModalOpen(true);
                        }}
                        className="mt-2 text-xs text-indigo-600 font-semibold hover:underline"
                      >
                        Create first scenario
                      </button>
                    </div>
                  ) : (
                    reqScenarios
                      .filter((r) => r.name.toLowerCase().includes(scenarioSearch.toLowerCase()))
                      .map((req) => {
                        const isSelected = activeReqScenario?.id === req.id;
                        const respCount = db.responseScenarios.filter(
                          (res) => res.requestScenarioId === req.id && !res.deletedAt
                        ).length;

                        return (
                          <div
                            key={req.id}
                            onClick={() => setSelectedReqScenarioId(req.id)}
                            className={`p-3 rounded-lg border text-left cursor-pointer transition-all space-y-2 ${
                              isSelected
                                ? 'border-indigo-600 bg-indigo-50/60 dark:bg-indigo-950/60 shadow-xs'
                                : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50'
                            }`}
                          >
                            <div className="flex items-start justify-between gap-2">
                              <span className="font-semibold text-xs text-slate-900 dark:text-slate-100 truncate">
                                {req.name}
                              </span>
                              <StatusSwitch
                                checked={req.status}
                                onCheckedChange={() => toggleRequestScenarioStatus(req.id)}
                                size="sm"
                              />
                            </div>

                            <div className="flex items-center justify-between text-[10px] font-mono text-slate-500">
                              <span className="px-1.5 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded uppercase">
                                {req.matchType}
                              </span>
                              <span>Prio: {req.priority}</span>
                              <span className="text-indigo-600 dark:text-indigo-400 font-semibold">
                                {respCount} Resps
                              </span>
                            </div>
                          </div>
                        );
                      })
                  )}
                </div>
              </div>
            </div>

            {/* Main Workspace Area for Selected Request Scenario */}
            <div className="lg:col-span-8 space-y-6">
              {!activeReqScenario ? (
                <EmptyState
                  icon={FileCode}
                  title="No scenario selected"
                  description="Select or add a request scenario from the left panel to configure headers, parameters, matching rules, and mock responses."
                />
              ) : (
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-xs space-y-5">
                  {/* Scenario Detail Header */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
                    <div>
                      <div className="flex items-center gap-2">
                        <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
                          {activeReqScenario.name}
                        </h2>
                        <span className="px-2 py-0.5 text-[10px] font-mono font-bold bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 rounded border border-indigo-200 dark:border-indigo-800">
                          MATCH: {activeReqScenario.matchType}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                        {activeReqScenario.description || 'No description provided.'}
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => {
                          setEditingReqScenario(activeReqScenario);
                          setIsReqModalOpen(true);
                        }}
                        className="p-1.5 text-slate-500 hover:text-slate-900 dark:hover:text-slate-100 bg-slate-100 dark:bg-slate-800 rounded-md transition-colors"
                        title="Edit Scenario Settings"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => duplicateRequestScenario(activeReqScenario.id)}
                        className="p-1.5 text-slate-500 hover:text-slate-900 dark:hover:text-slate-100 bg-slate-100 dark:bg-slate-800 rounded-md transition-colors"
                        title="Duplicate Scenario"
                      >
                        <Copy className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => setDeletingReqId(activeReqScenario.id)}
                        className="p-1.5 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-md transition-colors"
                        title="Delete Scenario"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Request Configuration Tabs */}
                  <Tabs.Root defaultValue="headers" className="space-y-3">
                    <Tabs.List className="flex border-b border-slate-100 dark:border-slate-800 gap-4 text-xs font-medium">
                      <Tabs.Trigger
                        value="headers"
                        className="pb-2 text-slate-500 hover:text-slate-900 dark:hover:text-slate-100 data-[state=active]:text-indigo-600 data-[state=active]:font-semibold data-[state=active]:border-b-2 data-[state=active]:border-indigo-600"
                      >
                        Headers ({Object.keys(activeReqScenario.headers || {}).length})
                      </Tabs.Trigger>
                      <Tabs.Trigger
                        value="queryParams"
                        className="pb-2 text-slate-500 hover:text-slate-900 dark:hover:text-slate-100 data-[state=active]:text-indigo-600 data-[state=active]:font-semibold data-[state=active]:border-b-2 data-[state=active]:border-indigo-600"
                      >
                        Query Params ({Object.keys(activeReqScenario.queryParams || {}).length})
                      </Tabs.Trigger>
                      <Tabs.Trigger
                        value="pathParams"
                        className="pb-2 text-slate-500 hover:text-slate-900 dark:hover:text-slate-100 data-[state=active]:text-indigo-600 data-[state=active]:font-semibold data-[state=active]:border-b-2 data-[state=active]:border-indigo-600"
                      >
                        Path Params ({Object.keys(activeReqScenario.pathParams || {}).length})
                      </Tabs.Trigger>
                      <Tabs.Trigger
                        value="body"
                        className="pb-2 text-slate-500 hover:text-slate-900 dark:hover:text-slate-100 data-[state=active]:text-indigo-600 data-[state=active]:font-semibold data-[state=active]:border-b-2 data-[state=active]:border-indigo-600"
                      >
                        Body
                      </Tabs.Trigger>
                    </Tabs.List>

                    <Tabs.Content value="headers">
                      <KeyValueEditor
                        title="Expected Request Headers"
                        keyPlaceholder="e.g. authorization"
                        valuePlaceholder="e.g. Bearer token"
                        value={activeReqScenario.headers || {}}
                        onChange={(val) => updateRequestScenario(activeReqScenario.id, { headers: val })}
                      />
                    </Tabs.Content>

                    <Tabs.Content value="queryParams">
                      <KeyValueEditor
                        title="Expected Query Parameters"
                        keyPlaceholder="e.g. includeDetails"
                        valuePlaceholder="e.g. true"
                        value={activeReqScenario.queryParams || {}}
                        onChange={(val) => updateRequestScenario(activeReqScenario.id, { queryParams: val })}
                      />
                    </Tabs.Content>

                    <Tabs.Content value="pathParams">
                      <KeyValueEditor
                        title="Expected Path Parameters"
                        keyPlaceholder="e.g. id"
                        valuePlaceholder="e.g. 123"
                        value={activeReqScenario.pathParams || {}}
                        onChange={(val) => updateRequestScenario(activeReqScenario.id, { pathParams: val })}
                      />
                    </Tabs.Content>

                    <Tabs.Content value="body">
                      <JsonEditor
                        title="Expected Request Body Schema / Payload"
                        value={activeReqScenario.body || {}}
                        onChange={(val) => updateRequestScenario(activeReqScenario.id, { body: val })}
                        rows={6}
                      />
                    </Tabs.Content>
                  </Tabs.Root>

                  {/* Response Scenario Section */}
                  <div className="pt-4 border-t border-slate-200 dark:border-slate-800 space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-slate-100">
                          Mock Responses ({respScenarios.length})
                        </h3>
                        <p className="text-[11px] text-slate-500">
                          Multiple weighted or prioritized response payoffs for this request match
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={() => {
                          setEditingRespScenario(null);
                          setIsRespModalOpen(true);
                        }}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded-lg shadow-xs transition-colors"
                      >
                        <Plus className="w-3.5 h-3.5" /> Add Response
                      </button>
                    </div>

                    {/* Response Scenario Cards */}
                    {respScenarios.length === 0 ? (
                      <div className="p-4 border border-dashed border-slate-200 dark:border-slate-800 rounded-lg text-center">
                        <p className="text-xs text-slate-500">No mock responses configured for this scenario.</p>
                        <button
                          onClick={() => {
                            setEditingRespScenario(null);
                            setIsRespModalOpen(true);
                          }}
                          className="mt-2 text-xs text-indigo-600 font-semibold hover:underline"
                        >
                          Add response scenario
                        </button>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {respScenarios.map((resp) => (
                          <div
                            key={resp.id}
                            className="p-4 bg-slate-50/80 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 rounded-xl space-y-3"
                          >
                            <div className="flex items-start justify-between gap-3">
                              <div className="space-y-1">
                                <div className="flex items-center gap-2">
                                  <StatusCodeBadge code={resp.statusCode} />
                                  <h4 className="font-bold text-xs text-slate-900 dark:text-slate-100">
                                    {resp.name}
                                  </h4>
                                </div>
                                <p className="text-[11px] text-slate-500">{resp.description || 'No description'}</p>
                              </div>

                              <div className="flex items-center gap-2">
                                <span className="text-[10px] font-mono px-2 py-0.5 bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded">
                                  Delay: {resp.delayMs}ms
                                </span>
                                <span className="text-[10px] font-mono px-2 py-0.5 bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded">
                                  Weight: {resp.weight}%
                                </span>
                                <StatusSwitch
                                  checked={resp.status}
                                  onCheckedChange={() => toggleResponseScenarioStatus(resp.id)}
                                  size="sm"
                                />
                                <button
                                  onClick={() => {
                                    setEditingRespScenario(resp);
                                    setIsRespModalOpen(true);
                                  }}
                                  className="p-1 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
                                >
                                  <Edit2 className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={() => duplicateResponseScenario(resp.id)}
                                  className="p-1 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
                                >
                                  <Copy className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={() => setDeletingRespId(resp.id)}
                                  className="p-1 text-slate-400 hover:text-rose-600"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>

                            {/* Response Payload Preview / Editors */}
                            <Tabs.Root defaultValue="preview" className="space-y-2">
                              <Tabs.List className="flex border-b border-slate-200 dark:border-slate-800 gap-4 text-[11px] font-medium">
                                <Tabs.Trigger
                                  value="preview"
                                  className="pb-1 text-slate-500 data-[state=active]:text-indigo-600 data-[state=active]:font-semibold data-[state=active]:border-b"
                                >
                                  Preview Response
                                </Tabs.Trigger>
                                <Tabs.Trigger
                                  value="body"
                                  className="pb-1 text-slate-500 data-[state=active]:text-indigo-600 data-[state=active]:font-semibold data-[state=active]:border-b"
                                >
                                  Edit Body
                                </Tabs.Trigger>
                                <Tabs.Trigger
                                  value="headers"
                                  className="pb-1 text-slate-500 data-[state=active]:text-indigo-600 data-[state=active]:font-semibold data-[state=active]:border-b"
                                >
                                  Edit Headers
                                </Tabs.Trigger>
                              </Tabs.List>

                              <Tabs.Content value="preview">
                                <div className="p-3 bg-slate-950 text-slate-100 rounded-lg font-mono text-xs space-y-2">
                                  <div className="flex items-center justify-between pb-1.5 border-b border-slate-800 text-[10px] text-slate-400">
                                    <span>HTTP/1.1 {resp.statusCode}</span>
                                    <span>Simulated Delay: {resp.delayMs}ms</span>
                                  </div>
                                  <pre className="text-emerald-400 overflow-x-auto max-h-48 leading-relaxed">
                                    {JSON.stringify(resp.body ?? {}, null, 2)}
                                  </pre>
                                </div>
                              </Tabs.Content>

                              <Tabs.Content value="body">
                                <JsonEditor
                                  value={resp.body ?? {}}
                                  onChange={(val) => updateResponseScenario(resp.id, { body: val })}
                                  rows={6}
                                />
                              </Tabs.Content>

                              <Tabs.Content value="headers">
                                <KeyValueEditor
                                  title="Response Headers"
                                  value={resp.headers ?? {}}
                                  onChange={(val) => updateResponseScenario(resp.id, { headers: val })}
                                />
                              </Tabs.Content>
                            </Tabs.Root>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </Tabs.Content>

        {/* --- TAB 2: ENVIRONMENTS & OVERRIDES --- */}
        <Tabs.Content value="environments" className="focus:outline-none">
          <div className="p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl space-y-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                Environment Availability & Path Overrides
              </h3>
              <p className="text-xs text-slate-500">
                Enable or disable this API endpoint for specific environments or override its path.
              </p>
            </div>

            {projectEnvs.length === 0 ? (
              <p className="text-xs text-slate-500 italic">No environments configured for this project.</p>
            ) : (
              <div className="space-y-3">
                {environmentRows.map(({ env, isEnabled, pathOverride, resolvedUrl }) => {
                  return (
                    <div
                      key={env.id}
                      className="p-4 border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50/50 dark:bg-slate-950/50 space-y-3"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <EnvironmentTypeBadge type={env.environmentType} />
                          <span className="font-bold text-xs text-slate-900 dark:text-slate-100">
                            {env.name}
                          </span>
                        </div>

                        <StatusSwitch
                          checked={isEnabled}
                          onCheckedChange={(val) => handleToggleEnabled(env.id, val, pathOverride)}
                          label={isEnabled ? 'Enabled' : 'Disabled'}
                        />
                      </div>

                      {/* Path Override & Resolved URL */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                        <div>
                          <label className="block text-[10px] text-slate-500 uppercase font-semibold mb-1">
                            Path Override (Optional)
                          </label>
                          <input
                            type="text"
                            defaultValue={pathOverride}
                            onBlur={(e) => handleUpdatePathOverride(env.id, isEnabled, e.target.value)}
                            placeholder={api.path}
                            className="w-full px-3 py-1.5 font-mono bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-900 dark:text-slate-100 focus:outline-none focus:border-indigo-500"
                          />
                        </div>

                        <div>
                          <label className="block text-[10px] text-slate-500 uppercase font-semibold mb-1">
                            Final Resolved Mock URL
                          </label>
                          <div className="flex items-center gap-2">
                          <input
                            type="text"
                            readOnly
                            value={resolvedUrl}
                              className="w-full px-3 py-1.5 font-mono bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-indigo-600 dark:text-indigo-400 font-semibold focus:outline-none"
                            />
                            <button
                              type="button"
                              onClick={() => handleCopyResolvedUrl(resolvedUrl)}
                              className="px-2.5 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:bg-slate-100 rounded-lg shrink-0"
                            >
                              {copiedUrl === resolvedUrl ? (
                                <Check className="w-3.5 h-3.5 text-emerald-500" />
                              ) : (
                                <Copy className="w-3.5 h-3.5" />
                              )}
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </Tabs.Content>

        {/* --- TAB 3: OVERVIEW --- */}
        <Tabs.Content value="overview" className="focus:outline-none">
          <div className="p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl space-y-4 max-w-xl">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Endpoint Details
            </h3>
            <div className="space-y-2.5 text-xs font-mono">
              <div className="flex justify-between py-1.5 border-b border-slate-100 dark:border-slate-800">
                <span className="text-slate-400">Endpoint ID</span>
                <span className="text-slate-800 dark:text-slate-200">{api.id}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-100 dark:border-slate-800">
                <span className="text-slate-400">HTTP Method</span>
                <HttpMethodBadge method={api.methodRequest} size="sm" />
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-100 dark:border-slate-800">
                <span className="text-slate-400">Path</span>
                <span className="text-slate-800 dark:text-slate-200">{api.path}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-100 dark:border-slate-800">
                <span className="text-slate-400">Project</span>
                <span className="text-slate-800 dark:text-slate-200">{project.name}</span>
              </div>
            </div>
          </div>
        </Tabs.Content>
      </Tabs.Root>

      {/* Request Scenario Dialog */}
      <Dialog.Root open={isReqModalOpen} onOpenChange={setIsReqModalOpen}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs z-50" />
          <Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-2xl z-50 space-y-4 focus:outline-none">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <Dialog.Title className="text-base font-semibold text-slate-900 dark:text-slate-100">
                {editingReqScenario ? 'Edit Request Scenario' : 'Add Request Scenario'}
              </Dialog.Title>
              <button onClick={() => setIsReqModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveReqScenario} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Scenario Name *
                </label>
                <input
                  type="text"
                  name="name"
                  required
                  defaultValue={editingReqScenario?.name || ''}
                  placeholder="e.g. Existing Active User"
                  className="w-full px-3 py-1.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-900 dark:text-slate-100 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Description
                </label>
                <textarea
                  name="description"
                  rows={2}
                  defaultValue={editingReqScenario?.description || ''}
                  placeholder="Optional matching scenario notes..."
                  className="w-full px-3 py-1.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-900 dark:text-slate-100 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Match Type
                  </label>
                  <select
                    name="matchType"
                    defaultValue={editingReqScenario?.matchType || 'EXACT'}
                    className="w-full px-2.5 py-1.5 font-mono bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-900 dark:text-slate-100 focus:outline-none focus:border-indigo-500"
                  >
                    <option value="EXACT">EXACT</option>
                    <option value="PARTIAL">PARTIAL</option>
                    <option value="REGEX">REGEX</option>
                    <option value="JSON_SCHEMA">JSON_SCHEMA</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Priority Score
                  </label>
                  <input
                    type="number"
                    name="priority"
                    defaultValue={editingReqScenario?.priority ?? 100}
                    className="w-full px-3 py-1.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-900 dark:text-slate-100 focus:outline-none focus:border-indigo-500 font-mono"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between pt-2">
                <label className="font-semibold text-slate-700 dark:text-slate-300">Enabled Status</label>
                <input
                  type="checkbox"
                  name="status"
                  defaultChecked={editingReqScenario?.status ?? true}
                  className="w-4 h-4 text-indigo-600 rounded border-slate-300 dark:border-slate-700"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsReqModalOpen(false)}
                  className="px-3.5 py-1.5 font-medium text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 rounded-md"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded-md transition-colors"
                >
                  Save Scenario
                </button>
              </div>
            </form>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>

      {/* Response Scenario Dialog */}
      <Dialog.Root open={isRespModalOpen} onOpenChange={setIsRespModalOpen}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs z-50" />
          <Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-2xl z-50 space-y-4 focus:outline-none">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <Dialog.Title className="text-base font-semibold text-slate-900 dark:text-slate-100">
                {editingRespScenario ? 'Edit Response Scenario' : 'Add Response Scenario'}
              </Dialog.Title>
              <button onClick={() => setIsRespModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveRespScenario} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Response Name *
                </label>
                <input
                  type="text"
                  name="name"
                  required
                  defaultValue={editingRespScenario?.name || ''}
                  placeholder="e.g. 200 OK - User Found"
                  className="w-full px-3 py-1.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-900 dark:text-slate-100 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    HTTP Status Code
                  </label>
                  <select
                    name="statusCode"
                    defaultValue={editingRespScenario?.statusCode || 200}
                    className="w-full px-2.5 py-1.5 font-mono bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-900 dark:text-slate-100 focus:outline-none focus:border-indigo-500"
                  >
                    <option value={200}>200 OK</option>
                    <option value={201}>201 Created</option>
                    <option value={204}>204 No Content</option>
                    <option value={400}>400 Bad Request</option>
                    <option value={401}>401 Unauthorized</option>
                    <option value={403}>403 Forbidden</option>
                    <option value={404}>404 Not Found</option>
                    <option value={409}>409 Conflict</option>
                    <option value={422}>422 Unprocessable Entity</option>
                    <option value={429}>429 Too Many Requests</option>
                    <option value={500}>500 Internal Server Error</option>
                    <option value={503}>503 Service Unavailable</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Delay (ms)
                  </label>
                  <input
                    type="number"
                    name="delayMs"
                    defaultValue={editingRespScenario?.delayMs ?? 300}
                    placeholder="300"
                    className="w-full px-3 py-1.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-900 dark:text-slate-100 focus:outline-none focus:border-indigo-500 font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Weight (0 - 100)
                  </label>
                  <input
                    type="number"
                    name="weight"
                    defaultValue={editingRespScenario?.weight ?? 100}
                    className="w-full px-3 py-1.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-900 dark:text-slate-100 focus:outline-none focus:border-indigo-500 font-mono"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Priority
                  </label>
                  <input
                    type="number"
                    name="priority"
                    defaultValue={editingRespScenario?.priority ?? 100}
                    className="w-full px-3 py-1.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-900 dark:text-slate-100 focus:outline-none focus:border-indigo-500 font-mono"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between pt-2">
                <label className="font-semibold text-slate-700 dark:text-slate-300">Enabled Status</label>
                <input
                  type="checkbox"
                  name="status"
                  defaultChecked={editingRespScenario?.status ?? true}
                  className="w-4 h-4 text-indigo-600 rounded border-slate-300 dark:border-slate-700"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsRespModalOpen(false)}
                  className="px-3.5 py-1.5 font-medium text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 rounded-md"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded-md transition-colors"
                >
                  Save Response
                </button>
              </div>
            </form>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>

      {/* Delete Confirms */}
      <ConfirmDialog
        isOpen={!!deletingReqId}
        onClose={() => setDeletingReqId(null)}
        onConfirm={async () => {
          if (deletingReqId) await deleteRequestScenario(deletingReqId);
          setDeletingReqId(null);
        }}
        title="Delete Request Scenario?"
        description="Are you sure you want to delete this scenario and all attached response payloads?"
        variant="danger"
      />

      <ConfirmDialog
        isOpen={!!deletingRespId}
        onClose={() => setDeletingRespId(null)}
        onConfirm={async () => {
          if (deletingRespId) await deleteResponseScenario(deletingRespId);
          setDeletingRespId(null);
        }}
        title="Delete Response Scenario?"
        description="Are you sure you want to delete this mock response payload?"
        variant="danger"
      />
    </div>
  );
};

export default ApiDetailView;
