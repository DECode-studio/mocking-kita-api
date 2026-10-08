'use client';

import { useState, useEffect, useMemo } from 'react';
import { DataSheet } from '@/src/client/domain/data-sheet/entity/data_sheet';
import { DataSheetUseCase } from '@/src/client/domain/data-sheet/usecase/data_sheet_usecase';
import { getService, CLIENT_DI_TOKENS } from '@/src/core/di';

interface UseDataSheetVariablePickerOptions {
  projectId?: string;
  onInsert?: (token: string) => void;
  customDataSheetUseCase?: DataSheetUseCase;
}

export function useDataSheetVariablePicker({
  projectId,
  onInsert,
  customDataSheetUseCase,
}: UseDataSheetVariablePickerOptions = {}) {
  const [isOpen, setIsOpen] = useState(false);
  const [sheets, setSheets] = useState<DataSheet[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [copiedToken, setCopiedToken] = useState<string | null>(null);

  const dataSheetUseCase = useMemo(
    () => customDataSheetUseCase || getService(CLIENT_DI_TOKENS.dataSheetUseCase),
    [customDataSheetUseCase]
  );

  useEffect(() => {
    if (!isOpen) return;
    let isMounted = true;
    const fetchSheets = async () => {
      setIsLoading(true);
      try {
        const list = await dataSheetUseCase.getAll({ projectId: projectId || undefined });
        if (isMounted) {
          setSheets(list.filter((s) => s.status && !s.deletedAt));
        }
      } catch (err) {
        console.error('Failed to load data sheets for picker', err);
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };
    void fetchSheets();
    return () => {
      isMounted = false;
    };
  }, [isOpen, projectId, dataSheetUseCase]);

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

  const filteredSheets = useMemo(() => {
    return sheets.filter((s) => {
      if (!search.trim()) return true;
      const q = search.toLowerCase();
      return (
        s.name.toLowerCase().includes(q) ||
        s.code.toLowerCase().includes(q) ||
        s.category?.toLowerCase().includes(q)
      );
    });
  }, [sheets, search]);


  return {
    isOpen,
    setIsOpen,
    isLoading,
    search,
    setSearch,
    copiedToken,
    filteredSheets,
    handleCopy,
    handleInsert,
  };
}
