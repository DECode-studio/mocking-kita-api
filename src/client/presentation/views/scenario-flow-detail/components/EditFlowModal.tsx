'use client';

import React from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import * as Switch from '@radix-ui/react-switch';
import { X, Layers, Save, Server, Loader2 } from 'lucide-react';
import { ScenarioFlow } from '@/src/client/domain/scenario-flow/entity/scenario_flow';
import { Environment, getEnvironmentBaseUrl } from '@/src/client/domain/environment/entity/environment';
import { DataSheetVariablePicker } from '@/src/client/presentation/components/shared/DataSheetVariablePicker';
import { EnvironmentVariablePicker } from '@/src/client/presentation/components/shared/EnvironmentVariablePicker';
import { SCENARIO_FLOW_DETAIL_SEMANTIC_ID, SCENARIO_FLOW_DETAIL_TEXT } from '../constant';
import { useEditFlowModal } from '../hook';

interface EditFlowModalProps {
  isOpen: boolean;
  onClose: () => void;
  flow: ScenarioFlow;
  environments: Environment[];
  onSave: (data: {
    name: string;
    description?: string;
    defaultEnvironmentId?: string;
    stopOnFailure: boolean;
    variables?: Record<string, any>;
  }) => Promise<void>;
}

export const EditFlowModal: React.FC<EditFlowModalProps> = ({
  isOpen,
  onClose,
  flow,
  environments,
  onSave,
}) => {
  const {
    name,
    setName,
    description,
    setDescription,
    defaultEnvironmentId,
    setDefaultEnvironmentId,
    stopOnFailure,
    setStopOnFailure,
    variablesJson,
    setVariablesJson,
    jsonError,
    setJsonError,
    isSubmitting,
    handleInsertVariableToken,
    handleSubmit,
  } = useEditFlowModal({
    isOpen,
    flow,
    onSave,
    onClose,
  });

  return (
    <Dialog.Root open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs z-50 animate-in fade-in" />
        <Dialog.Content
          id={SCENARIO_FLOW_DETAIL_SEMANTIC_ID.MODAL_EDIT_FLOW}
          className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl z-50 p-6 space-y-5 animate-in zoom-in-95"
        >
          {/* Header */}
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-purple-500/10 dark:bg-purple-500/20 text-purple-600 dark:text-purple-400 flex items-center justify-center">
                <Layers className="w-4 h-4" />
              </div>
              <div>
                <Dialog.Title className="text-sm font-bold text-slate-900 dark:text-white">
                  {SCENARIO_FLOW_DETAIL_TEXT.EDIT_FLOW_TITLE}
                </Dialog.Title>
                <Dialog.Description className="text-xs text-slate-500">
                  {SCENARIO_FLOW_DETAIL_TEXT.EDIT_FLOW_SUBTITLE}
                </Dialog.Description>
              </div>
            </div>

            <Dialog.Close asChild>
              <button
                className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                aria-label="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </Dialog.Close>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Title / Name */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1">
                <span>{SCENARIO_FLOW_DETAIL_TEXT.EDIT_NAME_LABEL}</span>
                <span className="text-rose-500">*</span>
              </label>
              <input
                id={SCENARIO_FLOW_DETAIL_SEMANTIC_ID.MODAL_EDIT_INPUT_NAME}
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={SCENARIO_FLOW_DETAIL_TEXT.EDIT_NAME_PLACEHOLDER}
                className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950 focus:outline-hidden focus:border-purple-500 text-slate-900 dark:text-white font-medium"
              />
            </div>

            {/* Subtitle / Description */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                {SCENARIO_FLOW_DETAIL_TEXT.EDIT_DESC_LABEL}
              </label>
              <textarea
                id={SCENARIO_FLOW_DETAIL_SEMANTIC_ID.MODAL_EDIT_INPUT_DESC}
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder={SCENARIO_FLOW_DETAIL_TEXT.EDIT_DESC_PLACEHOLDER}
                className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950 focus:outline-hidden focus:border-purple-500 text-slate-900 dark:text-white resize-none leading-relaxed"
              />
            </div>

            {/* Default Target Environment */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1">
                <Server className="w-3.5 h-3.5 text-indigo-500" />
                <span>{SCENARIO_FLOW_DETAIL_TEXT.EDIT_ENV_LABEL}</span>
              </label>
              <select
                id={SCENARIO_FLOW_DETAIL_SEMANTIC_ID.MODAL_EDIT_SELECT_ENV}
                value={defaultEnvironmentId}
                onChange={(e) => setDefaultEnvironmentId(e.target.value)}
                className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950 focus:outline-hidden focus:border-purple-500 text-slate-900 dark:text-white cursor-pointer"
              >
                <option value="">{SCENARIO_FLOW_DETAIL_TEXT.EDIT_ENV_NONE}</option>
                {environments.map((env) => {
                  const url = getEnvironmentBaseUrl(env);
                  return (
                    <option key={env.id} value={env.id}>
                      {env.name} ({env.environmentType}){url ? ` - ${url}` : ''}
                    </option>
                  );
                })}
              </select>
            </div>

            {/* Stop on Failure Switch */}
            <div className="flex items-center justify-between p-3 rounded-xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/40 dark:bg-slate-950/40">
              <div>
                <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 block">
                  {SCENARIO_FLOW_DETAIL_TEXT.EDIT_STOP_ON_FAILURE_LABEL}
                </span>
                <span className="text-[11px] text-slate-500">
                  {SCENARIO_FLOW_DETAIL_TEXT.EDIT_STOP_ON_FAILURE_DESC}
                </span>
              </div>
              <Switch.Root
                id={SCENARIO_FLOW_DETAIL_SEMANTIC_ID.MODAL_EDIT_SWITCH_STOP}
                checked={stopOnFailure}
                onCheckedChange={setStopOnFailure}
                className={`w-9 h-5 rounded-full transition-colors relative cursor-pointer ${
                  stopOnFailure ? 'bg-purple-600' : 'bg-slate-300 dark:bg-slate-700'
                }`}
              >
                <Switch.Thumb
                  className={`block w-4 h-4 rounded-full bg-white transition-transform ${
                    stopOnFailure ? 'translate-x-4.5' : 'translate-x-0.5'
                  }`}
                />
              </Switch.Root>
            </div>

            {/* Initial Variables JSON */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 font-mono">
                  {SCENARIO_FLOW_DETAIL_TEXT.EDIT_VARS_LABEL}
                </label>
                <div className="flex items-center gap-2">
                  {jsonError && (
                    <span className="text-[11px] text-rose-500 font-medium">{jsonError}</span>
                  )}
                  <EnvironmentVariablePicker
                    buttonLabel="Env Vars"
                    triggerClassName="text-[10px] py-0.5 px-2"
                    projectId={flow.projectId || undefined}
                    onInsert={handleInsertVariableToken}
                  />
                  <DataSheetVariablePicker
                    buttonLabel="Data Sheet"
                    triggerClassName="text-[10px] py-0.5 px-2"
                    projectId={flow.projectId || undefined}
                    onInsert={handleInsertVariableToken}
                  />
                </div>
              </div>
              <textarea
                id={SCENARIO_FLOW_DETAIL_SEMANTIC_ID.MODAL_EDIT_TEXTAREA_VARS}
                rows={4}
                value={variablesJson}
                onChange={(e) => {
                  setVariablesJson(e.target.value);
                  setJsonError(null);
                }}
                className={`w-full px-3.5 py-2 text-xs font-mono rounded-xl border bg-slate-50/50 dark:bg-slate-950 text-slate-800 dark:text-slate-200 focus:outline-hidden ${
                  jsonError
                    ? 'border-rose-500'
                    : 'border-slate-200 dark:border-slate-800 focus:border-purple-500'
                } resize-none`}
              />
            </div>

            {/* Footer Buttons */}
            <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100 dark:border-slate-800">
              <button
                id={SCENARIO_FLOW_DETAIL_SEMANTIC_ID.MODAL_EDIT_BTN_CANCEL}
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
              >
                {SCENARIO_FLOW_DETAIL_TEXT.CANCEL}
              </button>
              <button
                id={SCENARIO_FLOW_DETAIL_SEMANTIC_ID.MODAL_EDIT_BTN_SUBMIT}
                type="submit"
                disabled={isSubmitting || !name.trim()}
                className="inline-flex items-center gap-1.5 px-5 py-2 text-xs font-semibold text-white bg-purple-600 hover:bg-purple-500 rounded-xl transition-colors shadow-sm disabled:opacity-50 cursor-pointer"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>{SCENARIO_FLOW_DETAIL_TEXT.SAVING}</span>
                  </>
                ) : (
                  <>
                    <Save className="w-3.5 h-3.5" />
                    <span>{SCENARIO_FLOW_DETAIL_TEXT.SAVE_CHANGES}</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
};
