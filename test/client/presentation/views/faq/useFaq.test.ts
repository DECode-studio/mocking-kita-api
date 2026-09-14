// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useFaq } from '@/src/client/presentation/views/faq/hook/useFaq';

describe('useFaq', () => {
  let mockFaqUseCase: any;

  const initialFaqs = [
    { id: 'f1', question: 'What is Mock API?', answer: 'It mocks APIs', category: 'General', createdAt: '', updatedAt: '' },
    { id: 'f2', question: 'How to setup auth?', answer: 'Use sign in', category: 'Security', createdAt: '', updatedAt: '' },
  ] as any[];

  beforeEach(() => {
    mockFaqUseCase = {
      getFaqs: vi.fn().mockResolvedValue(initialFaqs),
    };
    vi.useFakeTimers({ shouldAdvanceTime: true });
  });

  it('should initialize with FAQs and categories', () => {
    const { result } = renderHook(() => useFaq(mockFaqUseCase, initialFaqs));

    expect(result.current.categories).toEqual(['All', 'General', 'Security']);
    expect(result.current.faqs).toHaveLength(2);
  });

  it('should filter FAQs by selectedCategory', () => {
    const { result } = renderHook(() => useFaq(mockFaqUseCase, initialFaqs));

    act(() => {
      result.current.setSelectedCategory('Security');
    });

    expect(result.current.faqs).toHaveLength(1);
    expect(result.current.faqs[0].id).toBe('f2');
  });

  it('should toggle expanded FAQ item', () => {
    const { result } = renderHook(() => useFaq(mockFaqUseCase, initialFaqs));

    expect(result.current.expandedId).toBeNull();

    act(() => {
      result.current.toggleExpand('f1');
    });
    expect(result.current.expandedId).toBe('f1');

    act(() => {
      result.current.toggleExpand('f1');
    });
    expect(result.current.expandedId).toBeNull();
  });

  it('should debounce search query and call getFaqs', async () => {
    const { result } = renderHook(() => useFaq(mockFaqUseCase, initialFaqs));

    act(() => {
      result.current.setSearchQuery('auth');
    });

    act(() => {
      vi.advanceTimersByTime(300);
    });

    await waitFor(() => {
      expect(mockFaqUseCase.getFaqs).toHaveBeenCalledWith('auth');
    });
  });
});
