'use client';

import React from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import * as Switch from '@radix-ui/react-switch';
import { X, Sparkles, Layers } from 'lucide-react';
import { Environment } from '@/src/client/domain/environment/entity/environment';
import { Project } from '@/src/client/domain/project/entity/project';
import { DataSheetVariablePicker } from '@/src/client/presentation/components/shared/DataSheetVariablePicker';
import { EnvironmentVariablePicker } from '@/src/client/presentation/components/shared/EnvironmentVariablePicker';
import { SCENARIO_FLOWS_SEMANTIC_ID, SCENARIO_FLOWS_TEXT } from '../constant';
import { useCreateScenarioFlowModal } from '../hook';

interface CreateScenarioFlowModalProps {
  isOpen: boolean;
  onClose: () => void;
  environments: Environment[];
  projects?: Project[];
  initialProjectId?: string;
  onSubmit: (data: {
    projectId?: string;
    name: string;
    description?: string;
    defaultEnvironmentId?: string;
    stopOnFailure: boolean;
    variables?: Record<string, any>;
  }) => Promise<void>;
}

export const CreateScenarioFlowModal: React.FC<CreateScenarioFlowModalProps> = ({
  isOpen,
  onClose,
  environments,
  projects = [],
  initialProjectId,
  onSubmit,
}) => {
  const {
    name,
    setName,
    selectedProjectId,
    setSelectedProjectId,
    description,
    setDescription,
    defaultEnvironmentId,
    setDefaultEnvironmentId,
    stopOnFailure,
    setStopOnFailure,
    variablesJson,
    setVariablesJson,
    jsonError,
    isSubmitting,
    handleInsertVariableToken,
    handleSubmit,
  } = useCreateScenarioFlowModal({
    isOpen,
    initialProjectId,
    onSubmit,
    onClose,
  });

  return (
    <Dialog.Root open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs z-50 animate-in fade-in" />
        <Dialog.Content
          id={SCENARIO_FLOWS_SEMANTIC_ID.MODAL_CREATE}
          className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-2xl z-50 max-h-[90vh] overflow-y-auto space-y-6"
        >
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-purple-500/10 dark:bg-purple-500/20 text-purple-600 dark:text-purple-400 flex items-center justify-center">
                <Layers className="w-4 h-4" />
              </div>
              <div>
                <Dialog.Title className="text-base font-bold text-slate-900 dark:text-white">
                  {SCENARIO_FLOWS_TEXT.CREATE_MODAL_TITLE}
                </Dialog.Title>
                <Dialog.Description className="text-xs text-slate-500 dark:text-slate-400">
                  {SCENARIO_FLOWS_TEXT.CREATE_MODAL_SUBTITLE}
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
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                {SCENARIO_FLOWS_TEXT.MODAL_CREATE_NAME_LABEL} <span className="text-rose-500">*</span>
              </label>
              <input
                id={SCENARIO_FLOWS_SEMANTIC_ID.MODAL_CREATE_INPUT_NAME}
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={SCENARIO_FLOWS_TEXT.MODAL_CREATE_NAME_PLACEHOLDER}
                className="w-full px-3.5 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-purple-500/30 focus:border-purple-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                {SCENARIO_FLOWS_TEXT.MODAL_CREATE_PROJECT_LABEL}{' '}
                <span className="text-slate-400 font-normal">(Optional)</span>
              </label>
              <select
                id={SCENARIO_FLOWS_SEMANTIC_ID.MODAL_CREATE_SELECT_PROJECT}
                value={selectedProjectId}
                onChange={(e) => setSelectedProjectId(e.target.value)}
                className="w-full px-3.5 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-purple-500/30 focus:border-purple-500"
              >
                <option value="">-- {SCENARIO_FLOWS_TEXT.MODAL_CREATE_PROJECT_GLOBAL} --</option>
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                {SCENARIO_FLOWS_TEXT.MODAL_CREATE_DESC_LABEL}
              </label>
              <textarea
                id={SCENARIO_FLOWS_SEMANTIC_ID.MODAL_CREATE_INPUT_DESC}
                rows={2}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder={SCENARIO_FLOWS_TEXT.MODAL_CREATE_DESC_PLACEHOLDER}
                className="w-full px-3.5 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-purple-500/30 focus:border-purple-500"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  {SCENARIO_FLOWS_TEXT.MODAL_CREATE_ENV_LABEL}
                </label>
                <select
                  id={SCENARIO_FLOWS_SEMANTIC_ID.MODAL_CREATE_SELECT_ENV}
                  value={defaultEnvironmentId}
                  onChange={(e) => setDefaultEnvironmentId(e.target.value)}
                  className="w-full px-3.5 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-purple-500/30 focus:border-purple-500"
                >
                  <option value="">-- {SCENARIO_FLOWS_TEXT.MODAL_CREATE_ENV_NONE} --</option>
                  {environments.map((env) => (
                    <option key={env.id} value={env.id}>
                      {env.name} ({env.environmentType})
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex flex-col justify-end">
                <div className="flex items-center justify-between p-2.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950">
                  <div>
                    <span className="text-xs font-semibold text-slate-900 dark:text-white block">
                      {SCENARIO_FLOWS_TEXT.MODAL_CREATE_STOP_ON_FAILURE_LABEL}
                    </span>
                    <span className="text-[11px] text-slate-500">
                      {SCENARIO_FLOWS_TEXT.MODAL_CREATE_STOP_ON_FAILURE_DESC}
                    </span>
                  </div>
                  <Switch.Root
                    id={SCENARIO_FLOWS_SEMANTIC_ID.MODAL_CREATE_SWITCH_STOP}
                    checked={stopOnFailure}
                    onCheckedChange={setStopOnFailure}
                    className="w-9 h-5 bg-slate-300 dark:bg-slate-700 rounded-full relative data-[state=checked]:bg-purple-600 outline-hidden transition-colors"
                  >
                    <Switch.Thumb className="block w-4 h-4 bg-white rounded-full transition-transform duration-100 translate-x-0.5 will-change-transform data-[state=checked]:translate-x-4" />
                  </Switch.Root>
                </div>
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  {SCENARIO_FLOWS_TEXT.MODAL_CREATE_VARS_LABEL}
                </label>
                <div className="flex items-center gap-2">
                  <EnvironmentVariablePicker
                    buttonLabel="Env Vars"
                    triggerClassName="text-[10px] py-0.5 px-2"
                    projectId={selectedProjectId || undefined}
                    onInsert={handleInsertVariableToken}
                  />
                  <DataSheetVariablePicker
                    buttonLabel="Data Sheet"
                    triggerClassName="text-[10px] py-0.5 px-2"
                    projectId={selectedProjectId || undefined}
                    onInsert={handleInsertVariableToken}
                  />
                </div>
              </div>
              <textarea
                id={SCENARIO_FLOWS_SEMANTIC_ID.MODAL_CREATE_TEXTAREA_VARS}
                rows={4}
                value={variablesJson}
                onChange={(e) => {
                  setVariablesJson(e.target.value);
                }}
                className="w-full px-3.5 py-2 text-xs font-mono rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-950 text-slate-200 focus:outline-hidden focus:ring-2 focus:ring-purple-500/30 focus:border-purple-500"
              />
              {jsonError && <p className="text-xs text-rose-500 mt-1">{jsonError}</p>}
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100 dark:border-slate-800">
              <button
                id={SCENARIO_FLOWS_SEMANTIC_ID.MODAL_CREATE_BTN_CANCEL}
                type="button"
                onClick={onClose}
                disabled={isSubmitting}
                className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
              >
                {SCENARIO_FLOWS_TEXT.CANCEL_BTN}
              </button>
              <button
                id={SCENARIO_FLOWS_SEMANTIC_ID.MODAL_CREATE_BTN_SUBMIT}
                type="submit"
                disabled={isSubmitting || !name.trim()}
                className="px-4 py-2 text-xs font-semibold text-white bg-purple-600 hover:bg-purple-500 active:bg-purple-700 rounded-lg shadow-sm shadow-purple-500/20 disabled:opacity-50 transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5" />
                {isSubmitting
                  ? SCENARIO_FLOWS_TEXT.MODAL_CREATE_SUBMITTING_BTN
                  : SCENARIO_FLOWS_TEXT.MODAL_CREATE_SUBMIT_BTN}
              </button>
            </div>
          </form>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
};
