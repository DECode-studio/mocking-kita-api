'use client';


import { useState, useEffect } from 'react';
import { RequestScenario } from '@/src/client/domain/request-scenario/entity/request_scenario';
import { BodyPathRule, MatchStrategy, RequestBodyType } from '@/src/core/utils/types';

interface UseRequestScenarioModalProps {
  isOpen: boolean;
  editingReqScenario: RequestScenario | null;
  onSubmit: (data: {
    name: string;
    priority: number;
    matchStrategy: MatchStrategy;
    queryParams: string;
    headers: string;
    body: string;
    bodyType: RequestBodyType;
    bodyRules: BodyPathRule[];
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
  const [matchStrategy, setMatchStrategy] = useState<MatchStrategy>('ALL');
  const [queryParams, setQueryParams] = useState('{}');
  const [headers, setHeaders] = useState('{}');
  const [body, setBody] = useState('{}');
  const [bodyType, setBodyType] = useState<RequestBodyType>('JSON');
  const [bodyRules, setBodyRules] = useState<BodyPathRule[]>([]);
  const [status, setStatus] = useState(true);

  useEffect(() => {
    if (editingReqScenario) {
      setName(editingReqScenario.name);
      setPriority(editingReqScenario.priority || 1);
      setMatchStrategy(editingReqScenario.matchStrategy || 'ALL');
      setQueryParams(JSON.stringify(editingReqScenario.queryParams || {}, null, 2));
      setHeaders(JSON.stringify(editingReqScenario.headers || {}, null, 2));
      setBody(
        typeof editingReqScenario.body === 'string'
          ? editingReqScenario.body
          : JSON.stringify(editingReqScenario.body || {}, null, 2)
      );
      setBodyType(editingReqScenario.bodyType || 'JSON');
      setBodyRules(editingReqScenario.bodyRules || []);
      setStatus(editingReqScenario.status);
    } else {
      setName('');
      setPriority(1);
      setMatchStrategy('ALL');
      setQueryParams('{}');
      setHeaders('{}');
      setBody('{}');
      setBodyType('JSON');
      setBodyRules([]);
      setStatus(true);
    }
  }, [editingReqScenario, isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      name,
      priority: Number(priority) || 1,
      matchStrategy,
      queryParams,
      headers,
      body: bodyType === 'NONE' ? '{}' : body,
      bodyType,
      bodyRules: bodyType === 'NONE' ? [] : bodyRules,
      status,
    });
  };

  return {
    name,
    setName,
    priority,
    setPriority,
    matchStrategy,
    setMatchStrategy,
    queryParams,
    setQueryParams,
    headers,
    setHeaders,
    body,
    setBody,
    bodyType,
    setBodyType,
    bodyRules,
    setBodyRules,
    status,
    setStatus,
    handleSubmit,
  };
}

