'use client';

import React from 'react';
import { ShieldAlert, Eye, EyeOff, ArrowRight } from 'lucide-react';
import { SIGN_IN_TEXT, SIGN_IN_SEMANTIC_ID } from '../constant';

/* eslint-disable @typescript-eslint/no-explicit-any */
interface SignInFormCardProps {
  authError: string | null;
  showPassword: boolean;
  onToggleShowPassword: () => void;
  register: any;
  handleSubmit: any;
  errors: any;
  isSubmitting: boolean;
  onSubmit: (data: any) => void;
}

export const SignInFormCard: React.FC<SignInFormCardProps> = ({
  authError,
  showPassword,
  onToggleShowPassword,
  register,
  handleSubmit,
  errors,
  isSubmitting,
  onSubmit,
}) => {
  return (
    <div id={SIGN_IN_SEMANTIC_ID.FORM_CARD} className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 sm:p-8 shadow-2xl space-y-6">
      {authError && (
        <div className="p-3 bg-rose-950/60 border border-rose-800 text-rose-300 text-xs rounded-xl flex items-center gap-2">
          <ShieldAlert className="w-4 h-4 shrink-0 text-rose-400" />
          <span>{authError}</span>
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        <div>
          <label htmlFor={SIGN_IN_SEMANTIC_ID.USERNAME_INPUT} className="block text-xs font-semibold text-slate-300 mb-2 uppercase tracking-wider font-mono">
            {SIGN_IN_TEXT.USERNAME_LABEL}
          </label>
          <input
            id={SIGN_IN_SEMANTIC_ID.USERNAME_INPUT}
            type="text"
            autoComplete="username"
            {...register('username')}
            placeholder={SIGN_IN_TEXT.USERNAME_PLACEHOLDER}
            className="w-full px-4 py-2.5 text-xs bg-slate-950 border border-slate-800 rounded-xl text-slate-100 placeholder-slate-600 focus:outline-none focus:border-purple-500 focus:ring-4 focus:ring-purple-500/15 font-mono"
          />
          {errors.username && (
            <p className="text-[11px] text-rose-400 mt-1 font-sans">{errors.username.message}</p>
          )}
        </div>

        <div>
          <label htmlFor={SIGN_IN_SEMANTIC_ID.PASSWORD_INPUT} className="block text-xs font-semibold text-slate-300 mb-2 uppercase tracking-wider font-mono">
            {SIGN_IN_TEXT.PASSWORD_LABEL}
          </label>
          <div className="relative">
            <input
              id={SIGN_IN_SEMANTIC_ID.PASSWORD_INPUT}
              type={showPassword ? 'text' : 'password'}
              autoComplete="current-password"
              {...register('password')}
              placeholder={SIGN_IN_TEXT.PASSWORD_PLACEHOLDER}
              className="w-full px-4 py-2.5 text-xs bg-slate-950 border border-slate-800 rounded-xl text-slate-100 placeholder-slate-600 focus:outline-none focus:border-purple-500 focus:ring-4 focus:ring-purple-500/15 font-mono pr-10"
            />
            <button
              id={SIGN_IN_SEMANTIC_ID.TOGGLE_PASSWORD_BTN}
              type="button"
              onClick={onToggleShowPassword}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200"
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          {errors.password && (
            <p className="text-[11px] text-rose-400 mt-1 font-sans">{errors.password.message}</p>
          )}
        </div>

        <div className="flex items-center justify-between">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              id={SIGN_IN_SEMANTIC_ID.REMEMBER_ME_CHECKBOX}
              type="checkbox"
              {...register('rememberMe')}
              className="w-4 h-4 rounded text-purple-600 focus:ring-purple-500 border-slate-700 bg-slate-950"
            />
            <span className="text-xs text-slate-400">{SIGN_IN_TEXT.REMEMBER_ME}</span>
          </label>
        </div>

        <button
          id={SIGN_IN_SEMANTIC_ID.SUBMIT_BTN}
          type="submit"
          disabled={isSubmitting}
          className="w-full py-3 px-4 text-xs font-semibold text-slate-950 bg-white hover:bg-slate-100 active:bg-slate-200 rounded-xl shadow-lg flex items-center justify-center gap-2 transition-all hover:scale-[1.01] disabled:opacity-50"
        >
          <span>{isSubmitting ? SIGN_IN_TEXT.SUBMITTING_BTN : SIGN_IN_TEXT.SUBMIT_BTN}</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </form>
    </div>
  );
};
