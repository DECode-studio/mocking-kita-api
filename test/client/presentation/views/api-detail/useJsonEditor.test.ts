// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useJsonEditor } from '@/src/client/presentation/views/api-detail/hook/useJsonEditor';

describe('useJsonEditor', () => {
  beforeEach(() => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
  });

  it('should initialize with formatted JSON string', () => {
    const onChange = vi.fn();
    const { result } = renderHook(() => useJsonEditor({ foo: 'bar' }, onChange));

    expect(JSON.parse(result.current.text)).toEqual({ foo: 'bar' });
    expect(result.current.validation.isValid).toBe(true);
  });

  it('should update state when text changes and triggers onChange if valid', () => {
    const onChange = vi.fn();
    const { result } = renderHook(() => useJsonEditor({}, onChange));

    act(() => {
      result.current.handleTextChange({ target: { value: '{"hello": "world"}' } } as any);
    });

    expect(result.current.validation.isValid).toBe(true);
    expect(onChange).toHaveBeenCalledWith({ hello: 'world' });
  });

  it('should set validation error when input is invalid JSON', () => {
    const onChange = vi.fn();
    const { result } = renderHook(() => useJsonEditor({}, onChange));

    act(() => {
      result.current.handleTextChange({ target: { value: '{invalid}' } } as any);
    });

    expect(result.current.validation.isValid).toBe(false);
    expect(result.current.validation.error).toBeDefined();
  });

  it('should format JSON on handleFormat', () => {
    const onChange = vi.fn();
    const { result } = renderHook(() => useJsonEditor({}, onChange));

    act(() => {
      result.current.handleTextChange({ target: { value: '{"a":1,"b":2}' } } as any);
    });

    act(() => {
      result.current.handleFormat();
    });

    expect(result.current.text).toContain('\n');
    expect(onChange).toHaveBeenCalledWith({ a: 1, b: 2 });
  });

  it('should minify JSON on handleMinify', () => {
    const onChange = vi.fn();
    const { result } = renderHook(() => useJsonEditor({ a: 1 }, onChange));

    act(() => {
      result.current.handleMinify();
    });

    expect(result.current.text).toBe('{"a":1}');
  });

  it('should copy text to clipboard', () => {
    const writeTextSpy = vi.fn().mockResolvedValue(undefined);
    Object.assign(navigator, { clipboard: { writeText: writeTextSpy } });

    const { result } = renderHook(() => useJsonEditor({ a: 1 }, vi.fn()));

    act(() => {
      result.current.handleCopy();
    });

    expect(writeTextSpy).toHaveBeenCalled();
    expect(result.current.copied).toBe(true);

    act(() => {
      vi.advanceTimersByTime(2000);
    });
    expect(result.current.copied).toBe(false);
  });

  it('should reset text and value on handleReset', () => {
    const onChange = vi.fn();
    const { result } = renderHook(() => useJsonEditor({ a: 1 }, onChange));

    act(() => {
      result.current.handleReset();
    });

    expect(result.current.text).toBe('{}');
    expect(onChange).toHaveBeenCalledWith({});
  });
});
