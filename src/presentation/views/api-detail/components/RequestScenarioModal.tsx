'use client';

import React from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { X } from 'lucide-react';
import { RequestScenario } from '@/src/domain/request-scenario/entity/request_scenario';
import { RequestBodyType } from '@/src/core/utils/types';
import { API_DETAIL_TEXT, API_DETAIL_SEMANTIC_ID } from '../constant';
import { useRequestScenarioModal } from '../hook/useRequestScenarioModal';
import { KeyValueOrJsonEditor } from './KeyValueOrJsonEditor';
import { BodyPathRulesEditor } from './BodyPathRulesEditor';

interface RequestScenarioModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  editingReqScenario: RequestScenario | null;
  onSubmit: (data: {
    name: string;
    priority: number;
    matchStrategy: any;
    queryParams: string;
    headers: string;
    body: string;
    bodyType: RequestBodyType;
    bodyRules: any[];
    status: boolean;
  }) => void;
}

export const RequestScenarioModal: React.FC<RequestScenarioModalProps> = ({
  isOpen,
  onOpenChange,
  editingReqScenario,
  onSubmit,
}) => {
  const {
    name,
    setName,
    priority,
    setPriority,
    matchStrategy,
    setMatchStrategy,
    queryParams,
    setQueryParams,
    headers,
    setHeaders,
    body,
    setBody,
    bodyType,
    setBodyType,
    bodyRules,
    setBodyRules,
    status,
    setStatus,
    handleSubmit,
  } = useRequestScenarioModal({
    isOpen,
    editingReqScenario,
    onSubmit,
  });


  return (
    <Dialog.Root open={isOpen} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs z-50" />
        <Dialog.Content
          id={API_DETAIL_SEMANTIC_ID.REQ_MODAL}
          className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-2xl z-50 space-y-4 focus:outline-none max-h-[90vh] overflow-y-auto"
        >
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
            <Dialog.Title className="text-base font-semibold text-slate-900 dark:text-slate-100">
              {editingReqScenario
                ? API_DETAIL_TEXT.MODAL_REQ_EDIT_TITLE
                : API_DETAIL_TEXT.MODAL_REQ_ADD_TITLE}
            </Dialog.Title>
            <button
              type="button"
              onClick={() => onOpenChange(false)}
              className="text-slate-400 hover:text-slate-600 cursor-pointer"
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
                  id={API_DETAIL_SEMANTIC_ID.REQ_FORM_INPUT_NAME}
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder={API_DETAIL_TEXT.PLACEHOLDER_REQ_NAME}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-900 dark:text-slate-100 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  {API_DETAIL_TEXT.LABEL_PRIORITY}
                </label>
                <input
                  id={API_DETAIL_SEMANTIC_ID.REQ_FORM_PRIORITY}
                  type="number"
                  min={1}
                  value={priority}
                  onChange={(e) => setPriority(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-900 dark:text-slate-100 focus:outline-none font-mono"
                />
              </div>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Match Strategy (Rule Combination)
              </label>
              <select
                id={`${API_DETAIL_SEMANTIC_ID.REQ_MODAL}-match-strategy`}
                value={matchStrategy}
                onChange={(e) => setMatchStrategy(e.target.value as any)}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-900 dark:text-slate-100 focus:outline-none focus:border-indigo-500 cursor-pointer"
              >
                <option value="ALL">Match ALL Parameters (AND - Semua parameter harus cocok)</option>
                <option value="ANY">Match ANY Parameter (OR - Salah satu parameter cocok)</option>
              </select>
            </div>

            <div id={API_DETAIL_SEMANTIC_ID.REQ_FORM_QUERY_PARAMS}>
              <KeyValueOrJsonEditor
                label="Query Params Matching"
                value={queryParams}
                onChange={setQueryParams}
                placeholderValue="Value"
                idPrefix={API_DETAIL_SEMANTIC_ID.REQ_FORM_QUERY_PARAMS}
              />
            </div>


            <div id={API_DETAIL_SEMANTIC_ID.REQ_FORM_HEADERS}>
              <KeyValueOrJsonEditor
                label="Headers Matching"
                value={headers}
                onChange={setHeaders}
                placeholderValue="Value"
                idPrefix={API_DETAIL_SEMANTIC_ID.REQ_FORM_HEADERS}
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Request Body Type
              </label>
              <select
                id={API_DETAIL_SEMANTIC_ID.REQ_FORM_BODY_TYPE}
                value={bodyType}
                onChange={(e) => setBodyType(e.target.value as RequestBodyType)}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-900 dark:text-slate-100 focus:outline-none focus:border-indigo-500 cursor-pointer"
              >
                <option value="JSON">JSON (application/json)</option>
                <option value="FORM_DATA">Form Data (multipart/form-data)</option>
                <option value="URL_ENCODED">URL Encoded (application/x-www-form-urlencoded)</option>
                <option value="NONE">None (No Request Body)</option>
              </select>
            </div>

            {bodyType !== 'NONE' && (
              <>
                <div id={API_DETAIL_SEMANTIC_ID.REQ_FORM_BODY}>
                  <KeyValueOrJsonEditor
                    label={
                      bodyType === 'JSON'
                        ? 'Body Payload Matching (JSON)'
                        : bodyType === 'FORM_DATA'
                        ? 'Body Fields & Files Matching (JSON Object)'
                        : 'Body Fields Matching (JSON Object)'
                    }
                    value={body}
                    onChange={setBody}
                    supportFiles={bodyType === 'FORM_DATA'}
                    placeholderValue="Value"
                    idPrefix={API_DETAIL_SEMANTIC_ID.REQ_FORM_BODY}
                  />
                </div>

                <BodyPathRulesEditor
                  rules={bodyRules}
                  onChange={setBodyRules}
                  bodyContent={body}
                  idPrefix="req-modal-body-rules"
                />
              </>
            )}

            <div className="flex items-center justify-between pt-2">
              <label className="font-semibold text-slate-700 dark:text-slate-300">
                {API_DETAIL_TEXT.LABEL_ACTIVE_STATUS}
              </label>
              <input
                id={API_DETAIL_SEMANTIC_ID.REQ_FORM_STATUS}
                type="checkbox"
                checked={status}
                onChange={(e) => setStatus(e.target.checked)}
                className="w-4 h-4 text-indigo-600 rounded border-slate-300 cursor-pointer"
              />
            </div>

            <div
              id={API_DETAIL_SEMANTIC_ID.REQ_FORM_FOOTER}
              className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800"
            >
              <button
                type="button"
                onClick={() => onOpenChange(false)}
                className="px-3.5 py-1.5 font-medium text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 rounded-md cursor-pointer"
              >
                {API_DETAIL_TEXT.BTN_CANCEL}
              </button>
              <button
                id={API_DETAIL_SEMANTIC_ID.REQ_FORM_BTN_SUBMIT}
                type="submit"
                className="px-4 py-1.5 font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded-md shadow-xs transition-colors cursor-pointer"
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
