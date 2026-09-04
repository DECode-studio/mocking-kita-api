'use client';

import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { LoaderCircle } from 'lucide-react';
import { cn } from '@/src/core/utils/cn';

interface PageLoadingOverlayProps {
  open: boolean;
  title?: string;
  description?: string;
  className?: string;
}

type LoadingOverlayOptions = {
  title?: string;
  description?: string;
};

type LoadingOverlayEntry = Required<LoadingOverlayOptions> & {
  id: string;
};

type PageLoadingOverlayContextValue = {
  show: (options?: LoadingOverlayOptions) => string;
  hide: (id?: string) => void;
  run: <T>(options: LoadingOverlayOptions, operation: () => Promise<T>) => Promise<T>;
  isVisible: boolean;
};

const DEFAULT_TITLE = 'Processing';
const DEFAULT_DESCRIPTION = 'Please wait while the request completes.';
const noopPageLoadingOverlay: PageLoadingOverlayContextValue = {
  show: () => 'loading-noop',
  hide: () => undefined,
  run: async (_options, operation) => operation(),
  isVisible: false,
};
const PageLoadingOverlayContext = createContext<PageLoadingOverlayContextValue>(noopPageLoadingOverlay);

export const PageLoadingOverlay: React.FC<PageLoadingOverlayProps> = ({
  open,
  title = DEFAULT_TITLE,
  description = DEFAULT_DESCRIPTION,
  className,
}) => {
  return (
    <Dialog.Root open={open} onOpenChange={() => undefined}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-10000 bg-slate-950/70 backdrop-blur-md transition-all duration-300 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
        <Dialog.Content
          className={cn(
            'fixed left-1/2 top-1/2 z-10000 flex w-[calc(100vw-2.5rem)] max-w-sm -translate-x-1/2 -translate-y-1/2 flex-col items-center gap-4 rounded-2xl border border-slate-700/60 bg-slate-900/85 p-6 text-center shadow-2xl backdrop-blur-xl focus:outline-none transition-all duration-300 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 overflow-hidden',
            className
          )}
          onEscapeKeyDown={(event) => event.preventDefault()}
          onPointerDownOutside={(event) => event.preventDefault()}
          onInteractOutside={(event) => event.preventDefault()}
        >
          {/* Ambient Glows */}
          <div className="absolute -top-12 -left-12 h-32 w-32 rounded-full bg-indigo-500/20 blur-2xl pointer-events-none" />
          <div className="absolute -bottom-12 -right-12 h-32 w-32 rounded-full bg-purple-500/20 blur-2xl pointer-events-none" />
          
          {/* Subtle Top Gradient Border */}
          <div className="absolute inset-x-0 top-0 h-0.5 bg-linear-to-r from-transparent via-indigo-500 to-transparent opacity-80" />

          {/* Animated Spinner Graphic */}
          <div className="relative flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-950/60 border border-slate-800/80 shadow-inner">
            {/* Pulsing Backlight */}
            <div className="absolute inset-0 rounded-2xl bg-indigo-500/10 blur-sm animate-pulse" />
            
            {/* Outer Orbit Spinner */}
            <div className="absolute inset-1 rounded-xl border-2 border-transparent border-t-indigo-500 border-r-purple-500 animate-spin duration-700" />
            
            {/* Inner Counter-Orbit Spinner */}
            <div className="absolute inset-2.5 rounded-lg border-2 border-transparent border-b-cyan-400 border-l-indigo-400 animate-spin duration-1000 [animation-direction:reverse]" />
            
            {/* Center Icon */}
            <LoaderCircle className="relative z-10 h-5 w-5 text-indigo-300 animate-pulse" aria-hidden="true" />
          </div>

          {/* Text Content */}
          <div className="relative z-10 space-y-1.5 px-2">
            <Dialog.Title className="text-sm font-semibold tracking-tight text-slate-100">
              {title}
            </Dialog.Title>
            <Dialog.Description className="text-xs leading-relaxed text-slate-400">
              {description}
            </Dialog.Description>
          </div>

          {/* Animated Loading Shimmer Line */}
          <div className="relative h-1 w-full max-w-35 overflow-hidden rounded-full bg-slate-800/70">
            <div className="absolute inset-y-0 w-1/2 bg-linear-to-r from-indigo-500 via-purple-500 to-indigo-500 rounded-full animate-shimmer" style={{
              animation: 'shimmer 1.5s infinite ease-in-out',
            }} />
          </div>

          <style jsx global>{`
            @keyframes shimmer {
              0% { transform: translateX(-100%); }
              100% { transform: translateX(200%); }
            }
          `}</style>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
};

export function PageLoadingOverlayProvider({ children }: { children: React.ReactNode }) {
  const [entries, setEntries] = useState<LoadingOverlayEntry[]>([]);
  const activeEntry = entries.at(-1);

  const show = useCallback((options: LoadingOverlayOptions = {}) => {
    const id = `loading-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
    setEntries((current) => [
      ...current,
      {
        id,
        title: options.title || DEFAULT_TITLE,
        description: options.description || DEFAULT_DESCRIPTION,
      },
    ]);
    return id;
  }, []);

  const hide = useCallback((id?: string) => {
    setEntries((current) => {
      if (!id) return [];
      return current.filter((entry) => entry.id !== id);
    });
  }, []);

  const run = useCallback(
    async <T,>(options: LoadingOverlayOptions, operation: () => Promise<T>): Promise<T> => {
      const id = show(options);
      try {
        return await operation();
      } finally {
        hide(id);
      }
    },
    [hide, show]
  );

  const value = useMemo<PageLoadingOverlayContextValue>(
    () => ({
      show,
      hide,
      run,
      isVisible: entries.length > 0,
    }),
    [entries.length, hide, run, show]
  );

  return (
    <PageLoadingOverlayContext.Provider value={value}>
      {children}
      <PageLoadingOverlay
        open={entries.length > 0}
        title={activeEntry?.title}
        description={activeEntry?.description}
      />
    </PageLoadingOverlayContext.Provider>
  );
}

export function usePageLoadingOverlay(): PageLoadingOverlayContextValue {
  return useContext(PageLoadingOverlayContext);
}
