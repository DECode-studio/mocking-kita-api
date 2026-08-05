'use client';

import React, { FormEvent } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { X } from 'lucide-react';
import { RequestScenario } from '@/src/domain/request-scenario/entity/request_scenario';

interface RequestScenarioModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  editingReqScenario: RequestScenario | null;
  onSubmit: (e: FormEvent<HTMLFormElement>) => void;
}

export const RequestScenarioModal: React.FC<RequestScenarioModalProps> = ({
  isOpen,
  onOpenChange,
  editingReqScenario,
  onSubmit,
}) => {
  return (
    <Dialog.Root open={isOpen} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs z-50" />
        <Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-2xl z-50 space-y-4 focus:outline-none">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
            <Dialog.Title className="text-base font-semibold text-slate-900 dark:text-slate-100">
              {editingReqScenario ? 'Edit Request Scenario' : 'Add Request Scenario'}
            </Dialog.Title>
            <button
              type="button"
              onClick={() => onOpenChange(false)}
              className="text-slate-400 hover:text-slate-600"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <form onSubmit={onSubmit} className="space-y-3 text-xs">
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
                onClick={() => onOpenChange(false)}
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
  );
};
