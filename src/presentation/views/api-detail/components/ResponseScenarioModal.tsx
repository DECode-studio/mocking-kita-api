'use client';

import React, { FormEvent } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { X } from 'lucide-react';
import { ResponseScenario } from '@/src/domain/response-scenario/entity/response_scenario';

interface ResponseScenarioModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  editingRespScenario: ResponseScenario | null;
  onSubmit: (e: FormEvent<HTMLFormElement>) => void;
}

export const ResponseScenarioModal: React.FC<ResponseScenarioModalProps> = ({
  isOpen,
  onOpenChange,
  editingRespScenario,
  onSubmit,
}) => {
  return (
    <Dialog.Root open={isOpen} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs z-50" />
        <Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-2xl z-50 space-y-4 focus:outline-none">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
            <Dialog.Title className="text-base font-semibold text-slate-900 dark:text-slate-100">
              {editingRespScenario ? 'Edit Response Scenario' : 'Add Response Scenario'}
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
                onClick={() => onOpenChange(false)}
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
  );
};
