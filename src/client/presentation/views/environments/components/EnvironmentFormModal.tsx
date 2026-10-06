'use client';

import React from 'react';
import {
  X,
  Server,
  FolderGit2,
  Globe,
  Info,
  Layers,
  Sparkles,
  CheckCircle2,
  KeyRound,
} from 'lucide-react';
import {
  Environment,
  ALL_ENVIRONMENT_TYPES,
} from '@/src/client/domain/environment/entity/environment';
import { Project } from '@/src/client/domain/project/entity/project';
import { StatusSwitch } from '@/src/client/presentation/components/shared/StatusSwitch';
import { EnvironmentFormData } from '../hook/useEnvironments';
import { ENVIRONMENTS_SEMANTIC_ID, ENVIRONMENTS_TEXT } from '../constant';
import { useEnvironmentFormModal } from '../hook/useEnvironmentFormModal';

interface EnvironmentFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: EnvironmentFormData) => Promise<void>;
  editingEnvironment: Environment | null;
  projects: Project[];
  defaultProjectId?: string;
}

export const EnvironmentFormModal: React.FC<EnvironmentFormModalProps> = ({
  isOpen,
  onClose,
  onSave,
  editingEnvironment,
  projects,
  defaultProjectId,
}) => {
  const {
    name,
    setName,
    projectId,
    setProjectId,
    isBaseUrl,
    stageValues,
    status,
    setStatus,
    isSubmitting,
    handleStageValueChange,
    handleToggleIsBaseUrl,
    handleSubmit,
  } = useEnvironmentFormModal({
    isOpen,
    editingEnvironment,
    projects,
    defaultProjectId,
    onSave,
    onClose,
  });

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs overflow-y-auto">
      <div
        id={ENVIRONMENTS_SEMANTIC_ID.FORM_MODAL}
        className="relative w-full max-w-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl overflow-hidden my-8"
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-900">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-indigo-50 dark:bg-indigo-950/50 rounded-lg text-indigo-600 dark:text-indigo-400">
              <Server className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
                {editingEnvironment ? ENVIRONMENTS_TEXT.EDIT_BUTTON : ENVIRONMENTS_TEXT.CREATE_BUTTON}
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {ENVIRONMENTS_TEXT.MODAL_SUBTITLE}
              </p>
            </div>
          </div>
          <button
            id={ENVIRONMENTS_SEMANTIC_ID.FORM_CLOSE_BTN}
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Top Fields: Name, Project & Status */}
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-4">
            {/* Name */}
            <div className="sm:col-span-6">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                {isBaseUrl ? 'Service / Base URL Name' : 'Variable Name / Key'}{' '}
                <span className="text-rose-500">*</span>
              </label>
              <input
                id={ENVIRONMENTS_SEMANTIC_ID.FORM_NAME_INPUT}
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={isBaseUrl ? 'e.g. auth_service, api_gateway' : 'e.g. access_token, api_key'}
                className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 font-mono"
              />
            </div>

            {/* Project Select */}
            <div className="sm:col-span-4">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                {ENVIRONMENTS_TEXT.FORM.PROJECT_LABEL} <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <FolderGit2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <select
                  id={ENVIRONMENTS_SEMANTIC_ID.FORM_PROJECT_SELECT}
                  required
                  value={projectId}
                  onChange={(e) => setProjectId(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-sm bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-slate-900 dark:text-slate-100 cursor-pointer"
                >
                  <option value="" disabled>
                    {ENVIRONMENTS_TEXT.FORM.SELECT_PROJECT}
                  </option>
                  {projects.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Status Switch */}
            <div className="sm:col-span-2 flex flex-col justify-end">
              <div className="flex items-center justify-between px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg h-9.5">
                <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  {ENVIRONMENTS_TEXT.FORM.STATUS_LABEL}
                </span>
                <StatusSwitch
                  id={ENVIRONMENTS_SEMANTIC_ID.FORM_SWITCH_STATUS}
                  checked={status}
                  onCheckedChange={setStatus}
                />
              </div>
            </div>
          </div>

          {/* Environment Classification: Base URL Service vs Config Variables */}
          <div className="p-3 bg-slate-50/80 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800/80 rounded-xl space-y-2">
            <div className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
              <Layers className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
              <span>{ENVIRONMENTS_TEXT.MULTI_STAGE_SECTION_TITLE}</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button
                id={ENVIRONMENTS_SEMANTIC_ID.FORM_BASEURL_MODE_BTN}
                type="button"
                onClick={() => handleToggleIsBaseUrl(true)}
                className={`p-3 text-left rounded-lg border transition-all cursor-pointer flex items-start gap-2.5 ${
                  isBaseUrl
                    ? 'bg-white dark:bg-slate-900 border-indigo-600 dark:border-indigo-500 shadow-xs ring-2 ring-indigo-500/20 text-slate-900 dark:text-slate-100'
                    : 'bg-white/70 dark:bg-slate-900/40 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 text-slate-700 dark:text-slate-300'
                }`}
              >
                <div className={`p-1.5 rounded-md shrink-0 ${isBaseUrl ? 'bg-indigo-600 text-white' : 'bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400'}`}>
                  <Globe className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1">
                    <span>{ENVIRONMENTS_TEXT.FORM_BASE_URL_ENDPOINT_TITLE}</span>
                    {isBaseUrl && <CheckCircle2 className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />}
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 leading-snug">
                    {ENVIRONMENTS_TEXT.FORM_BASE_URL_ENDPOINT_DESC}
                  </p>
                </div>
              </button>

              <button
                id={ENVIRONMENTS_SEMANTIC_ID.FORM_VARS_MODE_BTN}
                type="button"
                onClick={() => handleToggleIsBaseUrl(false)}
                className={`p-3 text-left rounded-lg border transition-all cursor-pointer flex items-start gap-2.5 ${
                  !isBaseUrl
                    ? 'bg-white dark:bg-slate-900 border-amber-600 dark:border-amber-500 shadow-xs ring-2 ring-amber-500/20 text-slate-900 dark:text-slate-100'
                    : 'bg-white/70 dark:bg-slate-900/40 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 text-slate-700 dark:text-slate-300'
                }`}
              >
                <div className={`p-1.5 rounded-md shrink-0 ${!isBaseUrl ? 'bg-amber-600 text-white' : 'bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400'}`}>
                  <KeyRound className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1">
                    <span>{ENVIRONMENTS_TEXT.FORM_GENERAL_CONFIG_TITLE}</span>
                    {!isBaseUrl && <CheckCircle2 className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />}
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 leading-snug">
                    {ENVIRONMENTS_TEXT.FORM_GENERAL_CONFIG_DESC}
                  </p>
                </div>
              </button>
            </div>
          </div>

          {/* Section: Matrix Values Per Environment Stage */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <label className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                  <Globe className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                  <span>{ENVIRONMENTS_TEXT.FORM_MULTI_STAGE_MATRIX_TITLE}</span>
                </label>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  {isBaseUrl
                    ? ENVIRONMENTS_TEXT.FORM_MULTI_STAGE_MATRIX_DESC_BASE
                    : ENVIRONMENTS_TEXT.FORM_MULTI_STAGE_MATRIX_DESC_VARS}
                </p>
              </div>
            </div>

            <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden divide-y divide-slate-100 dark:divide-slate-800 bg-white dark:bg-slate-900/60">
              {ALL_ENVIRONMENT_TYPES.map((stage) => {
                const config = ENVIRONMENTS_TEXT.STAGE_CONFIG[stage];
                const isLocalBase = isBaseUrl && stage === 'LOCAL';

                return (
                  <div
                    key={stage}
                    className={`p-3 transition-colors ${
                      isLocalBase
                        ? 'bg-slate-50/70 dark:bg-slate-950/50'
                        : 'hover:bg-slate-50/40 dark:hover:bg-slate-850/40'
                    }`}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center gap-2 justify-between">
                      <div className="flex items-center gap-2 w-44 shrink-0">
                        <span
                          className={`px-2 py-0.5 text-[10px] font-bold font-mono rounded-md border ${config.badgeColor}`}
                        >
                          {config.label}
                        </span>
                        {isLocalBase && (
                          <span className="text-[10px] font-semibold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/50 px-1.5 py-0.5 rounded border border-emerald-200 dark:border-emerald-800">
                            {ENVIRONMENTS_TEXT.FORM_LOCAL_MOCK_AUTO_LABEL}
                          </span>
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        {isLocalBase ? (
                          <div className="relative">
                            <input
                              type="text"
                              disabled
                              value=""
                              placeholder={ENVIRONMENTS_TEXT.FORM_LOCAL_MOCK_PLACEHOLDER}
                              className="w-full px-3 py-1.5 text-xs font-mono bg-slate-100 dark:bg-slate-950/80 border border-dashed border-slate-300 dark:border-slate-800 rounded-lg text-slate-500 dark:text-slate-400 placeholder:text-slate-400 dark:placeholder:text-slate-600 cursor-not-allowed select-none"
                            />
                            <div className="absolute right-2.5 top-1/2 -translate-y-1/2 flex items-center gap-1 text-[11px]">
                              <Sparkles className="w-3.5 h-3.5 text-emerald-500" />
                              <span className="text-[10px] hidden sm:inline text-emerald-600 dark:text-emerald-400 font-medium">
                                {ENVIRONMENTS_TEXT.FORM_INTERNAL_PROXY_BADGE}
                              </span>
                            </div>
                          </div>
                        ) : (
                          <div className="relative">
                            <input
                              id={ENVIRONMENTS_SEMANTIC_ID.FORM_STAGE_INPUT(stage)}
                              type="text"
                              value={stageValues[stage] ?? ''}
                              onChange={(e) => handleStageValueChange(stage, e.target.value)}
                              placeholder={isBaseUrl ? config.placeholder : `Value for ${config.label} stage...`}
                              className="w-full px-3 py-1.5 text-xs font-mono bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-600"
                            />
                            {stageValues[stage] && (
                              <button
                                id={ENVIRONMENTS_SEMANTIC_ID.FORM_STAGE_CLEAR_BTN(stage)}
                                type="button"
                                onClick={() => handleStageValueChange(stage, '')}
                                className="absolute right-2 top-1/2 -translate-y-1/2 p-0.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 rounded cursor-pointer"
                                title={ENVIRONMENTS_TEXT.FORM_TOOLTIP_CLEAR}
                              >
                                <X className="w-3 h-3" />
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {isBaseUrl && (
              <div className="flex items-start gap-2 p-2.5 bg-blue-50/70 dark:bg-blue-950/30 border border-blue-200/70 dark:border-blue-900/50 rounded-lg text-xs text-blue-800 dark:text-blue-300">
                <Info className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
                <p className="text-[11px] leading-relaxed">
                  <strong>{ENVIRONMENTS_TEXT.FORM_BASE_URL_PATTERN_STRONG}</strong> {ENVIRONMENTS_TEXT.FORM_BASE_URL_PATTERN_DESC}
                </p>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/40 dark:bg-slate-900/90 -mx-6 -mb-6 px-6 py-4">
            <button
              id={ENVIRONMENTS_SEMANTIC_ID.FORM_CANCEL_BTN}
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
            >
              {ENVIRONMENTS_TEXT.FORM.CANCEL}
            </button>
            <button
              id={ENVIRONMENTS_SEMANTIC_ID.FORM_SUBMIT_BTN}
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600 rounded-lg shadow-sm transition-colors cursor-pointer disabled:opacity-50"
            >
              {isSubmitting ? ENVIRONMENTS_TEXT.BTN_SAVING : ENVIRONMENTS_TEXT.FORM.SAVE}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
