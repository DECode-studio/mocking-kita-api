'use client';

import { useState, useEffect, useCallback, FormEvent } from 'react';
import {
  Environment,
  EnvironmentVariable,
  EnvironmentValuesMap,
  ALL_ENVIRONMENT_TYPES,
  normalizeEnvironmentValues,
  getEnvironmentBaseUrl,
} from '@/src/client/domain/environment/entity/environment';
import { Project } from '@/src/client/domain/project/entity/project';
import { EnvironmentType } from '@/src/core/utils/types';
import { generateId } from '@/src/core/utils/uuid';
import { EnvironmentFormData } from './useEnvironments';

export interface VariableDraftItem {
  id: string;
  key: string;
  value: string;
  type: 'plain' | 'secret';
  enabled: boolean;
  description?: string;
  showValue?: boolean;
}

interface UseEnvironmentFormModalProps {
  isOpen: boolean;
  editingEnvironment: Environment | null;
  projects: Project[];
  defaultProjectId?: string;
  onSave: (data: EnvironmentFormData) => Promise<void>;
  onClose: () => void;
}

export const useEnvironmentFormModal = ({
  isOpen,
  editingEnvironment,
  projects,
  defaultProjectId,
  onSave,
  onClose,
}: UseEnvironmentFormModalProps) => {
  const [name, setName] = useState('');
  const [projectId, setProjectId] = useState('');
  const [isBaseUrl, setIsBaseUrl] = useState(true);
  const [stageValues, setStageValues] = useState<EnvironmentValuesMap>({
    LOCAL: null,
    DEVELOPMENT: '',
    TESTING: '',
    STAGING: '',
    PRODUCTION: '',
  });
  const [status, setStatus] = useState(true);
  const [variables, setVariables] = useState<VariableDraftItem[]>([]);
  const [showVariablesSection, setShowVariablesSection] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (editingEnvironment) {
      setName(editingEnvironment.name);
      setProjectId(editingEnvironment.projectId);
      const isBase = editingEnvironment.isBaseUrl !== false;
      setIsBaseUrl(isBase);
      setStatus(editingEnvironment.status);

      const initialValues: EnvironmentValuesMap = {
        LOCAL: null,
        DEVELOPMENT: '',
        TESTING: '',
        STAGING: '',
        PRODUCTION: '',
      };

      if (editingEnvironment.values && Object.keys(editingEnvironment.values).length > 0) {
        for (const stage of ALL_ENVIRONMENT_TYPES) {
          const val = editingEnvironment.values[stage];
          if (val !== undefined && val !== null) {
            initialValues[stage] = String(val);
          }
        }
      } else {
        const legacyBaseUrl = getEnvironmentBaseUrl(editingEnvironment);
        if (legacyBaseUrl && editingEnvironment.environmentType) {
          initialValues[editingEnvironment.environmentType] = legacyBaseUrl;
        }
      }

      if (isBase) {
        initialValues.LOCAL = null;
      }
      setStageValues(initialValues);

      let initialVars: VariableDraftItem[] = [];
      if (Array.isArray(editingEnvironment.variables) && editingEnvironment.variables.length > 0) {
        initialVars = editingEnvironment.variables
          .filter((v) => v.key.toLowerCase() !== 'baseurl' && v.key.toLowerCase() !== 'base_url')
          .map((v) => ({
            id: v.id || generateId(),
            key: v.key || '',
            value: v.value || '',
            type: v.type || 'plain',
            enabled: v.enabled !== false,
            description: v.description || '',
            showValue: false,
          }));
      }
      setVariables(initialVars);
      setShowVariablesSection(initialVars.length > 0);
    } else {
      setName('');
      setProjectId(defaultProjectId || (projects.length > 0 ? projects[0].id : ''));
      setIsBaseUrl(true);
      setStageValues({
        LOCAL: null,
        DEVELOPMENT: '',
        TESTING: '',
        STAGING: '',
        PRODUCTION: '',
      });
      setStatus(true);
      setVariables([]);
      setShowVariablesSection(false);
    }
  }, [editingEnvironment, projects, defaultProjectId, isOpen]);

  const handleStageValueChange = useCallback((stage: EnvironmentType, val: string) => {
    setStageValues((prev) => ({
      ...prev,
      [stage]: val,
    }));
  }, []);

  const handleToggleIsBaseUrl = useCallback((val: boolean) => {
    setIsBaseUrl(val);
    setStageValues((prev) => {
      if (val) {
        return { ...prev, LOCAL: null };
      }
      return { ...prev, LOCAL: prev.LOCAL || '' };
    });
  }, []);

  const handleAddVariable = useCallback((
    key = '',
    value = '',
    type: 'plain' | 'secret' = 'plain',
    description = ''
  ) => {
    setVariables((prev) => [
      ...prev,
      {
        id: generateId(),
        key,
        value,
        type,
        enabled: true,
        description,
        showValue: type === 'plain',
      },
    ]);
    setShowVariablesSection(true);
  }, []);

  const handleUpdateVariable = useCallback((id: string, updates: Partial<VariableDraftItem>) => {
    setVariables((prev) =>
      prev.map((item) => (item.id === id ? { ...item, ...updates } : item))
    );
  }, []);

  const handleRemoveVariable = useCallback((id: string) => {
    setVariables((prev) => prev.filter((item) => item.id !== id));
  }, []);

  const handleToggleShowValue = useCallback((id: string) => {
    setVariables((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, showValue: !item.showValue } : item
      )
    );
  }, []);

  const handleClearAllVariables = useCallback(() => {
    setVariables([]);
  }, []);

  const handleSubmit = useCallback(async (e: FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !projectId) return;

    const cleanVariables: EnvironmentVariable[] = variables
      .filter((v) => v.key.trim().length > 0)
      .map((v) => ({
        id: v.id,
        key: v.key.trim(),
        value: v.value,
        type: v.type,
        enabled: v.enabled,
        description: v.description?.trim() || undefined,
      }));

    const normalizedMatrix = normalizeEnvironmentValues(stageValues, isBaseUrl);

    const firstFilledStage =
      ALL_ENVIRONMENT_TYPES.find((s) => s !== 'LOCAL' && normalizedMatrix[s]) || 'DEVELOPMENT';
    const legacyBaseUrl = normalizedMatrix[firstFilledStage] || '';

    setIsSubmitting(true);
    try {
      await onSave({
        name: name.trim(),
        projectId,
        isBaseUrl,
        values: normalizedMatrix,
        environmentType: firstFilledStage,
        variables: cleanVariables,
        baseUrl: legacyBaseUrl,
        status,
      });
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  }, [name, projectId, variables, stageValues, isBaseUrl, status, onSave, onClose]);

  return {
    name,
    setName,
    projectId,
    setProjectId,
    isBaseUrl,
    stageValues,
    status,
    setStatus,
    variables,
    showVariablesSection,
    setShowVariablesSection,
    isSubmitting,
    handleStageValueChange,
    handleToggleIsBaseUrl,
    handleAddVariable,
    handleUpdateVariable,
    handleRemoveVariable,
    handleToggleShowValue,
    handleClearAllVariables,
    handleSubmit,
  };
};
