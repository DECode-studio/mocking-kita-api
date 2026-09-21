import { Shield, KeyRound, CheckCircle2 } from 'lucide-react';
import { ACCOUNT_SETTINGS_TEXT, ACCOUNT_SETTINGS_SEMANTIC_ID } from '../constant';
import { UserAccountData } from '../hook/useAccountSettings';

interface UserProfileCardProps {
  account: UserAccountData | null;
  isLoading: boolean;
}

export const UserProfileCard: React.FC<UserProfileCardProps> = ({ account, isLoading }) => {
  if (isLoading) {
    return (
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 animate-pulse space-y-4">
        <div className="h-5 bg-slate-200 dark:bg-slate-800 rounded w-1/4"></div>
        <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-1/2"></div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4">
          <div className="h-12 bg-slate-100 dark:bg-slate-800 rounded-lg"></div>
          <div className="h-12 bg-slate-100 dark:bg-slate-800 rounded-lg"></div>
        </div>
      </div>
    );
  }

  if (!account) return null;

  const initials = account.name
    ? account.name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .substring(0, 2)
    : 'US';

  return (
    <div
      id={ACCOUNT_SETTINGS_SEMANTIC_ID.PROFILE_CARD}
      className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-xs space-y-6"
    >
      <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-indigo-600 text-white font-bold text-base flex items-center justify-center shadow-md">
            {initials}
          </div>
          <div>
            <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">
              {account.name}
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-mono">
              @{account.username}
            </p>
          </div>
        </div>

        <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 rounded-lg text-xs font-medium border border-indigo-200/50 dark:border-indigo-800/50">
          <Shield className="w-3.5 h-3.5" />
          <span>{account.role}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-xs">
        <div className="p-3.5 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-100 dark:border-slate-800">
          <span className="text-slate-400 dark:text-slate-500 block mb-1 font-medium">
            {ACCOUNT_SETTINGS_TEXT.LABEL_ID}
          </span>
          <span className="font-mono text-slate-800 dark:text-slate-200 break-all">
            {account.id}
          </span>
        </div>

        <div className="p-3.5 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-100 dark:border-slate-800">
          <span className="text-slate-400 dark:text-slate-500 block mb-1 font-medium">
            {ACCOUNT_SETTINGS_TEXT.LABEL_USERNAME}
          </span>
          <span className="font-mono text-slate-800 dark:text-slate-200">
            {account.username}
          </span>
        </div>

        <div className="p-3.5 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-100 dark:border-slate-800">
          <span className="text-slate-400 dark:text-slate-500 block mb-1 font-medium">
            {ACCOUNT_SETTINGS_TEXT.LABEL_SSO}
          </span>
          {account.googleId ? (
            <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-medium">
              <CheckCircle2 className="w-3.5 h-3.5" />
              {ACCOUNT_SETTINGS_TEXT.SSO_LINKED}
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 text-slate-600 dark:text-slate-400 font-medium">
              <KeyRound className="w-3.5 h-3.5" />
              {ACCOUNT_SETTINGS_TEXT.SSO_NOT_LINKED}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};
