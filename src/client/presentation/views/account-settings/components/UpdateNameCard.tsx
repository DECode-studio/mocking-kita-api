import React from 'react';
import { User, Lock, Save, Loader2 } from 'lucide-react';
import { ACCOUNT_SETTINGS_TEXT, ACCOUNT_SETTINGS_SEMANTIC_ID } from '../constant';
import { UserAccountData } from '../hook/useAccountSettings';

interface UpdateNameCardProps {
  account: UserAccountData | null;
  nameInput: string;
  onNameChange: (value: string) => void;
  isSubmitting: boolean;
  onSubmit: (e: React.FormEvent) => void;
}

export const UpdateNameCard: React.FC<UpdateNameCardProps> = ({
  account,
  nameInput,
  onNameChange,
  isSubmitting,
  onSubmit,
}) => {
  return (
    <div
      id={ACCOUNT_SETTINGS_SEMANTIC_ID.UPDATE_NAME_CARD}
      className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-xs space-y-5"
    >
      <div>
        <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
          <User className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
          {ACCOUNT_SETTINGS_TEXT.UPDATE_NAME_TITLE}
        </h3>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          {ACCOUNT_SETTINGS_TEXT.UPDATE_NAME_SUBTITLE}
        </p>
      </div>

      <form
        id={ACCOUNT_SETTINGS_SEMANTIC_ID.UPDATE_NAME_FORM}
        onSubmit={onSubmit}
        className="space-y-4 w-full"
      >
        {/* Username (Immutable Field) */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
            {ACCOUNT_SETTINGS_TEXT.LABEL_USERNAME}
          </label>
          <div className="relative">
            <input
              id={ACCOUNT_SETTINGS_SEMANTIC_ID.INPUT_USERNAME_DISABLED}
              type="text"
              disabled
              value={account?.username || ''}
              className="w-full px-3 py-2 bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80 rounded-lg text-xs font-mono text-slate-500 dark:text-slate-400 cursor-not-allowed pr-8"
            />
            <Lock className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500 absolute right-3 top-1/2 -translate-y-1/2" />
          </div>
          <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-1">
            {ACCOUNT_SETTINGS_TEXT.USERNAME_DISABLED_HINT}
          </p>
        </div>

        {/* Display Name Input */}
        <div>
          <label
            htmlFor={ACCOUNT_SETTINGS_SEMANTIC_ID.INPUT_NAME}
            className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1"
          >
            {ACCOUNT_SETTINGS_TEXT.NAME_INPUT_LABEL}
          </label>
          <input
            id={ACCOUNT_SETTINGS_SEMANTIC_ID.INPUT_NAME}
            type="text"
            required
            value={nameInput}
            onChange={(e) => onNameChange(e.target.value)}
            placeholder={ACCOUNT_SETTINGS_TEXT.NAME_INPUT_PLACEHOLDER}
            className="w-full px-3 py-2 bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
          />
        </div>

        <div className="pt-2">
          <button
            id={ACCOUNT_SETTINGS_SEMANTIC_ID.BTN_SAVE_NAME}
            type="submit"
            disabled={isSubmitting || !nameInput.trim()}
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
