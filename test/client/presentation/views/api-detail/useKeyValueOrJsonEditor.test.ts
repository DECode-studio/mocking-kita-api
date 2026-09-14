// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useKeyValueOrJsonEditor } from '@/src/client/presentation/views/api-detail/hook/useKeyValueOrJsonEditor';

describe('useKeyValueOrJsonEditor', () => {
  it('should parse JSON string to deep object tree', () => {
    const onChange = vi.fn();
    const initialJson = JSON.stringify({
      page: 1,
      active: true,
      user: { name: 'Studio', roles: ['admin', 'viewer'] },
    });
    const { result } = renderHook(() => useKeyValueOrJsonEditor(initialJson, onChange));

    expect(result.current.mode).toBe('key-value');
    expect(result.current.parsedData).toEqual({
      page: 1,
      active: true,
      user: { name: 'Studio', roles: ['admin', 'viewer'] },
    });
  });

  it('should support file properties when supportFiles is true', () => {
    const onChange = vi.fn();
    const initialJson = JSON.stringify({ attachment: { filename: 'report.pdf' } });
    const { result } = renderHook(() => useKeyValueOrJsonEditor(initialJson, onChange, true));

    expect(result.current.parsedData).toEqual({
      attachment: { filename: 'report.pdf' },
    });
  });

  it('should add child, update leaf, rename key, and delete path at deep levels', () => {
    const onChange = vi.fn();
    const { result } = renderHook(() => useKeyValueOrJsonEditor('{}', onChange));

    // Add field at root
    act(() => {
      result.current.addChild([], 'field');
    });
    expect(onChange).toHaveBeenLastCalledWith(expect.stringContaining('"field_1": ""'));

    // Rename key
    act(() => {
      result.current.renameKey([], 'field_1', 'count');
    });
    expect(onChange).toHaveBeenLastCalledWith(expect.stringContaining('"count": ""'));

    // Update leaf
    act(() => {
      result.current.updateLeaf(['count'], { value: 10, operator: 'equal' });
    });
    expect(onChange).toHaveBeenLastCalledWith(expect.stringContaining('"count": 10'));

    // Add nested object
    act(() => {
      result.current.addChild([], 'object');
    });
    expect(onChange).toHaveBeenLastCalledWith(expect.stringContaining('"field_1": {}'));

    // Delete path
    act(() => {
      result.current.deletePath(['field_1']);
    });
    expect(onChange).toHaveBeenLastCalledWith(JSON.stringify({ count: 10 }, null, 2));
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

