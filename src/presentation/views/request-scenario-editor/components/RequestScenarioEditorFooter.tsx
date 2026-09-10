'use client';

import React from 'react';
import { Save, Loader2 } from 'lucide-react';
import { REQUEST_SCENARIO_EDITOR_TEXT } from '../constant';

interface RequestScenarioEditorFooterProps {
  isEditMode: boolean;
  isSaving: boolean;
  onCancel: () => void;
}

export const RequestScenarioEditorFooter: React.FC<RequestScenarioEditorFooterProps> = ({
  isEditMode,
  isSaving,
  onCancel,
}) => {
  return (
    <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-800">
      <button
        type="button"
        onClick={onCancel}
        className="px-4 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 rounded-lg transition-colors cursor-pointer"
      >
        {REQUEST_SCENARIO_EDITOR_TEXT.BTN_CANCEL}
      </button>
      <button
        type="submit"
        disabled={isSaving}
        className="inline-flex items-center gap-1.5 px-5 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded-lg shadow-xs transition-colors cursor-pointer disabled:opacity-50"
      >
        {isSaving ? (
          <Loader2 className="w-3.5 h-3.5 animate-spin" />
        ) : (
          <Save className="w-3.5 h-3.5" />
        )}
        {isEditMode
          ? REQUEST_SCENARIO_EDITOR_TEXT.BTN_SAVE_CHANGES
          : REQUEST_SCENARIO_EDITOR_TEXT.BTN_CREATE_SCENARIO}
      </button>
    </div>
  );
};

