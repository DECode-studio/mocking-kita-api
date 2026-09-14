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
  onGoogleSsoClick: () => void;
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
  onGoogleSsoClick,
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
          <p className="text-[10px] text-slate-500 mt-1.5 font-sans leading-relaxed">
            {SIGN_IN_TEXT.PASSWORD_HINT}
          </p>
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
          className="w-full py-3 px-4 text-xs font-semibold text-slate-950 bg-white hover:bg-slate-100 active:bg-slate-200 rounded-xl shadow-lg flex items-center justify-center gap-2 transition-all hover:scale-[1.01] disabled:opacity-50 cursor-pointer"
        >
          <span>{isSubmitting ? SIGN_IN_TEXT.SUBMITTING_BTN : SIGN_IN_TEXT.SUBMIT_BTN}</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </form>

      {/* Divider */}
      <div className="relative flex py-2 items-center">
        <div className="grow border-t border-slate-800/80"></div>
        <span className="shrink mx-4 text-slate-500 text-[10px] uppercase font-semibold font-mono tracking-wider">or</span>
        <div className="grow border-t border-slate-800/80"></div>
      </div>

      {/* Google SSO Sign-in Button */}
      <button
        type="button"
        onClick={onGoogleSsoClick}
        className="w-full py-3 px-4 text-xs font-semibold bg-white hover:bg-slate-100 active:bg-slate-200 text-slate-950 rounded-xl shadow-lg flex items-center justify-center gap-2.5 transition-all hover:scale-[1.01] active:scale-[0.99] cursor-pointer"
      >
        <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
          <path
            fill="#4285F4"
            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
          />
          <path
            fill="#34A853"
            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
          />
          <path
            fill="#FBBC05"
            d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
          />
          <path
            fill="#EA4335"
            d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
          />
        </svg>
        <span>Sign In with Google Workspace</span>
      </button>
    </div>
  );
};