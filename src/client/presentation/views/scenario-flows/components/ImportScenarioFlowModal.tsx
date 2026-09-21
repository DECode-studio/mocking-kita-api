'use client';

import React, { useState, useRef } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { X, UploadCloud, FileJson, CheckCircle2, AlertCircle } from 'lucide-react';
import { getErrorMessage } from '@/src/core/utils/error';
import { Project } from '@/src/client/domain/project/entity/project';
import { SCENARIO_FLOWS_TEXT, SCENARIO_FLOWS_SEMANTIC_ID } from '../constant';

interface ImportScenarioFlowModalProps {
  isOpen: boolean;
  onClose: () => void;
  projectId?: string;
  projects?: Project[];
  onSuccess: (result: any) => void;
  onImportFlow?: (targetProjectId: string, template: any) => Promise<any>;
}

export const ImportScenarioFlowModal: React.FC<ImportScenarioFlowModalProps> = ({
  isOpen,
  onClose,
  projectId,
  projects = [],
  onSuccess,
  onImportFlow,
}) => {
  const [targetProjectId, setTargetProjectId] = useState(projectId || '');
  const [jsonText, setJsonText] = useState('');
  const [fileName, setFileName] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    setError(null);
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        // Validate format
        JSON.parse(text);
        setJsonText(text);
      } catch {
        setError('The selected file contains invalid JSON.');
      }
    };
    reader.readAsText(file);
  };

  const handleImport = async () => {
    const effectiveProjectId = targetProjectId || projectId;
    if (!effectiveProjectId) {
      setError('Please select a target project for imported APIs and Scenarios.');
      return;
    }

    if (!jsonText.trim()) {
      setError('Please provide or upload a JSON template.');
      return;
    }

    let parsed: any;
    try {
      parsed = JSON.parse(jsonText);
    } catch {
      setError('Invalid JSON syntax. Please check the JSON format.');
      return;
    }

    setIsSubmitting(true);
    setError(null);
    try {
      if (onImportFlow) {
        const res = await onImportFlow(effectiveProjectId, parsed);
        onSuccess(res);
        setJsonText('');
        setFileName(null);
      }
    } catch (err) {
      setError(getErrorMessage(err, 'Failed to import scenario flow.'));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog.Root open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs z-50 animate-in fade-in" />
        <Dialog.Content
          id={SCENARIO_FLOWS_SEMANTIC_ID.MODAL_IMPORT}
          className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-2xl z-50 max-h-[90vh] overflow-y-auto space-y-5"
        >
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-indigo-500/10 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                <UploadCloud className="w-4 h-4" />
              </div>
              <div>
                <Dialog.Title className="text-base font-bold text-slate-900 dark:text-white">
                  Import Scenario Flow
                </Dialog.Title>
                <Dialog.Description className="text-xs text-slate-500 dark:text-slate-400">
                  Import JSON template with intelligent Upsert
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

          {/* Upsert highlight info banner */}
          <div className="p-3 bg-purple-500/10 border border-purple-500/20 rounded-xl text-xs space-y-1.5 text-purple-900 dark:text-purple-200">
            <div className="flex items-center gap-2 font-semibold">
              <CheckCircle2 className="w-4 h-4 text-purple-600 dark:text-purple-400 shrink-0" />
              <span>Smart Upsert Engine</span>
            </div>
            <p className="text-[11px] text-purple-800/80 dark:text-purple-300/80 pl-6">
              If the template contains APIs or Request/Response Scenarios that don't exist yet in the target project, they will be automatically generated and linked!
            </p>
          </div>

          {/* Target Project Selector (when not bound to a project) */}
          {!projectId && (
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Target Project for APIs <span className="text-rose-500">*</span>
              </label>
              <select
                value={targetProjectId}
                onChange={(e) => {
                  setTargetProjectId(e.target.value);
                  setError(null);
                }}
                className="w-full px-3.5 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-purple-500/30"
              >
                <option value="">-- Select Target Project --</option>
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* File drag-and-drop / upload */}
          <div
            onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed border-slate-200 dark:border-slate-800 hover:border-purple-500/50 dark:hover:border-purple-500/50 rounded-xl p-6 text-center cursor-pointer transition-colors bg-slate-50/50 dark:bg-slate-950/40 space-y-2"
          >
            <input
              type="file"
              ref={fileInputRef}
              accept=".json,application/json"
              onChange={handleFileUpload}
              className="hidden"
            />
            <FileJson className="w-8 h-8 mx-auto text-slate-400 dark:text-slate-500" />
            <div className="text-xs">
              <span className="font-semibold text-purple-600 dark:text-purple-400">
                Click to upload JSON file
              </span>{' '}
              <span className="text-slate-500">or paste content below</span>
            </div>
            {fileName && (
              <p className="text-xs font-mono text-emerald-600 dark:text-emerald-400 font-semibold">
                Selected: {fileName}
              </p>
            )}
          </div>

          {/* JSON Textarea */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Template JSON
              </label>
              <button
                type="button"
                onClick={() => {
                  setJsonText(
                    JSON.stringify(
                      {
                        $schema: 'mock-api-studio/scenario-flow/v1',
                        flow: {
                          name: 'Sample Auth & User Flow',
                          description: 'Auto-chained login and profile retrieve',
                          stopOnFailure: true,
                        },
                        steps: [
                          {
                            order: 1,
                            name: 'User Login',
                            api: { method: 'POST', path: '/api/v1/auth/login' },
                            requestPayload: {
                              body: { email: 'user@example.com', password: 'password123' },
                            },
                            extractors: [{ variable: 'token', from: 'body', path: 'data.token' }],
                            assertions: [{ type: 'statusCode', operator: 'equals', expected: 200 }],
                          },
                          {
                            order: 2,
                            name: 'Get Profile',
                            api: { method: 'GET', path: '/api/v1/users/me' },
                            overrides: { headers: { Authorization: 'Bearer {{token}}' } },
                            assertions: [{ type: 'statusCode', operator: 'equals', expected: 200 }],
                          },
                        ],
                      },
                      null,
                      2
                    )
                  );
                  setError(null);
                }}
                className="text-[11px] text-purple-600 dark:text-purple-400 hover:underline"
              >
                Insert Sample Template
              </button>
            </div>
            <textarea
              rows={8}
              value={jsonText}
              onChange={(e) => {
                setJsonText(e.target.value);
                setError(null);
              }}
              placeholder="Paste scenario flow template JSON here..."
              className="w-full px-3.5 py-2.5 text-xs font-mono rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-950 text-slate-200 focus:outline-hidden focus:ring-2 focus:ring-purple-500/30 focus:border-purple-500"
            />
          </div>

          {error && (
            <div className="flex items-start gap-2 p-3 bg-rose-500/10 border border-rose-500/20 rounded-lg text-xs text-rose-600 dark:text-rose-400">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

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
              type="button"
              onClick={handleImport}
              disabled={isSubmitting || !jsonText.trim()}
              className="px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 rounded-lg shadow-sm shadow-indigo-500/20 disabled:opacity-50 transition-all flex items-center gap-1.5"
            >
              <UploadCloud className="w-3.5 h-3.5" />
              {isSubmitting ? 'Importing & Upserting...' : 'Import & Upsert'}
            </button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
};
