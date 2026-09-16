import React from 'react';
import { KeyRound, Save, Loader2 } from 'lucide-react';
import { ACCOUNT_SETTINGS_TEXT, ACCOUNT_SETTINGS_SEMANTIC_ID } from '../constant';

interface UpdatePasswordCardProps {
  currentPasswordInput: string;
  onCurrentPasswordChange: (value: string) => void;
  newPasswordInput: string;
  onNewPasswordChange: (value: string) => void;
  confirmPasswordInput: string;
  onConfirmPasswordChange: (value: string) => void;
  isSubmitting: boolean;
  onSubmit: (e: React.FormEvent) => void;
}

export const UpdatePasswordCard: React.FC<UpdatePasswordCardProps> = ({
  currentPasswordInput,
  onCurrentPasswordChange,
  newPasswordInput,
  onNewPasswordChange,
  confirmPasswordInput,
  onConfirmPasswordChange,
  isSubmitting,
  onSubmit,
}) => {
  return (
    <div
      id={ACCOUNT_SETTINGS_SEMANTIC_ID.UPDATE_PASSWORD_CARD}
      className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-xs space-y-5"
    >
      <div>
        <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
          <KeyRound className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
          {ACCOUNT_SETTINGS_TEXT.UPDATE_PASSWORD_TITLE}
        </h3>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          {ACCOUNT_SETTINGS_TEXT.UPDATE_PASSWORD_SUBTITLE}
        </p>
      </div>

      <form
        id={ACCOUNT_SETTINGS_SEMANTIC_ID.UPDATE_PASSWORD_FORM}
        onSubmit={onSubmit}
        className="space-y-4 w-full"
      >
        {/* Current Password Input */}
        <div>
          <label
            htmlFor={ACCOUNT_SETTINGS_SEMANTIC_ID.INPUT_CURRENT_PASSWORD}
            className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1"
          >
            {ACCOUNT_SETTINGS_TEXT.CURRENT_PASSWORD_LABEL}
          </label>
          <input
            id={ACCOUNT_SETTINGS_SEMANTIC_ID.INPUT_CURRENT_PASSWORD}
            type="password"
            value={currentPasswordInput}
            onChange={(e) => onCurrentPasswordChange(e.target.value)}
            placeholder={ACCOUNT_SETTINGS_TEXT.CURRENT_PASSWORD_PLACEHOLDER}
            className="w-full px-3 py-2 bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-mono"
          />
        </div>

        {/* New Password Input */}
        <div>
          <label
            htmlFor={ACCOUNT_SETTINGS_SEMANTIC_ID.INPUT_NEW_PASSWORD}
            className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1"
          >
            {ACCOUNT_SETTINGS_TEXT.NEW_PASSWORD_LABEL}
          </label>
          <input
            id={ACCOUNT_SETTINGS_SEMANTIC_ID.INPUT_NEW_PASSWORD}
            type="password"
            required
            minLength={6}
            value={newPasswordInput}
            onChange={(e) => onNewPasswordChange(e.target.value)}
            placeholder={ACCOUNT_SETTINGS_TEXT.NEW_PASSWORD_PLACEHOLDER}
            className="w-full px-3 py-2 bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-mono"
          />
        </div>

        {/* Confirm New Password Input */}
        <div>
          <label
            htmlFor={ACCOUNT_SETTINGS_SEMANTIC_ID.INPUT_CONFIRM_PASSWORD}
            className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1"
          >
            {ACCOUNT_SETTINGS_TEXT.CONFIRM_PASSWORD_LABEL}
          </label>
          <input
            id={ACCOUNT_SETTINGS_SEMANTIC_ID.INPUT_CONFIRM_PASSWORD}
            type="password"
            required
            minLength={6}
            value={confirmPasswordInput}
            onChange={(e) => onConfirmPasswordChange(e.target.value)}
            placeholder={ACCOUNT_SETTINGS_TEXT.CONFIRM_PASSWORD_PLACEHOLDER}
            className="w-full px-3 py-2 bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-mono"
          />
        </div>

        <div className="pt-2">
          <button
            id={ACCOUNT_SETTINGS_SEMANTIC_ID.BTN_SAVE_PASSWORD}
            type="submit"
            disabled={isSubmitting || !newPasswordInput || !confirmPasswordInput}
            className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-lg text-xs font-medium transition-colors cursor-pointer disabled:cursor-not-allowed shadow-xs"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>{ACCOUNT_SETTINGS_TEXT.SAVING}</span>
              </>
            ) : (
              <>
                <Save className="w-3.5 h-3.5" />
                <span>{ACCOUNT_SETTINGS_TEXT.SAVE_CHANGES}</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};
