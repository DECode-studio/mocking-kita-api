// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useKeyValueEditor } from '@/src/presentation/views/api-detail/hook/useKeyValueEditor';

describe('useKeyValueEditor', () => {
  it('should initialize pairs from object value', () => {
    const onChange = vi.fn();
    const { result } = renderHook(({ val }) => useKeyValueEditor(val, onChange), {
      initialProps: { val: { Authorization: 'Bearer 123' } },
    });

    expect(result.current.pairs).toHaveLength(1);
    expect(result.current.pairs[0].key).toBe('Authorization');
    expect(result.current.pairs[0].value).toBe('Bearer 123');
    expect(result.current.mode).toBe('table');
  });

  it('should add a new row', () => {
    let currentVal: Record<string, unknown> = {};
    const onChange = vi.fn((newVal) => {
      currentVal = newVal;
    });

    const { result, rerender } = renderHook(() => useKeyValueEditor(currentVal, onChange));

    act(() => {
      result.current.handleAddRow();
    });

    rerender();
    expect(result.current.pairs).toHaveLength(1);
    expect(result.current.pairs[0].key).toBe('');
  });

  it('should update row field and call onChange', () => {
    let currentVal: Record<string, unknown> = {};
    const onChange = vi.fn((newVal) => {
      currentVal = newVal;
    });

    const { result, rerender } = renderHook(() => useKeyValueEditor(currentVal, onChange));

    act(() => {
      result.current.handleAddRow();
    });
    rerender();

    const rowId = result.current.pairs[0].id;

    act(() => {
      result.current.handleRowChange(rowId, 'key', 'Accept');
    });
    rerender();

    act(() => {
      result.current.handleRowChange(rowId, 'value', 'application/json');
    });
    rerender();

    expect(onChange).toHaveBeenLastCalledWith({ Accept: 'application/json' });
  });

  it('should remove row and clear all', () => {
    let currentVal: Record<string, unknown> = { key1: 'val1', key2: 'val2' };
    const onChange = vi.fn((newVal) => {
      currentVal = newVal;
    });

    const { result, rerender } = renderHook(() => useKeyValueEditor(currentVal, onChange));

    expect(result.current.pairs).toHaveLength(2);

    const firstId = result.current.pairs[0].id;
    act(() => {
      result.current.handleRemoveRow(firstId);
    });
    rerender();

    expect(result.current.pairs).toHaveLength(1);
    expect(onChange).toHaveBeenLastCalledWith({ key2: 'val2' });

    act(() => {
      result.current.handleClearAll();
    });
    rerender();

    expect(result.current.pairs).toHaveLength(0);
    expect(onChange).toHaveBeenLastCalledWith({});
  });

  it('should switch mode between table and raw json', () => {
    let currentVal: Record<string, unknown> = { ContentType: 'json' };
    const onChange = vi.fn((newVal) => {
      currentVal = newVal;
    });

    const { result, rerender } = renderHook(() => useKeyValueEditor(currentVal, onChange));

    act(() => {
      result.current.handleSwitchToRawJson();
    });

    expect(result.current.mode).toBe('json');
    expect(JSON.parse(result.current.rawJsonText)).toEqual({ ContentType: 'json' });

    act(() => {
      result.current.handleRawJsonChange({ target: { value: '{"ContentType": "xml"}' } } as any);
    });

    act(() => {
      result.current.handleSwitchToTable();
    });
    rerender();

    expect(result.current.mode).toBe('table');
    expect(result.current.pairs[0].value).toBe('xml');
  });
});
