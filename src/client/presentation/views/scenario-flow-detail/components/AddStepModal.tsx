'use client';

import React from 'react';
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
  List,
  FileUp,
} from 'lucide-react';
import {
  ScenarioFlowStep,
  VariableExtractor,
  AssertionRule,
} from '@/src/client/domain/scenario-flow/entity/scenario_flow';
import { RequestBodyType } from '@/src/core/utils/types';
import { ApiCollection } from '@/src/client/domain/api/entity/api_collection';
import { Project } from '@/src/client/domain/project/entity/project';
import { Environment } from '@/src/client/domain/environment/entity/environment';
import { ApiSearchSelect } from '@/src/client/presentation/components/shared/ApiSearchSelect';
import { DataSheetVariablePicker } from '@/src/client/presentation/components/shared/DataSheetVariablePicker';
import { EnvironmentVariablePicker } from '@/src/client/presentation/components/shared/EnvironmentVariablePicker';
import {
  SCENARIO_FLOW_DETAIL_SEMANTIC_ID,
  SCENARIO_FLOW_DETAIL_TEXT,
} from '../constant';
import { useAddStepModal, FormFieldItem, jsonToFormFields, formFieldsToJson } from '../hook';

export type { FormFieldItem };
export { jsonToFormFields, formFieldsToJson };

export interface AddStepModalProps {
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

export const AddStepModal: React.FC<AddStepModalProps> = (props) => {
  const {
    isOpen,
    onClose,
    editingStep,
    projectApis,
    projects = [],
    projectId,
  } = props;

  const {
    activeTab,
    setActiveTab,
    filterProjectId,
    setFilterProjectId,
    name,
    setName,
    delayMs,
    setDelayMs,
    continueOnError,
    setContinueOnError,
    selectedApiId,
    selectedScenarioId,
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
    setFocusedFieldId,
    extractors,
    assertions,
    availableScenarios,
    isLoadingScenarios,
    isSubmitting,
    error,
    lastFocusedField,
    setLastFocusedField,
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
  } = useAddStepModal(props);

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
                  {editingStep
                    ? SCENARIO_FLOW_DETAIL_TEXT.MODAL_STEP_TITLE_EDIT
                    : SCENARIO_FLOW_DETAIL_TEXT.MODAL_STEP_TITLE_CREATE}
                </Dialog.Title>
                <Dialog.Description className="text-xs text-slate-500 dark:text-slate-400">
                  {SCENARIO_FLOW_DETAIL_TEXT.MODAL_STEP_SUBTITLE}
                </Dialog.Description>
              </div>
            </div>
            <button
              id={SCENARIO_FLOW_DETAIL_SEMANTIC_ID.MODAL_ADD_STEP_BTN_CLOSE}
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
                  id={SCENARIO_FLOW_DETAIL_SEMANTIC_ID.MODAL_ADD_STEP_TAB_BASIC}
                  value="basic"
                  className={`pb-2 text-xs font-semibold flex items-center gap-1.5 border-b-2 transition-colors ${
                    activeTab === 'basic'
                      ? 'border-purple-600 text-purple-600 dark:text-purple-400'
                      : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-slate-200'
                  }`}
                >
                  <Settings className="w-3.5 h-3.5" /> {SCENARIO_FLOW_DETAIL_TEXT.TAB_BASIC_API}
                </Tabs.Trigger>
                <Tabs.Trigger
                  id={SCENARIO_FLOW_DETAIL_SEMANTIC_ID.MODAL_ADD_STEP_TAB_PAYLOAD}
                  value="payload"
                  className={`pb-2 text-xs font-semibold flex items-center gap-1.5 border-b-2 transition-colors ${
                    activeTab === 'payload'
                      ? 'border-purple-600 text-purple-600 dark:text-purple-400'
                      : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-slate-200'
                  }`}
                >
                  <Code2 className="w-3.5 h-3.5" /> {SCENARIO_FLOW_DETAIL_TEXT.TAB_OVERRIDES_BODY}
                </Tabs.Trigger>
                <Tabs.Trigger
                  id={SCENARIO_FLOW_DETAIL_SEMANTIC_ID.MODAL_ADD_STEP_TAB_EXTRACTORS}
                  value="extractors"
                  className={`pb-2 text-xs font-semibold flex items-center gap-1.5 border-b-2 transition-colors ${
                    activeTab === 'extractors'
                      ? 'border-purple-600 text-purple-600 dark:text-purple-400'
                      : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-slate-200'
                  }`}
                >
                  <Key className="w-3.5 h-3.5" /> {SCENARIO_FLOW_DETAIL_TEXT.TAB_EXTRACTORS(extractors.length)}
                </Tabs.Trigger>
                <Tabs.Trigger
                  id={SCENARIO_FLOW_DETAIL_SEMANTIC_ID.MODAL_ADD_STEP_TAB_ASSERTIONS}
                  value="assertions"
                  className={`pb-2 text-xs font-semibold flex items-center gap-1.5 border-b-2 transition-colors ${
                    activeTab === 'assertions'
                      ? 'border-purple-600 text-purple-600 dark:text-purple-400'
                      : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-slate-200'
                  }`}
                >
                  <ShieldCheck className="w-3.5 h-3.5" /> {SCENARIO_FLOW_DETAIL_TEXT.TAB_ASSERTIONS(assertions.length)}
                </Tabs.Trigger>
              </Tabs.List>

              {/* Tab: Basic & API */}
              <Tabs.Content value="basic" className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    {SCENARIO_FLOW_DETAIL_TEXT.FIELD_STEP_NAME} <span className="text-rose-500">*</span>
                  </label>
                  <input
                    id={SCENARIO_FLOW_DETAIL_SEMANTIC_ID.MODAL_ADD_STEP_INPUT_NAME}
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder={SCENARIO_FLOW_DETAIL_TEXT.FIELD_STEP_NAME_PLACEHOLDER}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-purple-500/30"
                  />
                </div>

                {/* Project Filter and API Selector */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                      {SCENARIO_FLOW_DETAIL_TEXT.FIELD_SELECT_API}
                    </label>
                    {projects.length > 1 && (
                      <div className="flex items-center gap-1.5">
                        <span className="text-[11px] text-slate-500">{SCENARIO_FLOW_DETAIL_TEXT.FIELD_PROJECT_LABEL}</span>
                        <select
                          id={SCENARIO_FLOW_DETAIL_SEMANTIC_ID.MODAL_ADD_STEP_SELECT_PROJECT}
                          value={filterProjectId}
                          onChange={(e) => setFilterProjectId(e.target.value)}
                          className="px-2 py-0.5 text-[11px] rounded-md border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-200 focus:outline-hidden focus:ring-1 focus:ring-purple-500"
                        >
                          <option value="ALL">{SCENARIO_FLOW_DETAIL_TEXT.FIELD_ALL_PROJECTS(projectApis.length)}</option>
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
                          {SCENARIO_FLOW_DETAIL_TEXT.FIELD_REQUEST_SCENARIO_PRESET}
                        </label>
                        {isLoadingScenarios && (
                          <span className="text-[10px] text-purple-500 animate-pulse">
                            {SCENARIO_FLOW_DETAIL_TEXT.FIELD_LOADING_SCENARIOS}
                          </span>
                        )}
                      </div>
                      <select
                        id={SCENARIO_FLOW_DETAIL_SEMANTIC_ID.MODAL_ADD_STEP_SELECT_SCENARIO}
                        value={selectedScenarioId}
                        onChange={(e) => handleScenarioChange(e.target.value)}
                        className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-200 focus:outline-hidden focus:ring-1 focus:ring-purple-500"
                      >
                        <option value="">{SCENARIO_FLOW_DETAIL_TEXT.FIELD_CUSTOM_SCENARIO_OPTION}</option>
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
                      {SCENARIO_FLOW_DETAIL_TEXT.FIELD_METHOD}
                    </label>
                    <select
                      id={SCENARIO_FLOW_DETAIL_SEMANTIC_ID.MODAL_ADD_STEP_INPUT_METHOD}
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
                        {SCENARIO_FLOW_DETAIL_TEXT.FIELD_PATH}{' '}
                        <span className="text-slate-400 font-normal">
                          {SCENARIO_FLOW_DETAIL_TEXT.FIELD_PATH_HINT}
                        </span>
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
                      id={SCENARIO_FLOW_DETAIL_SEMANTIC_ID.MODAL_ADD_STEP_INPUT_PATH}
                      type="text"
                      value={pathOverride}
                      onFocus={() => setLastFocusedField('path')}
                      onChange={(e) => setPathOverride(e.target.value)}
                      placeholder={SCENARIO_FLOW_DETAIL_TEXT.FIELD_PATH_PLACEHOLDER}
                      className="w-full px-3 py-2 text-xs font-mono rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white"
                    />
                  </div>
                </div>

                {/* Target Environment: Default (Global Header) vs Local */}
                <div className="space-y-1.5 pt-1">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center justify-between">
                    <span className="flex items-center gap-1.5">
                      <Server className="w-3.5 h-3.5 text-purple-500" />
                      {SCENARIO_FLOW_DETAIL_TEXT.TARGET_ENV_BASE_URL_LABEL}
                    </span>
                    <span className="text-[10px] font-normal text-slate-400">
                      {targetEnvironmentType === 'LOCAL'
                        ? SCENARIO_FLOW_DETAIL_TEXT.TARGET_ENV_DESC_LOCAL
                        : SCENARIO_FLOW_DETAIL_TEXT.TARGET_ENV_DESC_DEFAULT}
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
                      <span>{SCENARIO_FLOW_DETAIL_TEXT.TARGET_ENV_BTN_DEFAULT}</span>
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
                      <span>{SCENARIO_FLOW_DETAIL_TEXT.TARGET_ENV_BTN_LOCAL}</span>
                    </button>
                  </div>

                  {/* Service Environment Preset Dropdown when Default is active */}
                  {targetEnvironmentType === 'DEFAULT' && serviceEnvironmentGroups.length > 0 && (
                    <div className="pt-2 space-y-1.5 animate-in fade-in slide-in-from-top-1">
                      <div className="flex items-center justify-between">
                        <label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300">
                          {SCENARIO_FLOW_DETAIL_TEXT.TARGET_ENV_SERVICE_LABEL}
                        </label>
                        <span className="text-[10px] text-slate-400 font-normal">
                          {SCENARIO_FLOW_DETAIL_TEXT.TARGET_ENV_SERVICE_HINT}
                        </span>
                      </div>
                      <select
                        value={targetEnvironment}
                        onChange={(e) => setTargetEnvironment(e.target.value)}
                        className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-purple-500/30 font-medium"
                      >
                        <option value="">{SCENARIO_FLOW_DETAIL_TEXT.TARGET_ENV_SERVICE_AUTO}</option>
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
                            {SCENARIO_FLOW_DETAIL_TEXT.TARGET_ENV_SERVICE_REGISTERED_FOR(selectedServiceGroup.label)}
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
                                {SCENARIO_FLOW_DETAIL_TEXT.TARGET_ENV_SERVICE_NO_STAGE}
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
                      {SCENARIO_FLOW_DETAIL_TEXT.FIELD_DELAY_MS}
                    </label>
                    <input
                      id={SCENARIO_FLOW_DETAIL_SEMANTIC_ID.MODAL_ADD_STEP_INPUT_DELAY}
                      type="number"
                      min={0}
                      value={delayMs}
                      onChange={(e) => setDelayMs(Number(e.target.value))}
                      placeholder={SCENARIO_FLOW_DETAIL_TEXT.FIELD_DELAY_MS_PLACEHOLDER}
                      className="w-full px-3 py-2 text-xs font-mono rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white"
                    />
                  </div>

                  <div className="flex items-center justify-between p-2.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950">
                    <div>
                      <span className="text-xs font-semibold text-slate-900 dark:text-white block">
                        {SCENARIO_FLOW_DETAIL_TEXT.FIELD_CONTINUE_ON_ERROR}
                      </span>
                      <span className="text-[10px] text-slate-500">
                        {SCENARIO_FLOW_DETAIL_TEXT.FIELD_CONTINUE_ON_ERROR_DESC}
                      </span>
                    </div>
                    <Switch.Root
                      id={SCENARIO_FLOW_DETAIL_SEMANTIC_ID.MODAL_ADD_STEP_SWITCH_CONTINUE}
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
                      {SCENARIO_FLOW_DETAIL_TEXT.TOKEN_HELPER_TITLE}
                    </span>
                    <span className="text-[10px] text-slate-500 dark:text-slate-400">
                      {SCENARIO_FLOW_DETAIL_TEXT.TOKEN_HELPER_DESC(lastFocusedField)}
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
                      {SCENARIO_FLOW_DETAIL_TEXT.FIELD_HEADERS_OVERRIDE}
                    </label>
                    <span className="text-[11px] text-slate-400 font-mono">
                      {SCENARIO_FLOW_DETAIL_TEXT.FIELD_HEADERS_OVERRIDE_HINT}
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
                    {SCENARIO_FLOW_DETAIL_TEXT.FIELD_QUERY_PARAMS_OVERRIDE}
                  </label>
                  <textarea
                    rows={2}
                    value={queryParamsJson}
                    onFocus={() => setLastFocusedField('queryParams')}
                    onChange={(e) => setQueryParamsJson(e.target.value)}
                    className="w-full px-3 py-2 text-xs font-mono rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-950 text-slate-200"
                  />
                </div>

                <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                      <Layers className="w-3.5 h-3.5 text-purple-500" />
                      <span>{SCENARIO_FLOW_DETAIL_TEXT.FIELD_BODY_CONTENT_TYPE}</span>
                    </label>
                    <select
                      value={bodyType}
                      onChange={(e) => {
                        const newType = e.target.value as RequestBodyType;
                        setBodyType(newType);
                        if (newType === 'FORM_DATA' || newType === 'URL_ENCODED') {
                          setBodyInputMode('fields');
                          if (formFields.length === 0 && bodyJson && bodyJson !== '{}') {
                            // Using imported jsonToFormFields
                          }
                        }
                      }}
                      className="px-2.5 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white font-medium focus:outline-hidden focus:ring-1 focus:ring-purple-500 cursor-pointer"
                    >
                      <option value="JSON">{SCENARIO_FLOW_DETAIL_TEXT.BODY_TYPE_JSON}</option>
                      <option value="FORM_DATA">{SCENARIO_FLOW_DETAIL_TEXT.BODY_TYPE_FORM_DATA}</option>
                      <option value="URL_ENCODED">{SCENARIO_FLOW_DETAIL_TEXT.BODY_TYPE_URL_ENCODED}</option>
                      <option value="NONE">{SCENARIO_FLOW_DETAIL_TEXT.BODY_TYPE_NONE}</option>
                    </select>
                  </div>

                  {bodyType === 'NONE' ? (
                    <div className="py-6 text-center text-xs text-slate-400 italic bg-slate-50 dark:bg-slate-950/40 rounded-xl border border-dashed border-slate-200 dark:border-slate-800">
                      {SCENARIO_FLOW_DETAIL_TEXT.BODY_NONE_DESC}
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {/* Sub-header / Mode Switcher */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => {
                              setBodyInputMode('fields');
                            }}
                            className={`px-2.5 py-1 text-xs rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
                              bodyInputMode === 'fields'
                                ? 'bg-purple-100 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 ring-1 ring-purple-500/30 font-bold'
                                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                            }`}
                          >
                            <List className="w-3.5 h-3.5" />
                            <span>{SCENARIO_FLOW_DETAIL_TEXT.BODY_MODE_FORM_FIELDS(formFields.length)}</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setBodyInputMode('raw');
                            }}
                            className={`px-2.5 py-1 text-xs rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
                              bodyInputMode === 'raw'
                                ? 'bg-purple-100 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 ring-1 ring-purple-500/30 font-bold'
                                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                            }`}
                          >
                            <Code2 className="w-3.5 h-3.5" />
                            <span>{SCENARIO_FLOW_DETAIL_TEXT.BODY_MODE_RAW_JSON}</span>
                          </button>
                        </div>

                        {bodyInputMode === 'fields' ? (
                          <button
                            id={SCENARIO_FLOW_DETAIL_SEMANTIC_ID.MODAL_ADD_STEP_BTN_ADD_FIELD}
                            type="button"
                            onClick={handleAddFormField}
                            className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-950/40 rounded-lg hover:bg-purple-100 dark:hover:bg-purple-900/50 transition-colors cursor-pointer"
                          >
                            <Plus className="w-3.5 h-3.5" /> {SCENARIO_FLOW_DETAIL_TEXT.BTN_ADD_FIELD}
                          </button>
                        ) : (
                          <span className="text-[11px] text-purple-600 dark:text-purple-400 font-mono">
                            {SCENARIO_FLOW_DETAIL_TEXT.BODY_RAW_HINT}
                          </span>
                        )}
                      </div>

                      {/* Content based on bodyInputMode */}
                      {bodyInputMode === 'fields' ? (
                        formFields.length === 0 ? (
                          <div className="py-6 text-center text-xs text-slate-400 italic bg-slate-50 dark:bg-slate-950/40 rounded-xl border border-dashed border-slate-200 dark:border-slate-800 space-y-2">
                            <p>
                              {SCENARIO_FLOW_DETAIL_TEXT.NO_FORM_FIELDS_DESC(
                                bodyType === 'FORM_DATA'
                                  ? 'Form Data'
                                  : bodyType === 'URL_ENCODED'
                                  ? 'URL-Encoded'
                                  : 'JSON'
                              )}
                            </p>
                            <button
                              type="button"
                              onClick={handleAddFormField}
                              className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-950/60 rounded-lg hover:bg-purple-100 dark:hover:bg-purple-900/50 cursor-pointer"
                            >
                              <Plus className="w-3.5 h-3.5" /> {SCENARIO_FLOW_DETAIL_TEXT.BTN_ADD_FIRST_FIELD}
                            </button>
                          </div>
                        ) : (
                          <div className="space-y-2 max-h-72 overflow-y-auto p-0.5">
                            {formFields.map((field) => (
                              <div
                                key={field.id}
                                className={`flex items-center gap-2 p-2 rounded-xl border transition-all ${
                                  field.enabled
                                    ? 'bg-slate-50/80 dark:bg-slate-950 border-slate-200 dark:border-slate-800'
                                    : 'bg-slate-100/50 dark:bg-slate-900/30 border-slate-200/50 dark:border-slate-800/50 opacity-60'
                                }`}
                              >
                                <Switch.Root
                                  checked={field.enabled}
                                  onCheckedChange={(checked) =>
                                    handleUpdateFormField(field.id, { enabled: checked })
                                  }
                                  className="w-7 h-3.5 bg-slate-300 dark:bg-slate-700 rounded-full relative data-[state=checked]:bg-purple-600 outline-hidden transition-colors shrink-0"
                                >
                                  <Switch.Thumb className="block w-3 h-3 bg-white rounded-full transition-transform duration-100 translate-x-0.5 data-[state=checked]:translate-x-3.5" />
                                </Switch.Root>

                                <input
                                  type="text"
                                  placeholder={SCENARIO_FLOW_DETAIL_TEXT.FIELD_KEY_PLACEHOLDER}
                                  value={field.key}
                                  onFocus={() => {
                                    setLastFocusedField('body');
                                    setFocusedFieldId(field.id);
                                  }}
                                  onChange={(e) =>
                                    handleUpdateFormField(field.id, { key: e.target.value })
                                  }
                                  className="w-1/3 min-w-24 px-2.5 py-1.5 text-xs font-mono rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-hidden focus:ring-1 focus:ring-purple-500"
                                />

                                <div className="flex-1 flex items-center gap-1.5 relative">
                                  <input
                                    type="text"
                                    placeholder={
                                      field.isFile
                                        ? SCENARIO_FLOW_DETAIL_TEXT.FIELD_VALUE_FILE_PLACEHOLDER
                                        : SCENARIO_FLOW_DETAIL_TEXT.FIELD_VALUE_PLACEHOLDER
                                    }
                                    value={field.value}
                                    onFocus={() => {
                                      setLastFocusedField('body');
                                      setFocusedFieldId(field.id);
                                    }}
                                    onChange={(e) =>
                                      handleUpdateFormField(field.id, { value: e.target.value })
                                    }
                                    className={`w-full px-2.5 py-1.5 text-xs font-mono rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-hidden focus:ring-1 focus:ring-purple-500 ${
                                      field.isFile ? 'text-indigo-600 dark:text-indigo-400 font-semibold' : ''
                                    }`}
                                  />
                                  <div className="flex items-center gap-1 shrink-0">
                                    <EnvironmentVariablePicker
                                      buttonLabel="Env"
                                      triggerClassName="text-[10px] py-0.5 px-1.5"
                                      projectId={projectId}
                                      onInsert={(token) => handleInsertTokenToField(field.id, token)}
                                    />
                                    <DataSheetVariablePicker
                                      buttonLabel="Sheet"
                                      triggerClassName="text-[10px] py-0.5 px-1.5"
                                      projectId={projectId}
                                      onInsert={(token) => handleInsertTokenToField(field.id, token)}
                                    />
                                  </div>
                                </div>

                                {bodyType === 'FORM_DATA' && (
                                  <label
                                    title="Mark this field as a file upload (multipart binary blob simulation)"
                                    className={`flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] font-semibold transition-colors cursor-pointer shrink-0 ${
                                      field.isFile
                                        ? 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/30 font-bold'
                                        : 'bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                                    }`}
                                  >
                                    <input
                                      type="checkbox"
                                      checked={!!field.isFile}
                                      onChange={(e) =>
                                        handleUpdateFormField(field.id, { isFile: e.target.checked })
                                      }
                                      className="sr-only"
                                    />
                                    <FileUp className="w-3 h-3" />
                                    <span>{SCENARIO_FLOW_DETAIL_TEXT.FIELD_FILE_LABEL}</span>
                                  </label>
                                )}

                                <button
                                  type="button"
                                  onClick={() => handleRemoveFormField(field.id)}
                                  className="p-1.5 text-slate-400 hover:text-rose-500 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer shrink-0"
                                  title="Delete Field"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            ))}
                          </div>
                        )
                      ) : (
                        <textarea
                          rows={6}
                          value={bodyJson}
                          onFocus={() => setLastFocusedField('body')}
                          onChange={(e) => {
                            setBodyJson(e.target.value);
                          }}
                          placeholder={
                            bodyType === 'FORM_DATA'
                              ? '{\n  "file": { "filename": "avatar.png" },\n  "description": "User profile avatar"\n}'
                              : bodyType === 'URL_ENCODED'
                              ? '{\n  "username": "user123",\n  "grant_type": "password"\n}'
                              : '{\n  "name": "Sample",\n  "isActive": true\n}'
                          }
                          className="w-full px-3 py-2 text-xs font-mono rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-950 text-slate-200"
                        />
                      )}
                    </div>
                  )}
                </div>
              </Tabs.Content>

              {/* Tab: Variable Extractors */}
              <Tabs.Content value="extractors" className="space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-xs text-slate-500">
                    {SCENARIO_FLOW_DETAIL_TEXT.EXTRACTORS_DESC}
                  </p>
                  <button
                    id={SCENARIO_FLOW_DETAIL_SEMANTIC_ID.MODAL_ADD_STEP_BTN_ADD_EXTRACTOR}
                    type="button"
                    onClick={addExtractor}
                    className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-950/40 rounded-lg hover:bg-purple-100 dark:hover:bg-purple-900/50"
                  >
                    <Plus className="w-3.5 h-3.5" /> {SCENARIO_FLOW_DETAIL_TEXT.BTN_ADD_EXTRACTOR}
                  </button>
                </div>

                {extractors.length === 0 ? (
                  <p className="text-xs text-slate-400 italic py-6 text-center border border-dashed border-slate-200 dark:border-slate-800 rounded-xl">
                    {SCENARIO_FLOW_DETAIL_TEXT.EXTRACTORS_EMPTY}
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
                          placeholder={SCENARIO_FLOW_DETAIL_TEXT.EXTRACTOR_VAR_PLACEHOLDER}
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
                          placeholder={SCENARIO_FLOW_DETAIL_TEXT.EXTRACTOR_PATH_PLACEHOLDER}
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
                    {SCENARIO_FLOW_DETAIL_TEXT.ASSERTIONS_DESC}
                  </p>
                  <button
                    id={SCENARIO_FLOW_DETAIL_SEMANTIC_ID.MODAL_ADD_STEP_BTN_ADD_ASSERTION}
                    type="button"
                    onClick={addAssertion}
                    className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/40 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/50"
                  >
                    <Plus className="w-3.5 h-3.5" /> {SCENARIO_FLOW_DETAIL_TEXT.BTN_ADD_ASSERTION}
                  </button>
                </div>

                {assertions.length === 0 ? (
                  <p className="text-xs text-slate-400 italic py-6 text-center border border-dashed border-slate-200 dark:border-slate-800 rounded-xl">
                    {SCENARIO_FLOW_DETAIL_TEXT.ASSERTIONS_EMPTY}
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
                    id={SCENARIO_FLOW_DETAIL_SEMANTIC_ID.MODAL_ADD_STEP_BTN_EDIT_API_DETAIL}
                    type="button"
                    onClick={handleOpenApiDetail}
                    className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 hover:border-emerald-500/50 rounded-lg transition-all cursor-pointer shadow-2xs"
                    title={SCENARIO_FLOW_DETAIL_TEXT.BTN_EDIT_REQ_RES_SCENARIO_TOOLTIP}
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span>{SCENARIO_FLOW_DETAIL_TEXT.BTN_EDIT_REQ_RES_SCENARIO}</span>
                  </button>
                )}
              </div>

              {/* Right: Cancel & Submit buttons */}
              <div className="flex items-center gap-2.5">
                <button
                  id={SCENARIO_FLOW_DETAIL_SEMANTIC_ID.MODAL_ADD_STEP_BTN_CANCEL}
                  type="button"
                  onClick={onClose}
                  disabled={isSubmitting}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                >
                  {SCENARIO_FLOW_DETAIL_TEXT.BTN_CANCEL}
                </button>
                <button
                  id={SCENARIO_FLOW_DETAIL_SEMANTIC_ID.MODAL_ADD_STEP_BTN_SUBMIT}
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 text-xs font-semibold text-white bg-purple-600 hover:bg-purple-500 active:bg-purple-700 rounded-lg shadow-sm shadow-purple-500/20 disabled:opacity-50 transition-all cursor-pointer"
                >
                  {isSubmitting
                    ? SCENARIO_FLOW_DETAIL_TEXT.BTN_SAVING_STEP
                    : editingStep
                    ? SCENARIO_FLOW_DETAIL_TEXT.BTN_UPDATE_STEP
                    : SCENARIO_FLOW_DETAIL_TEXT.BTN_ADD_STEP}
                </button>
              </div>
            </div>
          </form>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
};
