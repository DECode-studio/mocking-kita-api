'use client';

import React, { useState, useEffect, useRef } from 'react';

interface UseKnowledgeImportModalParams {
  isOpen: boolean;
  defaultCategory: 'product' | 'skill';
  onImport: (category: 'product' | 'skill', file: File) => Promise<void>;
  onClose: () => void;
}

export const useKnowledgeImportModal = ({
  isOpen,
  defaultCategory,
  onImport,
  onClose,
}: UseKnowledgeImportModalParams) => {
  const [category, setCategory] = useState<'product' | 'skill'>(defaultCategory);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setCategory(defaultCategory);
      setSelectedFile(null);
      setError(null);
    }
  }, [isOpen, defaultCategory]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const ext = file.name.split('.').pop()?.toLowerCase();
      if (category === 'product' && ext !== 'md' && ext !== 'json') {
        setError('Untuk Product Knowledge, pilih file .md atau .json');
        setSelectedFile(null);
        return;
      }
      if (category === 'skill' && ext !== 'md' && ext !== 'json' && ext !== 'zip') {
        setError('Untuk Skills, pilih file .md, .json, atau .zip');
        setSelectedFile(null);
        return;
      }
      setError(null);
      setSelectedFile(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile) {
      setError('Pilih file yang ingin diimpor');
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);
      await onImport(category, selectedFile);
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Gagal mengimpor file');
    } finally {
      setIsSubmitting(false);
    }
  };

  const selectCategory = (cat: 'product' | 'skill') => {
    setCategory(cat);
    setSelectedFile(null);
    setError(null);
  };

  const acceptedExtensions = category === 'skill' ? '.md,.json,.zip' : '.md,.json';

  return {
    category,
    selectCategory,
    selectedFile,
    isSubmitting,
    error,
    fileInputRef,
    acceptedExtensions,
    handleFileChange,
    handleSubmit,
  };
};

