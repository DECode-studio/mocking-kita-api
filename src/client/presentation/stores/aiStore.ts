'use client';

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import {
  DEFAULT_AI_MODEL,
  AiModelDefinition,
  STATIC_AI_MODELS,
  inferModelMetadata,
} from '@/src/core/constants/ai-models';
import { useAuthStore } from './authStore';

export interface AttachedFileItem {
  name: string;
  size: number;
  type: string;
  content: string;
}

export interface ChatMessageItem {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  reasoning?: string;
  timestamp: number;
  model?: string;
  attachments?: AttachedFileItem[];
  isError?: boolean;
}

export interface ChatSession {
  id: string;
  title: string;
  createdAt: number;
  updatedAt: number;
  messages: ChatMessageItem[];
}

interface AIStoreState {
  // User Isolation State
  currentUsername: string | null;
  syncUser: (username: string | null) => void;

  // Drawer state
  isDrawerOpen: boolean;
  openDrawer: () => void;
  closeDrawer: () => void;
  toggleDrawer: () => void;

  // Selected & Available Models
  selectedModel: string;
  setSelectedModel: (model: string) => void;
  availableModels: AiModelDefinition[];
  isModelsLoading: boolean;
  isRouterOnline: boolean;
  routerUrl: string;
  loadAvailableModels: () => Promise<void>;

  // Active Session & History (Scoped per user)
  sessions: ChatSession[];
  activeSessionId: string;
  createNewSession: () => string;
  selectSession: (sessionId: string) => void;
  deleteSession: (sessionId: string) => void;
  clearActiveSession: () => void;

  // Streaming State
  isStreaming: boolean;
  abortController: AbortController | null;

  // Actions
  sendMessage: (
    content: string,
    options?: { attachments?: AttachedFileItem[]; customApiKey?: string }
  ) => Promise<void>;
  retryLastMessage: () => Promise<void>;
  stopStreaming: () => void;

  // Active Studio Tab for /assistant page
  activeStudioTab: 'chat' | 'insomnia' | 'openapi' | 'simulator' | 'knowledge';
  setActiveStudioTab: (tab: 'chat' | 'insomnia' | 'openapi' | 'simulator' | 'knowledge') => void;
}

const DEFAULT_SESSION_ID = 'default-session';

const INITIAL_GREETING: ChatMessageItem = {
  id: 'greeting-msg',
  role: 'assistant',
  content: `Halo! 👋 Saya adalah **Mocking Kita AI Assistant** yang siap membantu Anda dalam:
- 🚀 **Panduan Fitur & Tutorial**: Mock APIs, Matrix Environments, Scenario Flows, dan Data Sheets.
- 🔄 **Skill & Tool Converters**: Konversi Koleksi Insomnia (YAML/JSON) ke Scenario Flow v1 dan OpenAPI ke Mock APIs.
- ⚡ **Sintaksis Dinamis**: Variabel \`{{var}}\`, token generator \`{{$uuid}}\`, \`{{$timestamp}}\`, iterator Data Sheet, dan assertion rules.
- 🛠️ **Troubleshooting**: Diagnosa error forward proxy, JWT External API, dan cron jobs.

Ada yang bisa saya bantu sekarang?`,
  timestamp: Date.now(),
  model: DEFAULT_AI_MODEL,
};

function createInitialSession(): ChatSession {
  return {
    id: DEFAULT_SESSION_ID,
    title: 'Percakapan Utama',
    createdAt: Date.now(),
    updatedAt: Date.now(),
    messages: [INITIAL_GREETING],
  };
}

/**
 * Derives a sanitized, isolated storage key per logged-in username
 */
function getUserStorageKey(username: string | null): string {
  if (!username) return 'mocking-kita-ai-store_guest';
  const sanitized = username.trim().toLowerCase().replace(/[^a-z0-9_.-]/g, '_');
  return `mocking-kita-ai-store_${sanitized}`;
}

/**
 * Loads isolated session data for a specific user from localStorage
 */
function readUserSessions(username: string | null): {
  sessions: ChatSession[];
  activeSessionId: string;
  selectedModel?: string;
} {
  if (typeof window === 'undefined') {
    return {
      sessions: [createInitialSession()],
      activeSessionId: DEFAULT_SESSION_ID,
    };
  }

  const userKey = getUserStorageKey(username);
  const raw = localStorage.getItem(userKey);
  if (raw) {
    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed.sessions) && parsed.sessions.length > 0) {
        return {
          sessions: parsed.sessions,
          activeSessionId: parsed.activeSessionId || parsed.sessions[0].id,
          selectedModel: parsed.selectedModel,
        };
      }
    } catch {
      // ignore
    }
  }

  // Seamless one-time migration from previous un-isolated global key if present
  if (username) {
    const legacyRaw = localStorage.getItem('mocking-kita-ai-store');
    if (legacyRaw) {
      try {
        const legacy = JSON.parse(legacyRaw);
        const legacyState = legacy.state || legacy;
        if (Array.isArray(legacyState.sessions) && legacyState.sessions.length > 0) {
          const migrated = {
            sessions: legacyState.sessions,
            activeSessionId: legacyState.activeSessionId || legacyState.sessions[0].id,
            selectedModel: legacyState.selectedModel,
          };
          localStorage.setItem(userKey, JSON.stringify(migrated));
          localStorage.removeItem('mocking-kita-ai-store');
          return migrated;
        }
      } catch {
        // ignore
      }
    }
  }

  return {
    sessions: [createInitialSession()],
    activeSessionId: DEFAULT_SESSION_ID,
  };
}

/**
 * Persists isolated session data for a specific user to localStorage
 */
function saveUserSessions(
  username: string | null,
  data: {
    sessions: ChatSession[];
    activeSessionId: string;
    selectedModel: string;
  }
) {
  if (typeof window === 'undefined') return;
  const userKey = getUserStorageKey(username);
  try {
    localStorage.setItem(userKey, JSON.stringify(data));
  } catch {
    // ignore quota errors
  }
}

// Initial hydration from active user
const initialUser = typeof window !== 'undefined' ? useAuthStore.getState().session?.username || null : null;
const initialLoaded = readUserSessions(initialUser);

export const useAIStore = create<AIStoreState>()(
  persist(
    (set, get) => {
      // Helper to update store and immediately persist to user-scoped storage
      const commitState = (updater: (state: AIStoreState) => Partial<AIStoreState>) => {
        set((state) => {
          const next = updater(state);
          const merged = { ...state, ...next };
          saveUserSessions(merged.currentUsername, {
            sessions: merged.sessions,
            activeSessionId: merged.activeSessionId,
            selectedModel: merged.selectedModel,
          });
          return next;
        });
      };

      return {
        // User Tracking & Isolation
        currentUsername: initialUser,

        syncUser: (username: string | null) => {
          const current = get().currentUsername;
          if (current === username && get().sessions.length > 0) {
            return;
          }

          // Abort active streaming if user switches
          if (get().isStreaming) {
            get().stopStreaming();
          }

          // Save current user state before switching
          saveUserSessions(current, {
            sessions: get().sessions,
            activeSessionId: get().activeSessionId,
            selectedModel: get().selectedModel,
          });

          // Load target user's isolated data
          const targetData = readUserSessions(username);
          set({
            currentUsername: username,
            sessions: targetData.sessions,
            activeSessionId: targetData.activeSessionId,
            selectedModel: targetData.selectedModel || get().selectedModel || DEFAULT_AI_MODEL,
          });
        },

        // Drawer state
        isDrawerOpen: false,
        openDrawer: () => set({ isDrawerOpen: true }),
        closeDrawer: () => set({ isDrawerOpen: false }),
        toggleDrawer: () => set((state) => ({ isDrawerOpen: !state.isDrawerOpen })),

        // Model state
        selectedModel: initialLoaded.selectedModel || DEFAULT_AI_MODEL,
        setSelectedModel: (model: string) =>
          commitState(() => ({ selectedModel: model })),

        availableModels: Object.values(STATIC_AI_MODELS),
        isModelsLoading: false,
        isRouterOnline: false,
        routerUrl: 'http://localhost:20127',

        loadAvailableModels: async () => {
          set({ isModelsLoading: true });
          try {
            const res = await fetch('/api/ai/models');
            if (res.ok) {
              const data = await res.json();
              const models: AiModelDefinition[] =
                Array.isArray(data.models) && data.models.length > 0
                  ? data.models
                  : Object.values(STATIC_AI_MODELS);

              const isOnline = Boolean(data.isOnline);
              const routerUrl = data.routerUrl || 'http://localhost:20127';

              const currentSelected = get().selectedModel;
              const hasCurrent = models.some((m) => m.id === currentSelected);
              const nextSelected = hasCurrent
                ? currentSelected
                : data.defaultModel || models[0]?.id || DEFAULT_AI_MODEL;

              set({
                availableModels: models,
                isRouterOnline: isOnline,
                routerUrl,
                selectedModel: nextSelected,
              });
            }
          } catch {
            set({
              availableModels: Object.values(STATIC_AI_MODELS),
              isRouterOnline: false,
            });
          } finally {
            set({ isModelsLoading: false });
          }
        },

        // Sessions scoped to user
        sessions: initialLoaded.sessions,
        activeSessionId: initialLoaded.activeSessionId,

        createNewSession: () => {
          const newId = 'session_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6);
          const newSession: ChatSession = {
            id: newId,
            title: 'Percakapan Baru',
            createdAt: Date.now(),
            updatedAt: Date.now(),
            messages: [INITIAL_GREETING],
          };
          commitState((state) => ({
            sessions: [newSession, ...state.sessions],
            activeSessionId: newId,
          }));
          return newId;
        },

        selectSession: (sessionId: string) => {
          commitState(() => ({ activeSessionId: sessionId }));
        },

        deleteSession: (sessionId: string) => {
          commitState((state) => {
            const filtered = state.sessions.filter((s) => s.id !== sessionId);
            const nextSessions = filtered.length > 0 ? filtered : [createInitialSession()];
            return {
              sessions: nextSessions,
              activeSessionId: nextSessions[0].id,
            };
          });
        },

        clearActiveSession: () => {
          const { activeSessionId } = get();
          commitState((state) => ({
            sessions: state.sessions.map((s) =>
              s.id === activeSessionId
                ? { ...s, messages: [INITIAL_GREETING], updatedAt: Date.now() }
                : s
            ),
          }));
        },

        isStreaming: false,
        abortController: null,

        stopStreaming: () => {
          const { abortController } = get();
          if (abortController) {
            abortController.abort();
          }
          set({ isStreaming: false, abortController: null });
        },

        sendMessage: async (
          content: string,
          options?: { attachments?: AttachedFileItem[]; customApiKey?: string }
        ) => {
          if ((!content || !content.trim()) && (!options?.attachments || options.attachments.length === 0)) return;
          if (get().isStreaming) return;

          const { activeSessionId, sessions, selectedModel } = get();
          let currentSession = sessions.find((s) => s.id === activeSessionId);
          if (!currentSession) {
            get().createNewSession();
            currentSession = get().sessions[0];
          }

          const userMsgId = 'msg_user_' + Date.now();
          const assistantMsgId = 'msg_ast_' + Date.now();

          const userMessage: ChatMessageItem = {
            id: userMsgId,
            role: 'user',
            content: content.trim(),
            timestamp: Date.now(),
            attachments: options?.attachments && options.attachments.length > 0 ? options.attachments : undefined,
          };

          const initialAssistantMessage: ChatMessageItem = {
            id: assistantMsgId,
            role: 'assistant',
            content: '',
            reasoning: '',
            timestamp: Date.now(),
            model: selectedModel,
          };

          const isFirstUserMsg = currentSession.messages.filter((m) => m.role === 'user').length === 0;
          const displayTitle = content.trim() || (options?.attachments?.[0]?.name ?? 'Percakapan');
          const newTitle = isFirstUserMsg
            ? displayTitle.substring(0, 30) + (displayTitle.length > 30 ? '...' : '')
            : currentSession.title;

          const updatedMessages = [...currentSession.messages, userMessage, initialAssistantMessage];

          commitState((state) => ({
            sessions: state.sessions.map((s) =>
              s.id === currentSession!.id
                ? {
                    ...s,
                    title: newTitle,
                    messages: updatedMessages,
                    updatedAt: Date.now(),
                  }
                : s
            ),
            isStreaming: true,
          }));

          const controller = new AbortController();
          set({ abortController: controller });

          try {
            let formattedContent = userMessage.content;
            if (userMessage.attachments && userMessage.attachments.length > 0) {
              const filesText = userMessage.attachments
                .map((file) => `[File Terlampir: ${file.name} (${(file.size / 1024).toFixed(1)} KB)]\n\`\`\`${file.type || 'text'}\n${file.content}\n\`\`\``)
                .join('\n\n');
              formattedContent = `${filesText}\n\n${formattedContent || 'Tolong analisa file di atas.'}`;
            }

            const apiMessages = currentSession.messages
              .filter((m) => m.id !== 'greeting-msg')
              .concat({ ...userMessage, content: formattedContent })
              .map((m) => ({
                role: m.role,
                content: m.content,
              }));

            const response = await fetch('/api/ai/chat', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                messages: apiMessages,
                model: selectedModel,
                apiKey: options?.customApiKey,
              }),
              signal: controller.signal,
            });

            if (!response.ok) {
              const errorJson = await response.json().catch(() => ({}));
              throw new Error(errorJson?.error || `HTTP ${response.status}: ${response.statusText}`);
            }

            if (!response.body) {
              throw new Error('Tidak ada stream body dari server');
            }

            const reader = response.body.getReader();
            const decoder = new TextDecoder('utf-8');
            let buffer = '';
            let accumulatedContent = '';
            let accumulatedReasoning = '';

            while (true) {
              const { done, value } = await reader.read();
              if (done) break;

              buffer += decoder.decode(value, { stream: true });
              const lines = buffer.split('\n');
              buffer = lines.pop() || '';

              for (const line of lines) {
                const trimmed = line.trim();
                if (!trimmed.startsWith('data: ')) continue;
                const jsonStr = trimmed.substring(6);

                try {
                  const eventData = JSON.parse(jsonStr);

                  if (eventData.type === 'reasoning') {
                    accumulatedReasoning += eventData.text || '';
                    commitState((state) => ({
                      sessions: state.sessions.map((s) =>
                        s.id === currentSession!.id
                          ? {
                              ...s,
                              messages: s.messages.map((m) =>
                                m.id === assistantMsgId
                                  ? { ...m, reasoning: accumulatedReasoning }
                                  : m
                              ),
                            }
                          : s
                      ),
                    }));
                  } else if (eventData.type === 'content') {
                    accumulatedContent += eventData.text || '';
                    commitState((state) => ({
                      sessions: state.sessions.map((s) =>
                        s.id === currentSession!.id
                          ? {
                              ...s,
                              messages: s.messages.map((m) =>
                                m.id === assistantMsgId
                                  ? { ...m, content: accumulatedContent }
                                  : m
                              ),
                            }
                          : s
                      ),
                    }));
                  } else if (eventData.type === 'error') {
                    throw new Error(eventData.text || 'Gagal memproses AI stream');
                  }
                } catch (e: any) {
                  if (e.message && e.message !== 'Unexpected end of JSON input') {
                    throw e;
                  }
                }
              }
            }
          } catch (err: any) {
            if (err.name === 'AbortError') {
              return;
            }
            const errorMessage = err?.message || 'Terjadi kesalahan pada AI chat';
            commitState((state) => ({
              sessions: state.sessions.map((s) =>
                s.id === currentSession!.id
                  ? {
                      ...s,
                      messages: s.messages.map((m) =>
                        m.id === assistantMsgId
                          ? {
                              ...m,
                              content: m.content
                                ? `${m.content}\n\n⚠️ *[Error: ${errorMessage}]*`
                                : `⚠️ **Gagal mendapatkan respons:**\n${errorMessage}`,
                              isError: true,
                            }
                          : m
                      ),
                    }
                  : s
              ),
            }));
          } finally {
            set({ isStreaming: false, abortController: null });
          }
        },

        retryLastMessage: async () => {
          const { sessions, activeSessionId } = get();
          const currentSession = sessions.find((s) => s.id === activeSessionId);
          if (!currentSession) return;

          const lastUserIdx = [...currentSession.messages].map((m) => m.role).lastIndexOf('user');
          if (lastUserIdx === -1) return;

          const lastUserMsg = currentSession.messages[lastUserIdx];
          const trimmedMessages = currentSession.messages.slice(0, lastUserIdx);

          commitState((state) => ({
            sessions: state.sessions.map((s) =>
              s.id === currentSession.id
                ? {
                    ...s,
                    messages: trimmedMessages,
                    updatedAt: Date.now(),
                  }
                : s
            ),
          }));

          await get().sendMessage(lastUserMsg.content, {
            attachments: lastUserMsg.attachments,
          });
        },

        activeStudioTab: 'chat',
        setActiveStudioTab: (tab) => set({ activeStudioTab: tab }),
      };
    },
    {
      name: 'mocking-kita-ai-ui-settings',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        isDrawerOpen: state.isDrawerOpen,
        activeStudioTab: state.activeStudioTab,
      }),
    }
  )
);

// Auto-subscribe to useAuthStore changes so aiStore automatically switches and isolates per user
if (typeof window !== 'undefined') {
  useAuthStore.subscribe((state, prevState) => {
    const nextUser = state.session?.username || null;
    const prevUser = prevState?.session?.username || null;
    if (nextUser !== prevUser) {
      useAIStore.getState().syncUser(nextUser);
    }
  });
}
