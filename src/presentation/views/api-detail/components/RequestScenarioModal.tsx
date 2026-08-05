'use client';

import React, { useEffect, useState } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { X, Sparkles } from 'lucide-react';
import { RequestScenario } from '@/src/domain/request-scenario/entity/request_scenario';
import { API_DETAIL_TEXT, API_DETAIL_SEMANTIC_ID } from '../constant';
import { formatJsonString } from '@/src/core/utils/json';

/* eslint-disable @typescript-eslint/no-explicit-any */
interface RequestScenarioModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  editingReqScenario: RequestScenario | null;
  onSubmit: (data: {
    name: string;
    priority: number;
    queryParams: string;
    headers: string;
    body: string;
    status: boolean;
  }) => void;
}

export const RequestScenarioModal: React.FC<RequestScenarioModalProps> = ({
  isOpen,
  onOpenChange,
  editingReqScenario,
  onSubmit,
}) => {
  const [name, setName] = useState('');
  const [priority, setPriority] = useState(1);
  const [queryParams, setQueryParams] = useState('{}');
  const [headers, setHeaders] = useState('{}');
  const [body, setBody] = useState('{}');
  const [status, setStatus] = useState(true);

  useEffect(() => {
    if (editingReqScenario) {
      setName(editingReqScenario.name);
      setPriority(editingReqScenario.priority || 1);
      setQueryParams(JSON.stringify(editingReqScenario.queryParams || {}, null, 2));
      setHeaders(JSON.stringify(editingReqScenario.headers || {}, null, 2));
      setBody(typeof editingReqScenario.body === 'string' ? editingReqScenario.body : JSON.stringify(editingReqScenario.body || {}, null, 2));
      setStatus(editingReqScenario.status);
    } else {
      setName('');
      setPriority(1);
      setQueryParams('{}');
      setHeaders('{}');
      setBody('{}');
      setStatus(true);
    }
  }, [editingReqScenario, isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      name,
      priority: Number(priority) || 1,
      queryParams,
      headers,
      body,
      status,
    });
  };

  return (
    <Dialog.Root open={isOpen} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs z-50" />
        <Dialog.Content id={API_DETAIL_SEMANTIC_ID.REQ_MODAL} className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-2xl z-50 space-y-4 focus:outline-none max-h-[90vh] overflow-y-auto">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
            <Dialog.Title className="text-base font-semibold text-slate-900 dark:text-slate-100">
              {editingReqScenario ? API_DETAIL_TEXT.MODAL_REQ_EDIT_TITLE : API_DETAIL_TEXT.MODAL_REQ_ADD_TITLE}
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
                  {API_DETAIL_TEXT.LABEL_SCENARIO_NAME}
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Valid VIP Customer Request"
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-900 dark:text-slate-100 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  {API_DETAIL_TEXT.LABEL_PRIORITY}
                </label>
                <input
                  type="number"
                  min={1}
                  value={priority}
                  onChange={(e) => setPriority(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-900 dark:text-slate-100 focus:outline-none font-mono"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block font-semibold text-slate-700 dark:text-slate-300">
                  Query Params Matching (JSON)
                </label>
                <button
                  type="button"
                  onClick={() => setQueryParams(formatJsonString(queryParams))}
                  className="inline-flex items-center gap-1 text-[11px] font-medium text-indigo-600 dark:text-indigo-400 hover:underline"
                >
                  <Sparkles className="w-3 h-3 text-amber-500" />
                  Beautify
                </button>
              </div>
              <textarea
                rows={2}
                value={queryParams}
                onChange={(e) => setQueryParams(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-900 dark:text-slate-100 font-mono focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block font-semibold text-slate-700 dark:text-slate-300">
                  Headers Matching (JSON)
                </label>
                <button
                  type="button"
                  onClick={() => setHeaders(formatJsonString(headers))}
                  className="inline-flex items-center gap-1 text-[11px] font-medium text-indigo-600 dark:text-indigo-400 hover:underline"
                >
                  <Sparkles className="w-3 h-3 text-amber-500" />
                  Beautify
                </button>
              </div>
              <textarea
                rows={2}
                value={headers}
                onChange={(e) => setHeaders(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-900 dark:text-slate-100 font-mono focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block font-semibold text-slate-700 dark:text-slate-300">
                  Body Payload Matching (JSON)
                </label>
                <button
                  type="button"
                  onClick={() => setBody(formatJsonString(body))}
                  className="inline-flex items-center gap-1 text-[11px] font-medium text-indigo-600 dark:text-indigo-400 hover:underline"
                >
                  <Sparkles className="w-3 h-3 text-amber-500" />
                  Beautify
                </button>
              </div>
              <textarea
                rows={2}
                value={body}
                onChange={(e) => setBody(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-900 dark:text-slate-100 font-mono focus:outline-none focus:border-indigo-500"
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
                {editingReqScenario ? API_DETAIL_TEXT.BTN_SAVE : API_DETAIL_TEXT.BTN_CREATE}
              </button>
            </div>
          </form>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
};
