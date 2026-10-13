'use client';

import { useRef, useEffect } from 'react';
import { useAIStore } from '@/src/client/presentation/stores/aiStore';

export const useAssistant = () => {
  const {
    sessions,
    activeSessionId,
    createNewSession,
    selectSession,
    deleteSession,
    clearActiveSession,
    activeStudioTab,
    setActiveStudioTab,
    selectedModel,
    setSelectedModel,
    isStreaming,
    sendMessage,
    stopStreaming,
  } = useAIStore();

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const currentSession = sessions.find((s) => s.id === activeSessionId) || sessions[0];

  useEffect(() => {
    if (activeStudioTab === 'chat') {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [currentSession?.messages, activeStudioTab]);

  return {
    sessions,
    currentSession,
    activeSessionId,
    createNewSession,
    selectSession,
    deleteSession,
    clearActiveSession,
    activeStudioTab,
    setActiveStudioTab,
    selectedModel,
    setSelectedModel,
    isStreaming,
    sendMessage,
    stopStreaming,
    messagesEndRef,
  };
};
