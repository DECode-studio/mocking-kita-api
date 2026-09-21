'use client';

import React, { useState, useEffect } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import * as Switch from '@radix-ui/react-switch';
import { X, Layers, Save, Server, Loader2 } from 'lucide-react';
import { ScenarioFlow } from '@/src/client/domain/scenario-flow/entity/scenario_flow';
import { Environment, getEnvironmentBaseUrl } from '@/src/client/domain/environment/entity/environment';
import { DataSheetVariablePicker } from '@/src/client/presentation/components/shared/DataSheetVariablePicker';
import { SCENARIO_FLOW_DETAIL_TEXT, SCENARIO_FLOW_DETAIL_SEMANTIC_ID } from '../constant';

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
  const [name, setName] = useState(flow.name || '');
  const [description, setDescription] = useState(flow.description || '');
  const [defaultEnvironmentId, setDefaultEnvironmentId] = useState(flow.defaultEnvironmentId || '');
  const [stopOnFailure, setStopOnFailure] = useState(flow.stopOnFailure ?? true);
  const [variablesJson, setVariablesJson] = useState('{}');
  const [jsonError, setJsonError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setName(flow.name || '');
      setDescription(flow.description || '');
      setDefaultEnvironmentId(flow.defaultEnvironmentId || '');
      setStopOnFailure(flow.stopOnFailure ?? true);

      // Display variables without internal _canvasLayout for cleaner editing
      const vars = { ...(flow.variables || {}) };
      delete vars._canvasLayout;
      setVariablesJson(JSON.stringify(vars, null, 2));
      setJsonError(null);
    }
  }, [isOpen, flow]);

  const handleInsertVariableToken = (token: string) => {
    try {
      const parsed = JSON.parse(variablesJson.trim() || '{}');
      const cleanKey =
        token
          .replace(/^\{\{\s*datasheet\./, '')
          .replace(/\}\}/, '')
          .replace(/[^a-zA-Z0-9_]/g, '_')
          .replace(/_+/g, '_')
          .replace(/^_|_$/g, '') || 'datasheet_value';
      parsed[cleanKey] = token;
      setVariablesJson(JSON.stringify(parsed, null, 2));
      setJsonError(null);
    } catch {
      setVariablesJson((prev) => (prev ? `${prev}\n"${token}"` : token));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    let parsedVars: Record<string, any> = {};
    if (variablesJson.trim()) {
      try {
        parsedVars = JSON.parse(variablesJson);
        setJsonError(null);
      } catch {
        setJsonError('Invalid JSON format for variables');
        return;
      }
    }

    // Preserve existing _canvasLayout
    if ((flow.variables as any)?._canvasLayout) {
      parsedVars._canvasLayout = (flow.variables as any)._canvasLayout;
    }

    setIsSubmitting(true);
    try {
      await onSave({
        name: name.trim(),
        description: description.trim() || undefined,
        defaultEnvironmentId: defaultEnvironmentId || undefined,
        stopOnFailure,
        variables: parsedVars,
      });
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

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
                  Edit Scenario Flow Details
                </Dialog.Title>
                <Dialog.Description className="text-xs text-slate-500">
                  Update flow title, subtitle description, default environment, and variables
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
                <span>Flow Title / Name</span>
                <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. User Limit Submission Flow"
                className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950 focus:outline-hidden focus:border-purple-500 text-slate-900 dark:text-white font-medium"
              />
            </div>

            {/* Subtitle / Description */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Flow Subtitle / Description
              </label>
              <textarea
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe the end-to-end scenario flow purpose, prerequisites, and assertions..."
                className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950 focus:outline-hidden focus:border-purple-500 text-slate-900 dark:text-white resize-none leading-relaxed"
              />
            </div>

            {/* Default Target Environment */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1">
                <Server className="w-3.5 h-3.5 text-indigo-500" />
                <span>Default Environment</span>
              </label>
              <select
                value={defaultEnvironmentId}
                onChange={(e) => setDefaultEnvironmentId(e.target.value)}
                className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950 focus:outline-hidden focus:border-purple-500 text-slate-900 dark:text-white cursor-pointer"
              >
                <option value="">No Default Environment</option>
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
                  Stop Chaining on First Failure
                </span>
                <span className="text-[11px] text-slate-500">
                  Halt subsequent steps immediately if any step fails assertions or HTTP error
                </span>
              </div>
              <Switch.Root
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
                  Initial Variables (JSON)
                </label>
                <div className="flex items-center gap-2">
                  {jsonError && (
                    <span className="text-[11px] text-rose-500 font-medium">{jsonError}</span>
                  )}
                  <DataSheetVariablePicker
                    buttonLabel="Data Sheet"
                    triggerClassName="text-[10px] py-0.5 px-2"
                    projectId={flow.projectId || undefined}
                    onInsert={handleInsertVariableToken}
                  />
                </div>
              </div>
              <textarea
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
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting || !name.trim()}
                className="inline-flex items-center gap-1.5 px-5 py-2 text-xs font-semibold text-white bg-purple-600 hover:bg-purple-500 rounded-xl transition-colors shadow-sm disabled:opacity-50 cursor-pointer"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Saving...</span>
                  </>
                ) : (
                  <>
                    <Save className="w-3.5 h-3.5" />
                    <span>Save Changes</span>
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
