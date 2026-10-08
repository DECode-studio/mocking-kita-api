'use client';

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { DEFAULT_NIM_MODEL } from '@/src/core/constants/ai-models';

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
  // Drawer state
  isDrawerOpen: boolean;
  openDrawer: () => void;
  closeDrawer: () => void;
  toggleDrawer: () => void;

  // Selected Model
  selectedModel: string;
  setSelectedModel: (model: string) => void;

  // Active Session & History
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
  model: DEFAULT_NIM_MODEL,
};

export const useAIStore = create<AIStoreState>()(
  persist(
    (set, get) => ({
      isDrawerOpen: false,
      openDrawer: () => set({ isDrawerOpen: true }),
      closeDrawer: () => set({ isDrawerOpen: false }),
      toggleDrawer: () => set((state) => ({ isDrawerOpen: !state.isDrawerOpen })),

      selectedModel: DEFAULT_NIM_MODEL,
      setSelectedModel: (model: string) => set({ selectedModel: model }),

      sessions: [
        {
          id: DEFAULT_SESSION_ID,
          title: 'Percakapan Utama',
          createdAt: Date.now(),
          updatedAt: Date.now(),
          messages: [INITIAL_GREETING],
        },
      ],
      activeSessionId: DEFAULT_SESSION_ID,

      createNewSession: () => {
        const newId = 'session_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6);
        const newSession: ChatSession = {
          id: newId,
          title: 'Percakapan Baru',
          createdAt: Date.now(),
          updatedAt: Date.now(),
          messages: [INITIAL_GREETING],
        };
        set((state) => ({
          sessions: [newSession, ...state.sessions],
          activeSessionId: newId,
        }));
        return newId;
      },

      selectSession: (sessionId: string) => {
        set({ activeSessionId: sessionId });
      },

      deleteSession: (sessionId: string) => {
        set((state) => {
          const filtered = state.sessions.filter((s) => s.id !== sessionId);
          const nextSessions = filtered.length > 0 ? filtered : [
            {
              id: DEFAULT_SESSION_ID,
              title: 'Percakapan Utama',
              createdAt: Date.now(),
              updatedAt: Date.now(),
              messages: [INITIAL_GREETING],
            },
          ];
          return {
            sessions: nextSessions,
            activeSessionId: nextSessions[0].id,
          };
        });
      },

      clearActiveSession: () => {
        const { activeSessionId } = get();
        set((state) => ({
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

        // Update session title if first user message
        const isFirstUserMsg = currentSession.messages.filter((m) => m.role === 'user').length === 0;
        const displayTitle = content.trim() || (options?.attachments?.[0]?.name ?? 'Percakapan');
        const newTitle = isFirstUserMsg
          ? displayTitle.substring(0, 30) + (displayTitle.length > 30 ? '...' : '')
          : currentSession.title;

        // Append user message and empty assistant placeholder
        const updatedMessages = [...currentSession.messages, userMessage, initialAssistantMessage];

        set((state) => ({
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
          // Format prompt with attachment text if present
          let formattedContent = userMessage.content;
          if (userMessage.attachments && userMessage.attachments.length > 0) {
            const filesText = userMessage.attachments
              .map((file) => `[File Terlampir: ${file.name} (${(file.size / 1024).toFixed(1)} KB)]\n\`\`\`${file.type || 'text'}\n${file.content}\n\`\`\``)
              .join('\n\n');
            formattedContent = `${filesText}\n\n${formattedContent || 'Tolong analisa file di atas.'}`;
          }

          // Prepare history to send (exclude initial greeting system-like message for cleaner context)
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
            const errData = await response.json().catch(() => ({ error: 'Gagal menghubungi AI Server' }));
            throw new Error(errData.error || `HTTP ${response.status}: ${response.statusText}`);
          }

          if (!response.body) {
            throw new Error('Tidak ada stream body dari server');
          }

          const reader = response.body.getReader();
          const decoder = new TextDecoder('utf-8');
          let accumulatedContent = '';
          let accumulatedReasoning = '';
          let buffer = '';

          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split('\n');
            buffer = lines.pop() || '';

            for (const line of lines) {
              const trimmed = line.trim();
              if (!trimmed || !trimmed.startsWith('data: ')) continue;

              const jsonStr = trimmed.substring(6);
              try {
                const data = JSON.parse(jsonStr);

                if (data.type === 'reasoning' && data.text) {
                  accumulatedReasoning += data.text;
                } else if (data.type === 'content' && data.text) {
                  accumulatedContent += data.text;
                } else if (data.type === 'error' && data.text) {
                  accumulatedContent += `\n\n⚠️ **Error**: ${data.text}`;
                }

                // Update assistant message in real-time
                set((state) => ({
                  sessions: state.sessions.map((s) =>
                    s.id === currentSession!.id
                      ? {
                          ...s,
                          messages: s.messages.map((m) =>
                            m.id === assistantMsgId
                              ? {
                                  ...m,
                                  content: accumulatedContent,
                                  reasoning: accumulatedReasoning,
                                }
                              : m
                          ),
                        }
                      : s
                  ),
                }));
              } catch {
                // Ignore parse errors on partial frames
              }
            }
          }
        } catch (err: any) {
          if (err.name === 'AbortError') {
            // Aborted by user
          } else {
            const errorText = `\n\n⚠️ **Gagal memproses**: ${err.message || 'Terjadi kesalahan'}`;
            set((state) => ({
              sessions: state.sessions.map((s) =>
                s.id === currentSession!.id
                  ? {
                      ...s,
                      messages: s.messages.map((m) =>
                        m.id === assistantMsgId
                          ? { ...m, content: m.content ? m.content + errorText : errorText, isError: true }
                          : m
                      ),
                    }
                  : s
              ),
            }));
          }
        } finally {
          set({ isStreaming: false, abortController: null });
        }
      },

      retryLastMessage: async () => {
        if (get().isStreaming) return;
        const { activeSessionId, sessions } = get();
        const currentSession = sessions.find((s) => s.id === activeSessionId);
        if (!currentSession) return;

        // Find the last user message
        const lastUserIdx = [...currentSession.messages].map((m) => m.role).lastIndexOf('user');
        if (lastUserIdx === -1) return;

        const lastUserMsg = currentSession.messages[lastUserIdx];
        const trimmedMessages = currentSession.messages.slice(0, lastUserIdx);

        // Reset current session messages to history before last user message
        set((state) => ({
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

        // Re-send last user message
        await get().sendMessage(lastUserMsg.content, {
          attachments: lastUserMsg.attachments,
        });
      },

      activeStudioTab: 'chat',
      setActiveStudioTab: (tab) => set({ activeStudioTab: tab }),
    }),
    {
      name: 'mocking-kita-ai-store',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        selectedModel: state.selectedModel,
        sessions: state.sessions,
        activeSessionId: state.activeSessionId,
      }),
    }
  )
);
