// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useKeyValueOrJsonEditor } from '@/src/presentation/views/api-detail/hook/useKeyValueOrJsonEditor';

describe('useKeyValueOrJsonEditor', () => {
  it('should sync JSON string to key-value rows', () => {
    const onChange = vi.fn();
    const initialJson = JSON.stringify({ page: 1, active: true, name: 'Studio' });
    const { result } = renderHook(() => useKeyValueOrJsonEditor(initialJson, onChange));

    expect(result.current.mode).toBe('key-value');
    expect(result.current.rows).toHaveLength(3);
    expect(result.current.rows[0]).toEqual({ key: 'page', value: '1', isFile: false, operator: 'equal', enabled: true });
  });

  it('should support file properties when supportFiles is true', () => {
    const onChange = vi.fn();
    const initialJson = JSON.stringify({ attachment: { filename: 'report.pdf' } });
    const { result } = renderHook(() => useKeyValueOrJsonEditor(initialJson, onChange, true));

    expect(result.current.rows[0]).toEqual({ key: 'attachment', value: 'report.pdf', isFile: true, operator: 'equal', enabled: true });
  });

  it('should add, update, and delete rows', () => {
    const onChange = vi.fn();
    const { result } = renderHook(() => useKeyValueOrJsonEditor('{}', onChange));

    act(() => {
      result.current.addRow();
    });
    expect(result.current.rows).toHaveLength(2);

    act(() => {
      result.current.updateRow(0, { key: 'count', value: '10' });
    });

    expect(onChange).toHaveBeenLastCalledWith(expect.stringContaining('"count": 10'));

    act(() => {
      result.current.deleteRow(1);
    });

    expect(result.current.rows).toHaveLength(1);
  });

  it('should beautify json string', () => {
    const onChange = vi.fn();
    const { result } = renderHook(() => useKeyValueOrJsonEditor('{"a":1}', onChange));

    act(() => {
      result.current.handleBeautify();
    });

    expect(onChange).toHaveBeenCalledWith(JSON.stringify({ a: 1 }, null, 2));
  });
});
