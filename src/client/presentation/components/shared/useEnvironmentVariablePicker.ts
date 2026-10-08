'use client';

import { useState, useEffect, useMemo } from 'react';
import { Environment, ALL_ENVIRONMENT_TYPES } from '@/src/client/domain/environment/entity/environment';
import { EnvironmentUseCase } from '@/src/client/domain/environment/usecase/environment_usecase';
import { getService, CLIENT_DI_TOKENS } from '@/src/core/di';

export interface EnvVarItem {
  environmentId?: string;
  projectId?: string;
  key: string;
  token: string;
  namespacedToken: string;
  environmentName: string;
  isBaseUrl: boolean;
  activeStages: string[];
}

interface UseEnvironmentVariablePickerOptions {
  projectId?: string;
  onInsert?: (token: string) => void;
  customEnvironmentUseCase?: EnvironmentUseCase;
}

export function useEnvironmentVariablePicker({
  projectId,
  onInsert,
  customEnvironmentUseCase,
}: UseEnvironmentVariablePickerOptions = {}) {
  const [isOpen, setIsOpen] = useState(false);
  const [environments, setEnvironments] = useState<Environment[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [copiedToken, setCopiedToken] = useState<string | null>(null);

  const environmentUseCase = useMemo(
    () => customEnvironmentUseCase || getService(CLIENT_DI_TOKENS.environmentUseCase),
    [customEnvironmentUseCase]
  );

  useEffect(() => {
    if (!isOpen) return;
    let isMounted = true;
    const fetchEnvironments = async () => {
      setIsLoading(true);
      try {
        const list = projectId
          ? await environmentUseCase.getByProjectId(projectId)
          : await environmentUseCase.getAll();
        if (isMounted) {
          setEnvironments(list.filter((e) => e.status && !e.deletedAt));
        }
      } catch (err) {
        console.error('Failed to load environments for picker', err);
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };
    void fetchEnvironments();
    return () => {
      isMounted = false;
    };
  }, [isOpen, projectId, environmentUseCase]);

  const handleCopy = (token: string) => {
    navigator.clipboard.writeText(token);
    setCopiedToken(token);
    setTimeout(() => setCopiedToken(null), 1500);
  };

  const handleInsert = (token: string) => {
    if (onInsert) {
      onInsert(token);
      setIsOpen(false);
    } else {
      handleCopy(token);
    }
  };

  const items: EnvVarItem[] = useMemo(() => {
    const list: EnvVarItem[] = [];
    for (const env of environments) {
      const activeStages = ALL_ENVIRONMENT_TYPES.filter(
        (stage) => !!env.values?.[stage]
      );

      if (env.isBaseUrl === false && env.name) {
        list.push({
          environmentId: env.id,
          projectId: env.projectId,
          key: env.name,
          token: `{{${env.name}}}`,
          namespacedToken: `{{env.${env.name}}}`,
          environmentName: env.name,
          isBaseUrl: false,
          activeStages,
        });
      } else if (env.isBaseUrl) {
        const varKey = env.name ? env.name.replace(/\s+/g, '_') : 'base_url';
        list.push({
          environmentId: env.id,
          projectId: env.projectId,
          key: varKey,
          token: `{{${varKey}}}`,
          namespacedToken: `{{env.${varKey}}}`,
          environmentName: env.name || 'Base URL',
          isBaseUrl: true,
          activeStages,
        });
      }

      if (Array.isArray(env.variables)) {
        for (const v of env.variables) {
          if (!v.key) continue;
          const exists = list.some((i) => i.key.toLowerCase() === v.key.toLowerCase());
          if (!exists) {
            list.push({
              environmentId: env.id,
              projectId: env.projectId,
              key: v.key,
              token: `{{${v.key}}}`,
              namespacedToken: `{{env.${v.key}}}`,
              environmentName: env.name,
              isBaseUrl: false,
              activeStages: [],
            });
          }
        }
      }
    }
    return list;
  }, [environments]);

  const filteredItems = useMemo(() => {
    if (!search.trim()) return items;
    const q = search.toLowerCase();
    return items.filter(
      (item) =>
        item.key.toLowerCase().includes(q) ||
        item.environmentName.toLowerCase().includes(q) ||
        item.activeStages.some((s) => s.toLowerCase().includes(q))
    );
  }, [items, search]);

  return {
    isOpen,
    setIsOpen,
    isLoading,
    search,
    setSearch,
    copiedToken,
    filteredItems,
    handleCopy,
    handleInsert,
  };
}
