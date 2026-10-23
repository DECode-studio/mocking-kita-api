// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import React from 'react';
import { ChatMessage } from '@/src/client/presentation/views/assistant/components/ChatMessage';
import { ChatMessageItem } from '@/src/client/presentation/stores/aiStore';

vi.mock('@/src/client/presentation/stores/aiStore', () => ({
  useAIStore: () => ({
    retryLastMessage: vi.fn(),
    sendMessage: vi.fn(),
    isStreaming: false,
    closeDrawer: vi.fn(),
  }),
}));

vi.mock('@/src/client/presentation/stores/onboardingStore', () => ({
  useOnboardingStore: {
    getState: () => ({
      startTourTrack: vi.fn(),
    }),
  },
}));

describe('ChatMessage Component', () => {
  it('renders markdown tables, codeblocks, lists, and horizontal rules in assistant messages', () => {
    const assistantMessage: ChatMessageItem = {
      id: 'msg-1',
      role: 'assistant',
      content: `Berikut adalah ringkasan panduan:

### Sintaksis Interpolasi
| Sintaksis | Deskripsi |
|-----------|-----------|
| \`{{var}}\` | Variabel global |
| \`{{$uuid}}\` | Token unik |

---

\`\`\`yaml
headers:
  Authorization: "Bearer {{token}}"
\`\`\`

1. Langkah pertama
2. Langkah kedua`,
      timestamp: Date.now(),
    };

    const { container } = render(<ChatMessage message={assistantMessage} />);

    // Headings
    expect(screen.getByRole('heading', { level: 3 }).textContent).toContain('Sintaksis Interpolasi');

    // Table
    expect(container.querySelector('table')).toBeDefined();
    expect(screen.getByText('Sintaksis')).toBeDefined();
    expect(screen.getByText('Deskripsi')).toBeDefined();
    expect(screen.getByText('Variabel global')).toBeDefined();
    expect(screen.getByText('{{var}}')).toBeDefined();

    // HR
    expect(container.querySelector('hr')).toBeDefined();

    // Code block with language badge
    expect(screen.getByText('YAML')).toBeDefined();
    expect(container.querySelector('pre')).toBeDefined();

    // Ordered list
    expect(screen.getByText('Langkah pertama')).toBeDefined();
    expect(screen.getByText('Langkah kedua')).toBeDefined();

    // Copy button
    const copyBtn = screen.getByTitle('Salin isi pesan');
    expect(copyBtn).toBeDefined();
  });

  it('renders copy button on user request message and copies content', async () => {
    const userMessage: ChatMessageItem = {
      id: 'msg-user-1',
      role: 'user',
      content: 'Bagaimana cara setup scenario flow?',
      timestamp: Date.now(),
    };

    const writeTextMock = vi.fn().mockResolvedValue(undefined);
    Object.assign(navigator, {
      clipboard: {
        writeText: writeTextMock,
      },
    });

    render(<ChatMessage message={userMessage} />);

    expect(screen.getByText('Anda')).toBeDefined();
    expect(screen.getByText('Bagaimana cara setup scenario flow?')).toBeDefined();

    const copyBtn = screen.getByTitle('Salin isi pesan');
    expect(copyBtn).toBeDefined();

    act(() => {
      copyBtn.click();
    });
    expect(writeTextMock).toHaveBeenCalledWith('Bagaimana cara setup scenario flow?');
  });

  it('renders tour action card without overflow', () => {
    const tourMessage: ChatMessageItem = {
      id: 'msg-tour',
      role: 'assistant',
      content: 'Silakan coba tur berikut [action:start-tour:scenario-flow|Mulai Tur Interaktif: Scenario Flow & Step Guide]',
      timestamp: Date.now(),
    };

    const { container } = render(<ChatMessage message={tourMessage} />);

    expect(screen.getByText('Tutorial Interaktif Tersedia')).toBeDefined();
    expect(screen.getByText('Mulai Tur Interaktif: Scenario Flow & Step Guide')).toBeDefined();
    // Full width button
    const tourBtn = screen.getByRole('button', { name: /Mulai Tur Interaktif/i });
    expect(tourBtn.className).toContain('w-full');
  });
});

