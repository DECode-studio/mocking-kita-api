'use client';

import React from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import {
  X,
  Boxes,
  FileCode,
  CheckCircle2,
  AlertCircle,
  Link2,
  Layers,
  Globe,
  AlertTriangle,
} from 'lucide-react';
import { Project } from '@/src/client/domain/project/entity/project';
import { SCENARIO_FLOWS_SEMANTIC_ID, SCENARIO_FLOWS_TEXT } from '../constant';
import { useImportInsomniaModal } from '../hook';

interface ImportInsomniaModalProps {
  isOpen: boolean;
  onClose: () => void;
  projectId?: string;
  projects?: Project[];
  onSuccess: (result: any) => void;
  onImportFlow?: (targetProjectId: string, template: any) => Promise<any>;
}

export const ImportInsomniaModal: React.FC<ImportInsomniaModalProps> = ({
  isOpen,
  onClose,
  projectId,
  projects = [],
  onSuccess,
  onImportFlow,
}) => {
  const {
    targetProjectId,
    setTargetProjectId,
    content,
    setContent,
    fileName,
    error,
    setError,
    conversionResult,
    isSubmitting,
    fileInputRef,
    handleFileUpload,
    handleImport,
    insertSampleInsomnia,
  } = useImportInsomniaModal({
    isOpen,
    projectId,
    onSuccess,
    onImportFlow,
    onClose,
  });

  const summary = conversionResult?.summary;

  return (
    <Dialog.Root open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs z-50 animate-in fade-in" />
        <Dialog.Content
          id={SCENARIO_FLOWS_SEMANTIC_ID.MODAL_IMPORT_INSOMNIA}
          className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-2xl z-50 max-h-[90vh] overflow-y-auto space-y-5"
        >
          {/* Header */}
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-purple-500/10 dark:bg-purple-500/20 text-purple-600 dark:text-purple-400 flex items-center justify-center shadow-xs">
                <Boxes className="w-5 h-5" />
              </div>
              <div>
                <Dialog.Title className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <span>{SCENARIO_FLOWS_TEXT.INSOMNIA_MODAL_TITLE}</span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-purple-100 dark:bg-purple-950/70 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800/60">
                    YAML / JSON v5
                  </span>
                </Dialog.Title>
                <Dialog.Description className="text-xs text-slate-500 dark:text-slate-400">
                  {SCENARIO_FLOWS_TEXT.INSOMNIA_MODAL_SUBTITLE}
                </Dialog.Description>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Upsert highlight info banner */}
          <div className="p-3 bg-purple-500/10 border border-purple-500/20 rounded-xl text-xs space-y-1.5 text-purple-900 dark:text-purple-200">
            <div className="flex items-center gap-2 font-semibold">
              <CheckCircle2 className="w-4 h-4 text-purple-600 dark:text-purple-400 shrink-0" />
              <span>{SCENARIO_FLOWS_TEXT.MODAL_IMPORT_UPSERT_ENGINE}</span>
            </div>
            <p className="text-[11px] text-purple-800/80 dark:text-purple-300/80 pl-6">
              {SCENARIO_FLOWS_TEXT.MODAL_IMPORT_UPSERT_DESC}
            </p>
          </div>

          {/* Target Project Selector (when not bound to a project) */}
          {!projectId && (
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                {SCENARIO_FLOWS_TEXT.MODAL_IMPORT_PROJECT_LABEL} <span className="text-rose-500">*</span>
              </label>
              <select
                id={SCENARIO_FLOWS_SEMANTIC_ID.MODAL_IMPORT_INSOMNIA_SELECT_PROJECT}
                value={targetProjectId}
                onChange={(e) => {
                  setTargetProjectId(e.target.value);
                  setError(null);
                }}
                className="w-full px-3.5 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-purple-500/30"
              >
                <option value="">{SCENARIO_FLOWS_TEXT.MODAL_IMPORT_TARGET_PROJECT_PLACEHOLDER}</option>
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
            className="border-2 border-dashed border-slate-200 dark:border-slate-800 hover:border-purple-500/50 dark:hover:border-purple-500/50 rounded-xl p-5 text-center cursor-pointer transition-colors bg-slate-50/50 dark:bg-slate-950/40 space-y-2"
          >
            <input
              id={SCENARIO_FLOWS_SEMANTIC_ID.MODAL_IMPORT_INSOMNIA_FILE_INPUT}
              type="file"
              ref={fileInputRef}
              accept=".yaml,.yml,.json,application/json,application/x-yaml,text/yaml"
              onChange={handleFileUpload}
              className="hidden"
            />
            <FileCode className="w-8 h-8 mx-auto text-purple-500/80 dark:text-purple-400" />
            <div className="text-xs">
              <span className="font-semibold text-purple-600 dark:text-purple-400">
                {SCENARIO_FLOWS_TEXT.MODAL_INSOMNIA_CLICK_UPLOAD}
              </span>{' '}
              <span className="text-slate-500">{SCENARIO_FLOWS_TEXT.MODAL_INSOMNIA_OR_PASTE_HINT}</span>
            </div>
            {fileName && (
              <p className="text-xs font-mono text-emerald-600 dark:text-emerald-400 font-semibold">
                {SCENARIO_FLOWS_TEXT.MODAL_IMPORT_SELECTED_PREFIX}{fileName}
              </p>
            )}
          </div>

          {/* Conversion Live Preview Summary */}
          {summary && (
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800/80 space-y-3">
              <div className="flex items-center justify-between text-xs font-semibold text-slate-800 dark:text-slate-200">
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  {SCENARIO_FLOWS_TEXT.MODAL_INSOMNIA_PREVIEW_TITLE}: {conversionResult.template.flow.name}
                </span>
                <span className="text-[11px] text-slate-500 font-normal">
                  v{conversionResult.template.version}
                </span>
              </div>

              <div className="grid grid-cols-3 gap-2.5">
                <div className="p-2.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center gap-2">
                  <Layers className="w-4 h-4 text-indigo-500 shrink-0" />
                  <div>
                    <div className="text-[10px] text-slate-500 dark:text-slate-400">{SCENARIO_FLOWS_TEXT.MODAL_INSOMNIA_STAT_REQUESTS}</div>
                    <div className="text-sm font-bold text-slate-900 dark:text-white">{summary.totalRequests}</div>
                  </div>
                </div>

                <div className="p-2.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center gap-2">
                  <Link2 className="w-4 h-4 text-purple-500 shrink-0" />
                  <div>
                    <div className="text-[10px] text-slate-500 dark:text-slate-400">{SCENARIO_FLOWS_TEXT.MODAL_INSOMNIA_STAT_CHAINS}</div>
                    <div className="text-sm font-bold text-slate-900 dark:text-white">{summary.totalResponseTags}</div>
                  </div>
                </div>

                <div className="p-2.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center gap-2">
                  <Globe className="w-4 h-4 text-emerald-500 shrink-0" />
                  <div>
                    <div className="text-[10px] text-slate-500 dark:text-slate-400">{SCENARIO_FLOWS_TEXT.MODAL_INSOMNIA_STAT_ENVS}</div>
                    <div className="text-sm font-bold text-slate-900 dark:text-white">{summary.environmentsCount}</div>
                  </div>
                </div>
              </div>

              {/* Warnings / Notices */}
              {summary.warnings.length > 0 && (
                <div className="space-y-1 pt-1">
                  {summary.warnings.map((warn, i) => (
                    <div
                      key={i}
                      className="flex items-start gap-2 p-2 rounded-lg bg-amber-500/10 border border-amber-500/20 text-[11px] text-amber-700 dark:text-amber-300"
                    >
                      <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5 text-amber-600 dark:text-amber-400" />
                      <span>{warn}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Insomnia YAML/JSON Textarea */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                {SCENARIO_FLOWS_TEXT.MODAL_INSOMNIA_TEXTAREA_LABEL}
              </label>
              <button
                id={SCENARIO_FLOWS_SEMANTIC_ID.MODAL_IMPORT_INSOMNIA_SAMPLE_BTN}
                type="button"
                onClick={insertSampleInsomnia}
                className="text-[11px] text-purple-600 dark:text-purple-400 hover:underline cursor-pointer"
              >
                {SCENARIO_FLOWS_TEXT.MODAL_INSOMNIA_SAMPLE_BTN}
              </button>
            </div>
            <textarea
              id={SCENARIO_FLOWS_SEMANTIC_ID.MODAL_IMPORT_INSOMNIA_TEXTAREA}
              rows={7}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder={SCENARIO_FLOWS_TEXT.MODAL_INSOMNIA_TEXTAREA_PLACEHOLDER}
              className="w-full px-3.5 py-2.5 text-xs font-mono rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-950 text-slate-200 focus:outline-hidden focus:ring-2 focus:ring-purple-500/30 focus:border-purple-500"
            />
          </div>

          {error && (
            <div className="flex items-start gap-2 p-3 bg-rose-500/10 border border-rose-500/20 rounded-lg text-xs text-rose-600 dark:text-rose-400">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100 dark:border-slate-800">
            <button
              id={SCENARIO_FLOWS_SEMANTIC_ID.MODAL_IMPORT_INSOMNIA_BTN_CANCEL}
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
            >
              {SCENARIO_FLOWS_TEXT.CANCEL_BTN}
            </button>
            <button
              id={SCENARIO_FLOWS_SEMANTIC_ID.MODAL_IMPORT_INSOMNIA_BTN_SUBMIT}
              type="button"
              onClick={handleImport}
              disabled={isSubmitting || !content.trim()}
              className="px-4 py-2 text-xs font-semibold text-white bg-purple-600 hover:bg-purple-500 active:bg-purple-700 rounded-lg shadow-sm shadow-purple-500/20 disabled:opacity-50 transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <Boxes className="w-3.5 h-3.5" />
              {isSubmitting
                ? SCENARIO_FLOWS_TEXT.MODAL_INSOMNIA_SUBMITTING_BTN
                : SCENARIO_FLOWS_TEXT.MODAL_INSOMNIA_SUBMIT_BTN}
            </button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
};
