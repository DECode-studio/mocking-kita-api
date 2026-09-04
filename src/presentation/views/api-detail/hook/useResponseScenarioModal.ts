'use client';

import { useState, useEffect, useRef } from 'react';
import { ResponseScenario } from '@/src/domain/response-scenario/entity/response_scenario';

interface UseResponseScenarioModalProps {
  isOpen: boolean;
  editingRespScenario: ResponseScenario | null;
  onSubmit: (data: {
    name: string;
    statusCode: number;
    priority: number;
    weight: number;
    body: string;
    delayMs: number;
    status: boolean;
    responseType: 'JSON' | 'FILE';
    filePath?: string | null;
    fileName?: string | null;
  }) => void;
  onUploadFile: (file: File) => Promise<{ filePath: string; fileName: string }>;
}

export function useResponseScenarioModal({
  isOpen,
  editingRespScenario,
  onSubmit,
  onUploadFile,
}: UseResponseScenarioModalProps) {
  const [name, setName] = useState('');
  const [statusCode, setStatusCode] = useState(200);
  const [priority, setPriority] = useState(100);
  const [weight, setWeight] = useState(100);
  const [body, setBody] = useState('{\n  "message": "Success"\n}');
  const [delayMs, setDelayMs] = useState(0);
  const [status, setStatus] = useState(true);

  // File Upload states
  const [responseType, setResponseType] = useState<'JSON' | 'FILE'>('JSON');
  const [filePath, setFilePath] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const isUploadingRef = useRef(false);

  useEffect(() => {
    if (editingRespScenario) {
      setName(editingRespScenario.name);
      setStatusCode(editingRespScenario.statusCode);
      setPriority(editingRespScenario.priority || 100);
      setWeight(editingRespScenario.weight || 100);
      setBody(
        typeof editingRespScenario.body === 'string'
          ? editingRespScenario.body
          : JSON.stringify(editingRespScenario.body || {}, null, 2)
      );
      setDelayMs(editingRespScenario.delayMs);
      setStatus(editingRespScenario.status);
      setResponseType(editingRespScenario.responseType || 'JSON');
      setFilePath(editingRespScenario.filePath || null);
      setFileName(editingRespScenario.fileName || null);
    } else {
      setName('');
      setStatusCode(200);
      setPriority(100);
      setWeight(100);
      setBody('{\n  "message": "Success"\n}');
      setDelayMs(0);
      setStatus(true);
      setResponseType('JSON');
      setFilePath(null);
      setFileName(null);
    }
  }, [editingRespScenario, isOpen]);

  const handleFileUpload = async (file: File) => {
    if (isUploadingRef.current) return;

    isUploadingRef.current = true;
    setIsUploading(true);
    try {
      const data = await onUploadFile(file);
      setFilePath(data.filePath);
      setFileName(data.fileName);
    } catch (err: any) {
      alert(err.message || 'Upload failed');
    } finally {
      isUploadingRef.current = false;
      setIsUploading(false);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    if (isUploadingRef.current) return;
    setDragOver(true);
  };

  const handleDragLeave = () => {
    setDragOver(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    if (isUploadingRef.current) return;
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      await handleFileUpload(file);
    }
  };

  const removeFile = () => {
    setFilePath(null);
    setFileName(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      name,
      statusCode: Number(statusCode) || 200,
      priority: Number(priority) || 100,
      weight: Number(weight) || 100,
      body,
      delayMs: Number(delayMs) || 0,
      status,
      responseType,
      filePath,
      fileName,
    });
  };

  return {
    name,
    setName,
    statusCode,
    setStatusCode,
    priority,
    setPriority,
    weight,
    setWeight,
    body,
    setBody,
    delayMs,
    setDelayMs,
    status,
    setStatus,
    responseType,
    setResponseType,
    filePath,
    fileName,
    isUploading,
    dragOver,
    handleFileUpload,
    handleDragOver,
    handleDragLeave,
    handleDrop,
    removeFile,
    handleSubmit,
  };
}
