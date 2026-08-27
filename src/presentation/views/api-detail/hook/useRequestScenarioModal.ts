'use client';

import { useState, useEffect } from 'react';
import { RequestScenario } from '@/src/domain/request-scenario/entity/request_scenario';
import { RequestBodyType } from '@/src/core/utils/types';

interface UseRequestScenarioModalProps {
  isOpen: boolean;
  editingReqScenario: RequestScenario | null;
  onSubmit: (data: {
    name: string;
    priority: number;
    queryParams: string;
    headers: string;
    body: string;
    bodyType: RequestBodyType;
    status: boolean;
  }) => void;
}

export function useRequestScenarioModal({
  isOpen,
  editingReqScenario,
  onSubmit,
}: UseRequestScenarioModalProps) {
  const [name, setName] = useState('');
  const [priority, setPriority] = useState(1);
  const [queryParams, setQueryParams] = useState('{}');
  const [headers, setHeaders] = useState('{}');
  const [body, setBody] = useState('{}');
  const [bodyType, setBodyType] = useState<RequestBodyType>('JSON');
  const [status, setStatus] = useState(true);

  useEffect(() => {
    if (editingReqScenario) {
      setName(editingReqScenario.name);
      setPriority(editingReqScenario.priority || 1);
      setQueryParams(JSON.stringify(editingReqScenario.queryParams || {}, null, 2));
      setHeaders(JSON.stringify(editingReqScenario.headers || {}, null, 2));
      setBody(
        typeof editingReqScenario.body === 'string'
          ? editingReqScenario.body
          : JSON.stringify(editingReqScenario.body || {}, null, 2)
      );
      setBodyType(editingReqScenario.bodyType || 'JSON');
      setStatus(editingReqScenario.status);
    } else {
      setName('');
      setPriority(1);
      setQueryParams('{}');
      setHeaders('{}');
      setBody('{}');
      setBodyType('JSON');
      setStatus(true);
    }
  }, [editingReqScenario, isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      name,
      priority: Number(priority) || 1,
      queryParams,
      headers,
      body: bodyType === 'NONE' ? '{}' : body,
      bodyType,
      status,
    });
  };

  return {
    name,
    setName,
    priority,
    setPriority,
    queryParams,
    setQueryParams,
    headers,
    setHeaders,
    body,
    setBody,
    bodyType,
    setBodyType,
    status,
    setStatus,
    handleSubmit,
  };
}
