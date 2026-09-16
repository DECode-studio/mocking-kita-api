// @vitest-environment jsdom

import { describe, it, expect, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useExternalApiDocs, useEndpointCard, usePlaygroundModal } from '@/src/client/presentation/views/external-api-docs/hook';
import { EXTERNAL_ENDPOINTS } from '@/src/client/presentation/views/external-api-docs/constant';

describe('External API Docs ViewModel Hooks', () => {
  it('useExternalApiDocs should handle categories and filtering', () => {
    const { result } = renderHook(() => useExternalApiDocs());

    expect(result.current.activeCategory).toBe('All');
    expect(result.current.filteredEndpoints.length).toBe(8);

    act(() => {
      result.current.setActiveCategory('Authentication');
    });

    expect(result.current.activeCategory).toBe('Authentication');
    expect(result.current.filteredEndpoints.length).toBe(1);
    expect(result.current.filteredEndpoints[0].id).toBe('auth-signin');

    act(() => {
      result.current.setSearchQuery('openapi');
    });

    expect(result.current.filteredEndpoints.length).toBe(0); // Authentication category + 'openapi' search

    act(() => {
      result.current.setActiveCategory('All');
    });

    expect(result.current.filteredEndpoints.length).toBe(1);
    expect(result.current.filteredEndpoints[0].id).toBe('openapi-upsert');
  });

  it('useEndpointCard should toggle expand and generate cURL command', () => {
    const spec = EXTERNAL_ENDPOINTS[0]; // auth-signin
    const { result } = renderHook(() => useEndpointCard(spec, 'sample-token'));

    expect(result.current.isExpanded).toBe(false);

    act(() => {
      result.current.toggleExpanded();
    });

    expect(result.current.isExpanded).toBe(true);

    const curl = result.current.generateCurl();
    expect(curl).toContain('curl -X POST "http://localhost:3000/api/v1/external/auth/signin"');
  });

  it('usePlaygroundModal should initialize state based on selected spec', () => {
    const spec = EXTERNAL_ENDPOINTS[0];
    const onAuthTokenChange = vi.fn();

    const { result } = renderHook(() => usePlaygroundModal(spec, '', 'mock-studio-api-key', onAuthTokenChange));

    expect(result.current.requestBodyText).toContain('mockapi2026admin');
    expect(result.current.isLoading).toBe(false);
  });
});
