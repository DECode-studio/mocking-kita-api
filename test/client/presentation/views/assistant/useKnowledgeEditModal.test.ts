// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useKnowledgeEditModal } from '@/src/client/presentation/views/assistant/hook/useKnowledgeEditModal';

describe('useKnowledgeEditModal Hook', () => {
  it('initializes with default values and switches active tab', () => {
    const onSave = vi.fn().mockResolvedValue(undefined);
    const onClose = vi.fn();

    const { result } = renderHook(() =>
      useKnowledgeEditModal({
        isOpen: true,
        item: null,
        defaultCategory: 'skill',
        onSave,
        onClose,
      })
    );

    expect(result.current.category).toBe('skill');
    expect(result.current.title).toBe('');
    expect(result.current.activeTab).toBe('write');

    act(() => {
      result.current.setActiveTab('preview');
    });

    expect(result.current.activeTab).toBe('preview');
  });

  it('populates fields when editing an existing item', () => {
    const onSave = vi.fn().mockResolvedValue(undefined);
    const onClose = vi.fn();

    const { result } = renderHook(() =>
      useKnowledgeEditModal({
        isOpen: true,
        item: {
          id: 'test-item',
          title: 'Existing Item',
          category: 'product',
          summary: 'Existing Summary',
          content: '# Existing Content',
          format: 'md',
        },
        defaultCategory: 'skill',
        onSave,
        onClose,
      })
    );

    expect(result.current.title).toBe('Existing Item');
    expect(result.current.category).toBe('product');
    expect(result.current.summary).toBe('Existing Summary');
    expect(result.current.content).toBe('# Existing Content');
  });

  it('validates required fields before calling onSave', async () => {
    const onSave = vi.fn().mockResolvedValue(undefined);
    const onClose = vi.fn();

    const { result } = renderHook(() =>
      useKnowledgeEditModal({
        isOpen: true,
        item: null,
        defaultCategory: 'product',
        onSave,
        onClose,
      })
    );

    // Empty title
    await act(async () => {
      await result.current.handleSubmit({ preventDefault: vi.fn() } as any);
    });

    expect(result.current.error).toBe('Judul tidak boleh kosong');
    expect(onSave).not.toHaveBeenCalled();

    // Fill title but empty content
    act(() => {
      result.current.setTitle('My Title');
    });

    await act(async () => {
      await result.current.handleSubmit({ preventDefault: vi.fn() } as any);
    });

    expect(result.current.error).toBe('Konten tidak boleh kosong');
    expect(onSave).not.toHaveBeenCalled();

    // Fill content
    act(() => {
      result.current.setContent('# Some documentation');
    });

    await act(async () => {
      await result.current.handleSubmit({ preventDefault: vi.fn() } as unknown as React.FormEvent);
    });

    expect(result.current.error).toBeNull();
    expect(onSave).toHaveBeenCalledWith({
      id: undefined,
      title: 'My Title',
      category: 'product',
      summary: '',
      content: '# Some documentation',
      format: 'md',
      keywords: [],
      source: 'Product Knowledge',
    });
    expect(onClose).toHaveBeenCalled();
  });
});

