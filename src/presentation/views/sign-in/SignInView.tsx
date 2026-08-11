'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Terminal } from 'lucide-react';
import { useSignIn } from './useSignIn';
import { SIGN_IN_TEXT, SIGN_IN_SEMANTIC_ID } from './constant';
import { ROUTES } from '@/src/core/constants/routes';
import {
  SignInHeroPanel,
  SignInInfoBanner,
  SignInFormCard,
} from './components';

export const SignInView: React.FC = () => {
  const router = useRouter();
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
  } = useSignIn();

  useEffect(() => {
    if (isAuthenticated) {
      router.replace(ROUTES.DASHBOARD);
    }
  }, [isAuthenticated, router]);

  if (isAuthenticated) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center">
        <p className="text-xs font-mono text-slate-400">Redirecting to dashboard...</p>
      </div>
    );
  }

  return (
    <div id={SIGN_IN_SEMANTIC_ID.CONTAINER} className="min-h-screen bg-slate-950 text-slate-100 flex antialiased selection:bg-purple-500/30 selection:text-purple-300">
      {/* Hero Side Panel (Desktop) */}
      <SignInHeroPanel />

      {/* Main Sign-In Panel */}
      <div className="w-full lg:w-1/2 flex flex-col items-center justify-center p-6 sm:p-12 bg-grid-pattern-dark">
        <div className="w-full max-w-md space-y-8">
          {/* Mobile Header */}
          <div className="lg:hidden text-center space-y-3">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-brand-gradient text-white shadow-xl shadow-purple-600/30 mb-1">
              <Terminal className="w-6 h-6" />
            </div>
            <h1 className="font-display text-3xl font-bold tracking-tight text-white">{SIGN_IN_TEXT.TITLE}</h1>
            <p className="text-xs text-slate-400">{SIGN_IN_TEXT.WELCOME_SUBTITLE}</p>
          </div>

          {/* Desktop Form Title */}
          <div className="hidden lg:block space-y-2">
            <h2 className="font-display text-2xl font-bold text-white">{SIGN_IN_TEXT.WELCOME_BACK}</h2>
            <p className="text-xs text-slate-400">{SIGN_IN_TEXT.WELCOME_SUBTITLE}</p>
          </div>

          {/* Info Banner Card */}
          <SignInInfoBanner />

          {/* Form Card */}
          <SignInFormCard
            authError={authError}
            showPassword={showPassword}
            onToggleShowPassword={() => setShowPassword(!showPassword)}
            register={register}
            handleSubmit={handleSubmit}
            errors={errors}
            isSubmitting={isSubmitting}
            onSubmit={onSubmit}
          />

          <p className="text-center text-[11px] text-slate-500 font-mono">
            {SIGN_IN_TEXT.FOOTER_CREDIT}
          </p>
        </div>
      </div>
    </div>
  );
};

export default SignInView;
