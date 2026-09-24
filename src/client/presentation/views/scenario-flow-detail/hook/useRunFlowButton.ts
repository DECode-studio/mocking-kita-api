'use client';

import { useState, useCallback, FormEvent } from 'react';

interface UseRunFlowButtonProps {
  onRunFlow: (iterations?: number) => void;
  defaultCustomN?: number;
}

export const useRunFlowButton = ({
  onRunFlow,
  defaultCustomN = 3,
}: UseRunFlowButtonProps) => {
  const [customN, setCustomN] = useState<number>(defaultCustomN);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const handleQuickRun = useCallback((n: number) => {
    setIsDropdownOpen(false);
    onRunFlow(n);
  }, [onRunFlow]);

  const handleCustomRun = useCallback((e: FormEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const count = Math.max(1, Math.min(100, Math.floor(Number(customN) || 1)));
    setIsDropdownOpen(false);
    onRunFlow(count);
  }, [customN, onRunFlow]);

  return {
    customN,
    setCustomN,
    isDropdownOpen,
    setIsDropdownOpen,
    handleQuickRun,
    handleCustomRun,
  };
};
