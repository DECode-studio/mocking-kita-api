'use client';

import { useState, useEffect, useCallback, FormEvent } from 'react';
import {
  Environment,
  EnvironmentValuesMap,
  ALL_ENVIRONMENT_TYPES,
  normalizeEnvironmentValues,
  getEnvironmentBaseUrl,
} from '@/src/client/domain/environment/entity/environment';
import { Project } from '@/src/client/domain/project/entity/project';
import { EnvironmentType } from '@/src/core/utils/types';
import { EnvironmentFormData } from './useEnvironments';

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

  const handleSubmit = useCallback(async (e: FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !projectId) return;

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
        variables: [],
        baseUrl: legacyBaseUrl,
        status,
      });
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  }, [name, projectId, stageValues, isBaseUrl, status, onSave, onClose]);

  return {
    name,
    setName,
    projectId,
    setProjectId,
    isBaseUrl,
    stageValues,
    status,
    setStatus,
    isSubmitting,
    handleStageValueChange,
    handleToggleIsBaseUrl,
    handleSubmit,
  };
};
