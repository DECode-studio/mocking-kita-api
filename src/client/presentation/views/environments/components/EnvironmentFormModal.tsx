import React from 'react';
import {
  X,
  Server,
  FolderGit2,
  Plus,
  Trash2,
  Eye,
  EyeOff,
  KeyRound,
  Shield,
  Globe,
  Lock,
  User,
  Info,
  Layers,
  Sparkles,
  CheckCircle2,
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
    variables,
    showVariablesSection,
    setShowVariablesSection,
    isSubmitting,
    handleStageValueChange,
    handleToggleIsBaseUrl,
    handleAddVariable,
    handleUpdateVariable,
    handleRemoveVariable,
    handleToggleShowValue,
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
        className="relative w-full max-w-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl overflow-hidden my-8"
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
                {ENVIRONMENTS_TEXT.FORM.NAME_LABEL} <span className="text-rose-500">*</span>
              </label>
              <input
                id={ENVIRONMENTS_SEMANTIC_ID.FORM_NAME_INPUT}
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={ENVIRONMENTS_TEXT.FORM.NAME_PLACEHOLDER}
                className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500"
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
                              placeholder={config.placeholder}
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

          {/* Section: Additional Custom Variables (Optional) */}
          <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
            <div className="flex items-center justify-between mb-2">
              <button
                id={ENVIRONMENTS_SEMANTIC_ID.FORM_TOGGLE_VARS_SECTION_BTN}
                type="button"
                onClick={() => setShowVariablesSection(!showVariablesSection)}
                className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5 hover:text-indigo-600 dark:hover:text-indigo-400 cursor-pointer"
              >
                <KeyRound className="w-3.5 h-3.5 text-indigo-500" />
                <span>{ENVIRONMENTS_TEXT.FORM_CUSTOM_VARS_TITLE(variables.length)}</span>
                <span className="text-[10px] text-slate-400 font-normal">
                  {showVariablesSection ? ENVIRONMENTS_TEXT.FORM_CLICK_TO_HIDE : ENVIRONMENTS_TEXT.FORM_CLICK_TO_SHOW}
                </span>
              </button>

              {showVariablesSection && (
                <div className="flex items-center flex-wrap gap-1.5">
                  <button
                    id={ENVIRONMENTS_SEMANTIC_ID.FORM_PRESET_APIKEY_BTN}
                    type="button"
                    onClick={() => handleAddVariable('apiKey', '', 'secret', 'API key credential')}
                    className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-medium text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 hover:bg-amber-100 rounded border border-amber-200 dark:border-amber-800 cursor-pointer"
                  >
                    <KeyRound className="w-2.5 h-2.5" />
                    <span>{ENVIRONMENTS_TEXT.FORM_PRESET_API_KEY}</span>
                  </button>
                  <button
                    id={ENVIRONMENTS_SEMANTIC_ID.FORM_PRESET_BEARER_BTN}
                    type="button"
                    onClick={() => handleAddVariable('bearerToken', '', 'secret', 'Bearer token')}
                    className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-medium text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 hover:bg-emerald-100 rounded border border-emerald-200 dark:border-emerald-800 cursor-pointer"
                  >
                    <Shield className="w-2.5 h-2.5" />
                    <span>{ENVIRONMENTS_TEXT.FORM_PRESET_BEARER}</span>
                  </button>
                  <button
                    id={ENVIRONMENTS_SEMANTIC_ID.FORM_PRESET_BASICAUTH_BTN}
                    type="button"
                    onClick={() => {
                      handleAddVariable('username', '', 'plain', 'Auth username');
                      handleAddVariable('password', '', 'secret', 'Auth password');
                    }}
                    className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-medium text-purple-700 dark:text-purple-400 bg-purple-50 dark:bg-purple-950/40 hover:bg-purple-100 rounded border border-purple-200 dark:border-purple-800 cursor-pointer"
                  >
                    <User className="w-2.5 h-2.5" />
                    <span>{ENVIRONMENTS_TEXT.FORM_PRESET_BASIC_AUTH}</span>
                  </button>
                </div>
              )}
            </div>

            {showVariablesSection && (
              <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden bg-slate-50/40 dark:bg-slate-950/40">
                <div className="grid grid-cols-12 gap-2 px-3 py-1.5 bg-slate-100/80 dark:bg-slate-800/80 text-[11px] font-bold text-slate-700 dark:text-slate-300 border-b border-slate-200 dark:border-slate-700">
                  <div className="col-span-1 text-center">{ENVIRONMENTS_TEXT.FORM_COL_USE}</div>
                  <div className="col-span-4">{ENVIRONMENTS_TEXT.TABLE_COL_KEY}</div>
                  <div className="col-span-5">{ENVIRONMENTS_TEXT.TABLE_COL_VALUE}</div>
                  <div className="col-span-2 text-right pr-2">{ENVIRONMENTS_TEXT.TABLE_COL_ACTIONS}</div>
                </div>

                <div className="max-h-48 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800">
                  {variables.length === 0 ? (
                    <div className="py-5 text-center text-xs text-slate-500 dark:text-slate-400">
                      <p>{ENVIRONMENTS_TEXT.FORM.NO_VARIABLES}</p>
                    </div>
                  ) : (
                    variables.map((item) => (
                      <div
                        key={item.id}
                        className={`grid grid-cols-12 gap-2 items-center px-3 py-1.5 text-xs transition-colors ${
                          item.enabled ? 'bg-white dark:bg-slate-900/60' : 'bg-slate-50/70 dark:bg-slate-950/50 opacity-60'
                        }`}
                      >
                        <div className="col-span-1 flex justify-center">
                          <input
                            id={ENVIRONMENTS_SEMANTIC_ID.FORM_VAR_TOGGLE_BTN(item.id)}
                            type="checkbox"
                            checked={item.enabled}
                            onChange={(e) => handleUpdateVariable(item.id, { enabled: e.target.checked })}
                            className="w-3.5 h-3.5 rounded text-indigo-600 focus:ring-indigo-500 border-slate-300 dark:border-slate-600 cursor-pointer"
                          />
                        </div>

                        <div className="col-span-4">
                          <input
                            id={ENVIRONMENTS_SEMANTIC_ID.FORM_VAR_KEY_INPUT(item.id)}
                            type="text"
                            value={item.key}
                            onChange={(e) => handleUpdateVariable(item.id, { key: e.target.value })}
                            placeholder="e.g. clientSecret, appId"
                            className="w-full px-2 py-1 font-mono text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded focus:outline-hidden focus:ring-1 focus:ring-indigo-500 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-600"
                          />
                        </div>

                        <div className="col-span-5 relative flex items-center">
                          <input
                            id={ENVIRONMENTS_SEMANTIC_ID.FORM_VAR_VALUE_INPUT(item.id)}
                            type={item.type === 'secret' && !item.showValue ? 'password' : 'text'}
                            value={item.value}
                            onChange={(e) => handleUpdateVariable(item.id, { value: e.target.value })}
                            placeholder="Value..."
                            className="w-full pl-2 pr-14 py-1 font-mono text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded focus:outline-hidden focus:ring-1 focus:ring-indigo-500 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-600"
                          />
                          <div className="absolute right-1 flex items-center gap-0.5">
                            {item.type === 'secret' && (
                              <button
                                id={ENVIRONMENTS_SEMANTIC_ID.FORM_VAR_SHOW_VALUE_BTN(item.id)}
                                type="button"
                                onClick={() => handleToggleShowValue(item.id)}
                                className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                                title={item.showValue ? ENVIRONMENTS_TEXT.FORM_TOOLTIP_HIDE_VALUE : ENVIRONMENTS_TEXT.FORM_TOOLTIP_SHOW_VALUE}
                              >
                                {item.showValue ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                              </button>
                            )}
                            <button
                              id={ENVIRONMENTS_SEMANTIC_ID.FORM_VAR_TYPE_SELECT(item.id)}
                              type="button"
                              onClick={() =>
                                handleUpdateVariable(item.id, {
                                  type: item.type === 'secret' ? 'plain' : 'secret',
                                  showValue: item.type === 'secret',
                                })
                              }
                              className={`p-1 rounded text-[10px] cursor-pointer ${
                                item.type === 'secret'
                                  ? 'text-amber-600 dark:text-amber-400 font-bold'
                                  : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'
                              }`}
                              title={item.type === 'secret' ? ENVIRONMENTS_TEXT.FORM_TOOLTIP_MASKED_SECRET : ENVIRONMENTS_TEXT.FORM_TOOLTIP_PLAIN_TEXT}
                            >
                              {item.type === 'secret' ? <Lock className="w-3 h-3" /> : <span className="text-[10px]">T</span>}
                            </button>
                          </div>
                        </div>

                        <div className="col-span-2 flex items-center justify-end pr-1">
                          <button
                            id={ENVIRONMENTS_SEMANTIC_ID.FORM_VAR_DELETE_BTN(item.id)}
                            type="button"
                            onClick={() => handleRemoveVariable(item.id)}
                            className="p-1 text-slate-400 hover:text-rose-500 rounded transition-colors cursor-pointer"
                            title={ENVIRONMENTS_TEXT.FORM_TOOLTIP_REMOVE_VAR}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                <div className="p-2 bg-slate-50 dark:bg-slate-900/80 border-t border-slate-200 dark:border-slate-800 flex justify-between items-center">
                  <button
                    id={ENVIRONMENTS_SEMANTIC_ID.FORM_ADD_VAR_BTN}
                    type="button"
                    onClick={() => handleAddVariable()}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 bg-white dark:bg-slate-800 border border-indigo-200 dark:border-indigo-800 rounded-lg shadow-2xs hover:bg-indigo-50 dark:hover:bg-indigo-950/40 transition-colors cursor-pointer"
                  >
                    <Plus className="w-3 h-3" />
                    <span>{ENVIRONMENTS_TEXT.FORM.ADD_VARIABLE}</span>
                  </button>
                  <span className="text-[10px] text-slate-500 dark:text-slate-400">
                    {ENVIRONMENTS_TEXT.FORM_VARS_COUNT_LABEL(variables.length)}
                  </span>
                </div>
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
