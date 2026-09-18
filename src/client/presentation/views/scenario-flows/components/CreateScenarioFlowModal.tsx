'use client';

import React, { useState } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import * as Switch from '@radix-ui/react-switch';
import { X, Sparkles, Layers } from 'lucide-react';
import { Environment } from '@/src/client/domain/environment/entity/environment';
import { Project } from '@/src/client/domain/project/entity/project';

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
  const [name, setName] = useState('');
  const [selectedProjectId, setSelectedProjectId] = useState(initialProjectId || '');
  const [description, setDescription] = useState('');
  const [defaultEnvironmentId, setDefaultEnvironmentId] = useState('');
  const [stopOnFailure, setStopOnFailure] = useState(true);
  const [variablesJson, setVariablesJson] = useState('{\n  \n}');
  const [jsonError, setJsonError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  React.useEffect(() => {
    if (initialProjectId) {
      setSelectedProjectId(initialProjectId);
    }
  }, [initialProjectId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    let parsedVars = {};
    if (variablesJson.trim()) {
      try {
        parsedVars = JSON.parse(variablesJson);
        setJsonError(null);
      } catch (err: any) {
        setJsonError('Invalid JSON format for variables');
        return;
      }
    }

    setIsSubmitting(true);
    try {
      await onSubmit({
        projectId: selectedProjectId || undefined,
        name: name.trim(),
        description: description.trim() || undefined,
        defaultEnvironmentId: defaultEnvironmentId || undefined,
        stopOnFailure,
        variables: parsedVars,
      });
      setName('');
      setDescription('');
      setDefaultEnvironmentId('');
      setVariablesJson('{\n  \n}');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog.Root open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs z-50 animate-in fade-in" />
        <Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-2xl z-50 max-h-[90vh] overflow-y-auto space-y-6">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-purple-500/10 dark:bg-purple-500/20 text-purple-600 dark:text-purple-400 flex items-center justify-center">
                <Layers className="w-4 h-4" />
              </div>
              <div>
                <Dialog.Title className="text-base font-bold text-slate-900 dark:text-white">
                  Create Scenario Flow
                </Dialog.Title>
                <Dialog.Description className="text-xs text-slate-500 dark:text-slate-400">
                  Manually configure an automated API chaining sequence
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
                Flow Name <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. User Registration & Checkout Flow"
                className="w-full px-3.5 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-purple-500/30 focus:border-purple-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Primary Project <span className="text-slate-400 font-normal">(Optional)</span>
              </label>
              <select
                value={selectedProjectId}
                onChange={(e) => setSelectedProjectId(e.target.value)}
                className="w-full px-3.5 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-purple-500/30 focus:border-purple-500"
              >
                <option value="">-- Cross-Project / Global Flow (None) --</option>
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Description
              </label>
              <textarea
                rows={2}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Optional description of this test journey..."
                className="w-full px-3.5 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-purple-500/30 focus:border-purple-500"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Default Target Environment
                </label>
                <select
                  value={defaultEnvironmentId}
                  onChange={(e) => setDefaultEnvironmentId(e.target.value)}
                  className="w-full px-3.5 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-purple-500/30 focus:border-purple-500"
                >
                  <option value="">-- None (Prompt on Run) --</option>
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
                      Stop on Failure
                    </span>
                    <span className="text-[11px] text-slate-500">
                      Halt remaining steps if a step fails
                    </span>
                  </div>
                  <Switch.Root
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
                  Initial Variables (JSON)
                </label>
                <span className="text-[11px] text-slate-500 font-mono">
                  Accessible as &#123;&#123;varName&#125;&#125;
                </span>
              </div>
              <textarea
                rows={4}
                value={variablesJson}
                onChange={(e) => {
                  setVariablesJson(e.target.value);
                  setJsonError(null);
                }}
                className="w-full px-3.5 py-2 text-xs font-mono rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-950 text-slate-200 focus:outline-hidden focus:ring-2 focus:ring-purple-500/30 focus:border-purple-500"
              />
              {jsonError && <p className="text-xs text-rose-500 mt-1">{jsonError}</p>}
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={onClose}
                disabled={isSubmitting}
                className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting || !name.trim()}
                className="px-4 py-2 text-xs font-semibold text-white bg-purple-600 hover:bg-purple-500 active:bg-purple-700 rounded-lg shadow-sm shadow-purple-500/20 disabled:opacity-50 transition-all flex items-center gap-1.5"
              >
                <Sparkles className="w-3.5 h-3.5" />
                {isSubmitting ? 'Creating...' : 'Create Flow'}
              </button>
            </div>
          </form>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
};
