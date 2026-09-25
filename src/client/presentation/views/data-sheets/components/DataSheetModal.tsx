'use client';

import React from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { Table2, X, List, Code2, AlertCircle, Sparkles, Upload, CopyCheck, Trash2 } from 'lucide-react';
import { DataSheet } from '@/src/client/domain/data-sheet/entity/data_sheet';
import { Project } from '@/src/client/domain/project/entity/project';
import { DATA_SHEET_CATEGORIES, DATA_SHEET_SEMANTIC_ID, DATA_SHEET_TEXT } from '../constant';
import { useDataSheetModal } from '../hook';

interface DataSheetModalProps {
  isOpen: boolean;
  onClose: () => void;
  editingSheet: DataSheet | null;
  projects: Project[];
  defaultProjectId?: string;
  onSave: (input: {
    id?: string;
    projectId?: string | null;
    name: string;
    code: string;
    category?: string | null;
    description?: string | null;
    format: 'LIST' | 'TABLE';
    data: any[];
    status?: boolean;
  }) => Promise<void>;
}

export const DataSheetModal: React.FC<DataSheetModalProps> = ({
  isOpen,
  onClose,
  editingSheet,
  projects,
  defaultProjectId,
  onSave,
}) => {
  const {
    projectId,
    setProjectId,
    name,
    code,
    setCode,
    category,
    setCategory,
    description,
    setDescription,
    format,
    inputMode,
    linesText,
    setLinesText,
    jsonText,
    setJsonText,
    isSubmitting,
    errorMessage,
    fileInputRef,
    currentCount,
    handleNameChange,
    handleFormatChange,
    handleSwitchToJsonMode,
    handleSwitchToLinesMode,
    handleFileUpload,
    handleDeduplicate,
    handleFormatJson,
    handleClearData,
    handleSubmit,
  } = useDataSheetModal({
    isOpen,
    editingSheet,
    defaultProjectId,
    onSave,
    onClose,
  });

  return (
    <Dialog.Root open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs z-50 animate-in fade-in" />
        <Dialog.Content
          id={DATA_SHEET_SEMANTIC_ID.MODAL_FORM}
          className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-2xl z-50 max-h-[90vh] overflow-y-auto space-y-5"
        >
          {/* Header */}
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-purple-500/10 dark:bg-purple-500/20 text-purple-600 dark:text-purple-400 flex items-center justify-center">
                <Table2 className="w-4 h-4" />
              </div>
              <div>
                <Dialog.Title className="text-base font-bold text-slate-900 dark:text-white">
                  {editingSheet ? DATA_SHEET_TEXT.MODAL_TITLE_EDIT : DATA_SHEET_TEXT.MODAL_TITLE_CREATE}
                </Dialog.Title>
                <Dialog.Description className="text-xs text-slate-500 dark:text-slate-400">
                  {DATA_SHEET_TEXT.MODAL_SUBTITLE}
                </Dialog.Description>
              </div>
            </div>
            <button
              id={DATA_SHEET_SEMANTIC_ID.MODAL_FORM_BTN_CLOSE}
              onClick={onClose}
              className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {errorMessage && (
            <div className="p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 rounded-xl text-rose-600 dark:text-rose-400 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Project & Format Row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  {DATA_SHEET_TEXT.PROJECT_LABEL}
                </label>
                <select
                  id={DATA_SHEET_SEMANTIC_ID.MODAL_FORM_SELECT_PROJECT}
                  value={projectId}
                  onChange={(e) => setProjectId(e.target.value)}
                  className="w-full text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-purple-500 cursor-pointer"
                >
                  <option value="">{DATA_SHEET_TEXT.GLOBAL_SHEET}</option>
                  {projects.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  {DATA_SHEET_TEXT.FORMAT_LABEL}
                </label>
                <select
                  id={DATA_SHEET_SEMANTIC_ID.MODAL_FORM_SELECT_FORMAT}
                  value={format}
                  onChange={(e) => handleFormatChange(e.target.value as 'LIST' | 'TABLE')}
                  className="w-full text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-purple-500 cursor-pointer"
                >
                  <option value="LIST">{DATA_SHEET_TEXT.FORMAT_LIST}</option>
                  <option value="TABLE">{DATA_SHEET_TEXT.FORMAT_TABLE}</option>
                </select>
              </div>
            </div>

            {/* Name & Code Row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  {DATA_SHEET_TEXT.NAME_LABEL} <span className="text-rose-500">*</span>
                </label>
                <input
                  id={DATA_SHEET_SEMANTIC_ID.MODAL_FORM_INPUT_NAME}
                  type="text"
                  required
                  placeholder={DATA_SHEET_TEXT.NAME_PLACEHOLDER}
                  value={name}
                  onChange={(e) => handleNameChange(e.target.value)}
                  className="w-full text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  {DATA_SHEET_TEXT.CODE_LABEL} <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <input
                    id={DATA_SHEET_SEMANTIC_ID.MODAL_FORM_INPUT_CODE}
                    type="text"
                    required
                    placeholder={DATA_SHEET_TEXT.CODE_PLACEHOLDER}
                    value={code}
                    onChange={(e) => setCode(e.target.value.toLowerCase().trim())}
                    className="w-full text-xs font-mono bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>
              </div>
            </div>

            {/* Category & Description */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  {DATA_SHEET_TEXT.CATEGORY_LABEL}
                </label>
                <select
                  id={DATA_SHEET_SEMANTIC_ID.MODAL_FORM_SELECT_CATEGORY}
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-purple-500 cursor-pointer"
                >
                  {category && !DATA_SHEET_CATEGORIES.includes(category) && (
                    <option value={category}>{category}</option>
                  )}
                  {DATA_SHEET_CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  {DATA_SHEET_TEXT.DESC_LABEL}
                </label>
                <input
                  id={DATA_SHEET_SEMANTIC_ID.MODAL_FORM_INPUT_DESC}
                  type="text"
                  placeholder={DATA_SHEET_TEXT.DESC_PLACEHOLDER}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>
            </div>

            {/* Variable Tag Preview */}
            {code && (
              <div className="flex items-center gap-2 p-2.5 rounded-lg bg-purple-50/70 dark:bg-purple-950/30 border border-purple-100 dark:border-purple-800 text-xs text-purple-700 dark:text-purple-300">
                <Sparkles className="w-4 h-4 shrink-0 text-purple-500" />
                <span>
                  {DATA_SHEET_TEXT.VARIABLE_SYNTAX_LABEL}{' '}
                  <code className="font-bold font-mono">
                    {format === 'TABLE' ? `{{datasheet.${code}.random.<property>}}` : `{{datasheet.${code}.random}}`}
                  </code>{' '}
                  {DATA_SHEET_TEXT.OR_LABEL}{' '}
                  <code className="font-bold font-mono">{`{{datasheet.${code}[0]}}`}</code>
                </span>
              </div>
            )}

            {/* Data Editor Tabs */}
            <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              <input
                id={DATA_SHEET_SEMANTIC_ID.MODAL_FORM_FILE_INPUT}
                ref={fileInputRef}
                type="file"
                accept=".csv,.txt,.json"
                onChange={handleFileUpload}
                className="hidden"
              />

              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  {DATA_SHEET_TEXT.DATA_VALUES_LABEL} <span className="text-slate-400 font-normal">({DATA_SHEET_TEXT.ELEMENTS_COUNT(currentCount)})</span>
                </label>

                <div className="flex items-center gap-1.5 flex-wrap">
                  {/* Mode Toggle for LIST format */}
                  {format === 'LIST' && (
                    <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-0.5 rounded-lg">
                      <button
                        id={DATA_SHEET_SEMANTIC_ID.MODAL_FORM_TAB_LINES}
                        type="button"
                        onClick={handleSwitchToLinesMode}
                        className={`text-[11px] px-2.5 py-1 rounded-md font-medium transition-colors flex items-center gap-1 cursor-pointer ${
                          inputMode === 'lines'
                            ? 'bg-white dark:bg-slate-700 text-purple-600 dark:text-purple-400 shadow-xs'
                            : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                        }`}
                      >
                        <List className="w-3 h-3" /> {DATA_SHEET_TEXT.TAB_LINES}
                      </button>
                      <button
                        id={DATA_SHEET_SEMANTIC_ID.MODAL_FORM_TAB_JSON}
                        type="button"
                        onClick={handleSwitchToJsonMode}
                        className={`text-[11px] px-2.5 py-1 rounded-md font-medium transition-colors flex items-center gap-1 cursor-pointer ${
                          inputMode === 'json'
                            ? 'bg-white dark:bg-slate-700 text-purple-600 dark:text-purple-400 shadow-xs'
                            : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                        }`}
                      >
                        <Code2 className="w-3 h-3" /> {DATA_SHEET_TEXT.TAB_JSON}
                      </button>
                    </div>
                  )}

                  {/* Utility Actions */}
                  <button
                    id={DATA_SHEET_SEMANTIC_ID.MODAL_FORM_BTN_UPLOAD}
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="inline-flex items-center gap-1 text-[11px] px-2 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-medium transition-colors cursor-pointer"
                    title={DATA_SHEET_TEXT.FILE_UPLOAD_TOOLTIP}
                  >
                    <Upload className="w-3 h-3 text-purple-500" />
                    <span>{DATA_SHEET_TEXT.BTN_UPLOAD_FILE}</span>
                  </button>

                  <button
                    id={DATA_SHEET_SEMANTIC_ID.MODAL_FORM_BTN_DEDUPLICATE}
                    type="button"
                    onClick={handleDeduplicate}
                    className="inline-flex items-center gap-1 text-[11px] px-2 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-medium transition-colors cursor-pointer"
                    title={DATA_SHEET_TEXT.DEDUPLICATE_TOOLTIP}
                  >
                    <CopyCheck className="w-3 h-3 text-emerald-500" />
                    <span>{DATA_SHEET_TEXT.DEDUPLICATE_BTN}</span>
                  </button>

                  {inputMode === 'json' && (
                    <button
                      id={DATA_SHEET_SEMANTIC_ID.MODAL_FORM_BTN_FORMAT_JSON}
                      type="button"
                      onClick={handleFormatJson}
                      className="inline-flex items-center gap-1 text-[11px] px-2 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-medium transition-colors cursor-pointer"
                      title={DATA_SHEET_TEXT.FORMAT_JSON_TOOLTIP}
                    >
                      <Sparkles className="w-3 h-3 text-amber-500" />
                      <span>{DATA_SHEET_TEXT.FORMAT_JSON_BTN}</span>
                    </button>
                  )}

                  <button
                    id={DATA_SHEET_SEMANTIC_ID.MODAL_FORM_BTN_CLEAR}
                    type="button"
                    onClick={handleClearData}
                    className="p-1 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors cursor-pointer"
                    title={DATA_SHEET_TEXT.CLEAR_DATA_TOOLTIP}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {inputMode === 'lines' && format === 'LIST' ? (
                <div>
                  <textarea
                    id={DATA_SHEET_SEMANTIC_ID.MODAL_FORM_TEXTAREA_LINES}
                    rows={7}
                    placeholder={DATA_SHEET_TEXT.LINES_PLACEHOLDER_LIST}
                    value={linesText}
                    onChange={(e) => setLinesText(e.target.value)}
                    className="w-full text-xs font-mono bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-3 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-purple-500 leading-relaxed"
                  />
                  <p className="text-[11px] text-slate-400 mt-1">
                    {DATA_SHEET_TEXT.LINES_HINT}
                  </p>
                </div>
              ) : (
                <div>
                  <textarea
                    id={DATA_SHEET_SEMANTIC_ID.MODAL_FORM_TEXTAREA_JSON}
                    rows={7}
                    placeholder={format === 'TABLE' ? DATA_SHEET_TEXT.LINES_PLACEHOLDER_TABLE : DATA_SHEET_TEXT.JSON_PLACEHOLDER}
                    value={jsonText}
                    onChange={(e) => setJsonText(e.target.value)}
                    className="w-full text-xs font-mono bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-3 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-purple-500 leading-relaxed"
                  />
                  <p className="text-[11px] text-slate-400 mt-1">
                    {DATA_SHEET_TEXT.JSON_HINT}
                  </p>
                </div>
              )}
            </div>

            {/* Footer Buttons */}
            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
              <button
                id={DATA_SHEET_SEMANTIC_ID.MODAL_FORM_BTN_CANCEL}
                type="button"
                onClick={onClose}
                disabled={isSubmitting}
                className="text-xs px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              >
                {DATA_SHEET_TEXT.BTN_CANCEL}
              </button>
              <button
                id={DATA_SHEET_SEMANTIC_ID.MODAL_FORM_BTN_SUBMIT}
                type="submit"
                disabled={isSubmitting}
                className="text-xs font-semibold px-5 py-2 rounded-lg bg-purple-600 hover:bg-purple-700 text-white shadow-xs transition-colors flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
              >
                {isSubmitting ? DATA_SHEET_TEXT.BTN_SAVING : DATA_SHEET_TEXT.BTN_SAVE}
              </button>
            </div>
          </form>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
};
