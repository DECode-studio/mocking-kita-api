'use client';

import React, { useRef, useEffect } from 'react';
import Link from 'next/link';
import {
  X,
  Sparkles,
  Maximize2,
  Plus,
} from 'lucide-react';
import { useAIStore } from '@/src/client/presentation/stores/aiStore';
import { ChatMessage } from './ChatMessage';
import { ChatInput } from './ChatInput';
import { ModelSelector } from './ModelSelector';
import { ROUTES } from '@/src/core/constants/routes';
import { ASSISTANT_SEMANTIC_ID } from '../constant';

export const ChatAssistantDrawer: React.FC = () => {
  const {
    isDrawerOpen,
    closeDrawer,
    sessions,
    activeSessionId,
    createNewSession,
  } = useAIStore();

  const [drawerWidth, setDrawerWidth] = React.useState<number>(512);
  const [isResizing, setIsResizing] = React.useState<boolean>(false);
  const resizeRef = useRef<{ startX: number; startWidth: number }>({ startX: 0, startWidth: 512 });

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const currentSession = sessions.find((s) => s.id === activeSessionId) || sessions[0];

  const MIN_WIDTH = 440;

  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizing(true);
    resizeRef.current = {
      startX: e.clientX,
      startWidth: drawerWidth,
    };
  };

  useEffect(() => {
    if (!isResizing) return;

    const handleMouseMove = (e: MouseEvent) => {
      const deltaX = resizeRef.current.startX - e.clientX;
      const maxAllowed = Math.min(window.innerWidth - 40, 1100);
      const newWidth = Math.max(MIN_WIDTH, Math.min(resizeRef.current.startWidth + deltaX, maxAllowed));
      setDrawerWidth(newWidth);
    };

    const handleMouseUp = () => {
      setIsResizing(false);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    document.body.style.userSelect = 'none';
    document.body.style.cursor = 'ew-resize';

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      document.body.style.userSelect = '';
      document.body.style.cursor = '';
    };
  }, [isResizing]);

  const handleToggleExpand = () => {
    setDrawerWidth((prev) => (prev > 650 ? MIN_WIDTH : Math.min(window.innerWidth - 60, 880)));
  };

  useEffect(() => {
    if (isDrawerOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [currentSession?.messages, isDrawerOpen]);

  if (!isDrawerOpen) return null;

  return (
    <div id={ASSISTANT_SEMANTIC_ID.DRAWER_CONTAINER} className="fixed inset-0 z-50 overflow-hidden flex justify-end">
      <div
        className="fixed inset-0 bg-slate-950/50 backdrop-blur-xs transition-opacity duration-300"
        onClick={closeDrawer}
      />

      <div
        style={{ width: `min(${drawerWidth}px, 100vw)` }}
        className={`relative bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 shadow-2xl flex flex-col h-full z-10 ${
          isResizing ? '' : 'transition-[width] duration-150'
        }`}
      >
        {/* Resize Handle on the left border */}
        <div
          onMouseDown={handleMouseDown}
          onDoubleClick={handleToggleExpand}
          className="absolute -left-1.5 top-0 bottom-0 w-3 cursor-ew-resize group z-30 flex items-center justify-center select-none"
          title="Tarik untuk mengubah ukuran lebar drawer (Double-click untuk toggle lebar)"
        >
          <div
            className={`w-1 h-14 rounded-full transition-all ${
              isResizing
                ? 'bg-purple-500 scale-y-125'
                : 'bg-slate-300 dark:bg-slate-700/80 group-hover:bg-purple-500 group-hover:h-20'
            }`}
          />
        </div>

        <div className="h-16 px-4 border-b border-slate-200 dark:border-slate-800/80 flex items-center justify-between bg-slate-50/80 dark:bg-slate-950/80 backdrop-blur-md shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-linear-to-tr from-purple-600 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-purple-500/20">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                <span>AI Assistant</span>
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              </h3>
              <p className="text-[11px] text-slate-400 font-sans">Tanya jawab & panduan Mocking Kita</p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={createNewSession}
              title="Mulai Percakapan Baru"
              className="p-1.5 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 rounded-lg hover:bg-slate-200/60 dark:hover:bg-slate-800 transition-colors"
            >
              <Plus className="w-4 h-4" />
            </button>

            <button
              type="button"
              onClick={handleToggleExpand}
              title={drawerWidth > 650 ? 'Kecilkan Drawer' : 'Perlebar Drawer'}
              className="p-1.5 text-slate-500 hover:text-purple-600 dark:hover:text-purple-400 rounded-lg hover:bg-slate-200/60 dark:hover:bg-slate-800 transition-colors"
            >
              <Maximize2 className="w-4 h-4" />
            </button>

            <Link
              href={ROUTES.ASSISTANT}
              onClick={closeDrawer}
              title="Buka Halaman Penuh & Converters"
              className="text-[11px] px-2 py-1 text-slate-500 hover:text-purple-600 dark:hover:text-purple-400 rounded-lg hover:bg-slate-200/60 dark:hover:bg-slate-800 transition-colors font-medium border border-slate-200 dark:border-slate-800"
            >
              Studio
            </Link>

            <button
              type="button"
              onClick={closeDrawer}
              title="Tutup Drawer"
              className="p-1.5 text-slate-500 hover:text-rose-500 rounded-lg hover:bg-slate-200/60 dark:hover:bg-slate-800 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="px-4 py-2 border-b border-slate-200 dark:border-slate-800/60 bg-white/50 dark:bg-slate-900/50 flex items-center justify-between text-xs shrink-0">
          <span className="text-[11px] text-slate-400 font-medium">Model Aktif:</span>
          <ModelSelector placement="bottom" align="right" />
        </div>

        <div className="flex-1 p-4 overflow-y-auto space-y-4 bg-slate-50/50 dark:bg-slate-950/40">
          {currentSession?.messages.map((msg) => (
            <ChatMessage key={msg.id} message={msg} />
          ))}
          <div ref={messagesEndRef} />
        </div>

        <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shrink-0">
          <ChatInput compact={false} />
        </div>
      </div>
    </div>
  );
};
