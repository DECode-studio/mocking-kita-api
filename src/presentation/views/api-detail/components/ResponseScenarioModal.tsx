'use client';

import React, { useEffect, useState } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { X } from 'lucide-react';
import { ResponseScenario } from '@/src/domain/response-scenario/entity/response_scenario';
import { API_DETAIL_TEXT, API_DETAIL_SEMANTIC_ID } from '../constant';

/* eslint-disable @typescript-eslint/no-explicit-any */
interface ResponseScenarioModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  editingRespScenario: ResponseScenario | null;
  onSubmit: (data: any) => void;
}

export const ResponseScenarioModal: React.FC<ResponseScenarioModalProps> = ({
  isOpen,
  onOpenChange,
  editingRespScenario,
  onSubmit,
}) => {
  const [name, setName] = useState('');
  const [statusCode, setStatusCode] = useState(200);
  const [body, setBody] = useState('{\n  "message": "Success"\n}');
  const [delayMs, setDelayMs] = useState(0);
  const [status, setStatus] = useState(true);

  useEffect(() => {
    if (editingRespScenario) {
      setName(editingRespScenario.name);
      setStatusCode(editingRespScenario.statusCode);
      setBody(typeof editingRespScenario.body === 'string' ? editingRespScenario.body : JSON.stringify(editingRespScenario.body || {}, null, 2));
      setDelayMs(editingRespScenario.delayMs);
      setStatus(editingRespScenario.status);
    } else {
      setName('');
      setStatusCode(200);
      setBody('{\n  "message": "Success"\n}');
      setDelayMs(0);
      setStatus(true);
    }
  }, [editingRespScenario, isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      name,
      statusCode: Number(statusCode) || 200,
      body,
      delayMs: Number(delayMs) || 0,
      status,
    });
  };

  return (
    <Dialog.Root open={isOpen} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs z-50" />
        <Dialog.Content id={API_DETAIL_SEMANTIC_ID.RESP_MODAL} className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-2xl z-50 space-y-4 focus:outline-none max-h-[90vh] overflow-y-auto">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
            <Dialog.Title className="text-base font-semibold text-slate-900 dark:text-slate-100">
              {editingRespScenario ? API_DETAIL_TEXT.MODAL_RESP_EDIT_TITLE : API_DETAIL_TEXT.MODAL_RESP_ADD_TITLE}
            </Dialog.Title>
            <button
              type="button"
              onClick={() => onOpenChange(false)}
              className="text-slate-400 hover:text-slate-600"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4 text-xs">
            <div className="grid grid-cols-3 gap-3">
              <div className="col-span-2">
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Response Name *
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. 200 OK Response"
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-900 dark:text-slate-100 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  {API_DETAIL_TEXT.LABEL_STATUS_CODE}
                </label>
                <input
                  type="number"
                  required
                  value={statusCode}
                  onChange={(e) => setStatusCode(Number(e.target.value))}
                  placeholder="200"
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg font-mono focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                {API_DETAIL_TEXT.LABEL_DELAY}
              </label>
              <input
                type="number"
                min={0}
                value={delayMs}
                onChange={(e) => setDelayMs(Number(e.target.value))}
                placeholder="0"
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg font-mono focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                {API_DETAIL_TEXT.LABEL_RESPONSE_BODY}
              </label>
              <textarea
                rows={6}
                value={body}
                onChange={(e) => setBody(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg font-mono text-emerald-400 focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div className="flex items-center justify-between pt-2">
              <label className="font-semibold text-slate-700 dark:text-slate-300">{API_DETAIL_TEXT.LABEL_ACTIVE_STATUS}</label>
              <input
                type="checkbox"
                checked={status}
                onChange={(e) => setStatus(e.target.checked)}
                className="w-4 h-4 text-indigo-600 rounded border-slate-300"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => onOpenChange(false)}
                className="px-3.5 py-1.5 font-medium text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 rounded-md"
              >
                {API_DETAIL_TEXT.BTN_CANCEL}
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded-md shadow-xs transition-colors"
              >
                {editingRespScenario ? API_DETAIL_TEXT.BTN_SAVE : API_DETAIL_TEXT.BTN_CREATE}
              </button>
            </div>
          </form>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
};
