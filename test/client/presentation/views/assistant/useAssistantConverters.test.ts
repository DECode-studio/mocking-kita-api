// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import {
  useOpenApiGenerator,
  useInsomniaConverter,
  useVariableSimulator,
  useKnowledgeBaseExplorer,
} from '@/src/client/presentation/views/assistant/hook';
import {
  SAMPLE_OPENAPI_PAYLOAD,
  SAMPLE_INSOMNIA_PAYLOAD,
  SAMPLE_PAYLOAD_TO_INTERPOLATE,
} from '@/src/client/presentation/views/assistant/constant';

describe('Assistant Converter Hooks', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    Object.assign(navigator, {
      clipboard: {
        writeText: vi.fn().mockResolvedValue(undefined),
      },
    });
  });

  describe('useOpenApiGenerator', () => {
    it('initializes with sample payload and converts successfully', () => {
      const { result } = renderHook(() => useOpenApiGenerator());
      expect(result.current.rawInput).toBe(SAMPLE_OPENAPI_PAYLOAD);
      expect(result.current.result).toBeNull();

      act(() => {
        result.current.handleConvert();
      });

      expect(result.current.result).not.toBeNull();
      expect(result.current.result?.totalEndpoints).toBeGreaterThan(0);
      expect(result.current.result?.endpoints.length).toBeGreaterThan(0);
    });

    it('resets to sample payload and handles copy', () => {
      const { result } = renderHook(() => useOpenApiGenerator());
      act(() => {
        result.current.setRawInput('custom input');
      });
      expect(result.current.rawInput).toBe('custom input');

      act(() => {
        result.current.handleResetSample();
      });
      expect(result.current.rawInput).toBe(SAMPLE_OPENAPI_PAYLOAD);

      act(() => {
        result.current.copySampleJson({ test: 123 }, 0);
      });
      expect(navigator.clipboard.writeText).toHaveBeenCalledWith(JSON.stringify({ test: 123 }, null, 2));
      expect(result.current.copiedIdx).toBe(0);
    });
  });

  describe('useInsomniaConverter', () => {
    it('initializes with sample payload and converts correctly', () => {
      const { result } = renderHook(() => useInsomniaConverter());
      expect(result.current.rawInput).toBe(SAMPLE_INSOMNIA_PAYLOAD);
      expect(result.current.result).toBeNull();

      act(() => {
        result.current.handleConvert();
      });

      expect(result.current.result).not.toBeNull();
      expect(result.current.result?.success).toBe(true);
      expect(result.current.result?.template?.steps.length).toBeGreaterThan(0);
    });

    it('copies and resets sample', () => {
      const { result } = renderHook(() => useInsomniaConverter());
      act(() => {
        result.current.handleConvert();
      });
      act(() => {
        result.current.copyTemplateJson();
      });
      expect(navigator.clipboard.writeText).toHaveBeenCalled();
      expect(result.current.isCopied).toBe(true);

      act(() => {
        result.current.handleResetSample();
      });
      expect(result.current.rawInput).toBe(SAMPLE_INSOMNIA_PAYLOAD);
    });
  });

  describe('useVariableSimulator', () => {
    it('simulates variable interpolation correctly', () => {
      const { result } = renderHook(() => useVariableSimulator());
      expect(result.current.templateInput).toBe(SAMPLE_PAYLOAD_TO_INTERPOLATE);
      expect(result.current.simulationResult).toBeNull();

      act(() => {
        result.current.handleSimulateVariables();
      });

      expect(result.current.simulationResult).not.toBeNull();
      expect(result.current.simulationResult?.replacedTokens.length).toBeGreaterThan(0);
    });

    it('evaluates assertions accurately', () => {
      const { result } = renderHook(() => useVariableSimulator());
      expect(result.current.assertionResult).toBeNull();

      act(() => {
        result.current.handleTestAssertions();
      });

      expect(result.current.assertionResult).not.toBeNull();
      expect(result.current.assertionResult?.passed).toBe(true);
      expect(result.current.assertionResult?.results.length).toBe(4);
    });
  });

  describe('useKnowledgeBaseExplorer', () => {
    it('filters sections based on search query', () => {
      const { result } = renderHook(() => useKnowledgeBaseExplorer());
      expect(result.current.selectedSection).toBeDefined();
      const initialCount = result.current.filteredSections.length;

      act(() => {
        result.current.setSearchQuery('JWT');
      });

      expect(result.current.filteredSections.length).toBeLessThanOrEqual(initialCount);
    });
  });
});

