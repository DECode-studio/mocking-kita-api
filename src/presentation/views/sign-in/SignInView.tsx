'use client';

import React from 'react';
import { Terminal, Eye, EyeOff, ShieldAlert, ArrowRight } from 'lucide-react';
import { useSignInViewModel } from './useSignInViewModel';

export const SignInView: React.FC = () => {
  const {
    isAuthenticated,
    showPassword,
    setShowPassword,
    authError,
    register,
    handleSubmit,
    errors,
    isSubmitting,
    onSubmit,
    handleUseDemoAccount,
  } = useSignInViewModel();

  if (isAuthenticated) return null;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex antialiased selection:bg-purple-500/30 selection:text-purple-300">
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-slate-950 border-r border-slate-800 p-12 flex-col justify-between">
        <div className="absolute -top-32 -left-32 w-96 h-96 bg-purple-600/20 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute bottom-10 right-10 w-80 h-80 bg-fuchsia-600/15 rounded-full blur-[100px] pointer-events-none" />
        <div className="absolute top-1/2 left-1/3 -translate-y-1/2 w-72 h-72 bg-emerald-500/10 rounded-full blur-[90px] pointer-events-none" />

        <div className="relative z-10 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-brand-gradient flex items-center justify-center text-white shadow-lg shadow-purple-500/30">
            <Terminal className="w-5 h-5" />
          </div>
          <span className="font-display text-lg font-bold tracking-tight text-white">Mock API Studio</span>
        </div>

        <div className="relative z-10 max-w-lg space-y-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-mono font-semibold bg-purple-500/15 text-purple-300 border border-purple-500/30">
            <span className="w-2 h-2 rounded-full bg-purple-400 animate-pulse" />
            OFFLINE-FIRST ENGINE
          </div>

          <h1 className="font-display text-5xl font-bold leading-[1.05] tracking-tight text-white">
            Build predictable APIs <span className="text-gradient">before the backend exists.</span>
          </h1>

          <p className="text-sm text-slate-400 leading-relaxed font-sans">
            Design endpoints, configure weighted response scenarios, manage multi-environment URLs, and test HTTP rules locally with zero cloud dependencies.
          </p>
        </div>

        <div className="relative z-10 pt-8 border-t border-slate-900 flex items-center gap-6 text-xs text-slate-500 font-mono">
          <span>✓ SQLite DB</span>
          <span>✓ REST Scenarios</span>
          <span>✓ Custom Headers</span>
        </div>
      </div>

      <div className="w-full lg:w-1/2 flex flex-col items-center justify-center p-6 sm:p-12 bg-grid-pattern-dark">
        <div className="w-full max-w-md space-y-8">
          <div className="lg:hidden text-center space-y-3">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-brand-gradient text-white shadow-xl shadow-purple-600/30 mb-1">
              <Terminal className="w-6 h-6" />
            </div>
            <h1 className="font-display text-3xl font-bold tracking-tight text-white">Mock API Studio</h1>
            <p className="text-xs text-slate-400">Sign in to access your local mock projects & scenarios</p>
          </div>

          <div className="hidden lg:block space-y-2">
            <h2 className="font-display text-2xl font-bold text-white">Welcome back</h2>
            <p className="text-xs text-slate-400">Sign in to manage your local endpoints and environments</p>
          </div>

          <div className="p-4 bg-slate-900/90 border border-purple-500/30 rounded-2xl space-y-2.5 shadow-xl backdrop-blur-sm">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-semibold text-purple-300">
                <ShieldAlert className="w-4 h-4 text-purple-400" />
                Local Demo Account
              </div>
              <button
                type="button"
                onClick={handleUseDemoAccount}
                className="text-[11px] font-semibold text-purple-400 hover:text-purple-300 underline"
              >
                Auto-fill
              </button>
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs font-mono text-slate-200 bg-slate-950 p-2.5 rounded-xl border border-slate-800">
              <div>
                <span className="text-slate-500 block text-[10px] uppercase font-sans">Username</span>
                admin
              </div>
              <div>
                <span className="text-slate-500 block text-[10px] uppercase font-sans">Password</span>
                admin123
              </div>
            </div>
          </div>

          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 sm:p-8 shadow-2xl space-y-6">
            {authError && (
              <div className="p-3 bg-rose-950/60 border border-rose-800 text-rose-300 text-xs rounded-xl flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 shrink-0 text-rose-400" />
                <span>{authError}</span>
              </div>
            )}

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-2 uppercase tracking-wider font-mono">Username</label>
                <input
                  type="text"
                  {...register('username')}
                  placeholder="admin"
                  className="w-full px-4 py-2.5 text-xs bg-slate-950 border border-slate-800 rounded-xl text-slate-100 placeholder-slate-600 focus:outline-none focus:border-purple-500 focus:ring-4 focus:ring-purple-500/15 font-mono"
                />
                {errors.username && <p className="text-[11px] text-rose-400 mt-1 font-sans">{errors.username.message}</p>}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-2 uppercase tracking-wider font-mono">Password</label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    {...register('password')}
                    placeholder="••••••••"
                    className="w-full px-4 py-2.5 text-xs bg-slate-950 border border-slate-800 rounded-xl text-slate-100 placeholder-slate-600 focus:outline-none focus:border-purple-500 focus:ring-4 focus:ring-purple-500/15 font-mono pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {errors.password && <p className="text-[11px] text-rose-400 mt-1 font-sans">{errors.password.message}</p>}
              </div>

              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    {...register('rememberMe')}
                    className="w-4 h-4 rounded text-purple-600 focus:ring-purple-500 border-slate-700 bg-slate-950"
                  />
                  <span className="text-xs text-slate-400">Remember me</span>
                </label>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3 px-4 text-xs font-semibold text-slate-950 bg-white hover:bg-slate-100 active:bg-slate-200 rounded-xl shadow-lg flex items-center justify-center gap-2 transition-all hover:scale-[1.01] disabled:opacity-50"
              >
                <span>{isSubmitting ? 'Authenticating...' : 'Sign In to Dashboard'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          </div>

          <p className="text-center text-[11px] text-slate-500 font-mono">
            Mock API Studio • High-Contrast Editorial Design
          </p>
        </div>
      </div>
    </div>
  );
};

export default SignInView;
