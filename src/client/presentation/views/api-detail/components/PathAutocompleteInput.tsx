'use client';


import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Sparkles } from 'lucide-react';
import { PathSuggestion } from '@/src/core/utils/types';

interface PathAutocompleteInputProps {
  value: string;
  onChange: (newValue: string) => void;
  suggestions: PathSuggestion[];
  placeholder?: string;
  id?: string;
  disabled?: boolean;
}

export const PathAutocompleteInput: React.FC<PathAutocompleteInputProps> = ({
  value,
  onChange,
  suggestions,
  placeholder = 'e.g. debitur.0.id_number',
  id,
  disabled = false,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const filteredSuggestions = React.useMemo(() => {
    if (!value.trim()) return suggestions;
    const lower = value.toLowerCase().trim();
    return suggestions.filter((s) => s.path.toLowerCase().includes(lower));
  }, [suggestions, value]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (path: string) => {
    onChange(path);
    setIsOpen(false);
    setHighlightedIndex(-1);
    inputRef.current?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!isOpen) {
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
        setIsOpen(true);
        return;
      }
    }

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlightedIndex((prev) =>
        prev < filteredSuggestions.length - 1 ? prev + 1 : 0
      );
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlightedIndex((prev) =>
        prev > 0 ? prev - 1 : filteredSuggestions.length - 1
      );
    } else if (e.key === 'Enter' && highlightedIndex >= 0) {
      e.preventDefault();
      if (filteredSuggestions[highlightedIndex]) {
        handleSelect(filteredSuggestions[highlightedIndex].path);
      }
    } else if (e.key === 'Escape') {
      setIsOpen(false);
    }
  };

  return (
    <div ref={containerRef} className="relative flex-1">
      <div className="flex items-center">
        <input
          ref={inputRef}
          id={id}
          type="text"
          value={value}
          disabled={disabled}
          onChange={(e) => {
            onChange(e.target.value);
            setIsOpen(true);
            setHighlightedIndex(-1);
          }}
          onFocus={() => {
            if (suggestions.length > 0) setIsOpen(true);
          }}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className="w-full px-2.5 py-1 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-md text-slate-900 dark:text-slate-100 font-mono text-xs focus:outline-none focus:border-indigo-500 pr-7"
        />
        {suggestions.length > 0 && !disabled && (
          <button
            type="button"
            tabIndex={-1}
            onClick={() => setIsOpen((prev) => !prev)}
            className="absolute right-1.5 p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 cursor-pointer"
            title="Toggle suggestions"
          >
            <ChevronDown className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {isOpen && filteredSuggestions.length > 0 && (
        <div className="absolute left-0 top-full mt-1 w-full min-w-[280px] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg shadow-2xl max-h-60 overflow-y-auto z-50 py-1 font-mono text-xs">
          <div className="px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500 border-b border-slate-100 dark:border-slate-800 flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-amber-500" />
            Detected Body Paths ({filteredSuggestions.length})
          </div>
          {filteredSuggestions.map((item, idx) => {
            const isHighlighted = idx === highlightedIndex;
            let previewSample = '';
            if (item.sampleValue !== undefined && typeof item.sampleValue !== 'object') {
              previewSample = String(item.sampleValue);
            } else if (item.sampleValue && typeof item.sampleValue === 'object') {
              previewSample = Array.isArray(item.sampleValue) ? `[${item.sampleValue.length}]` : '{...}';
            }

            return (
              <div
                key={item.path}
                onClick={() => handleSelect(item.path)}
                onMouseEnter={() => setHighlightedIndex(idx)}
                className={`flex items-center justify-between px-2.5 py-1.5 cursor-pointer transition-colors ${
                  isHighlighted
                    ? 'bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400'
                    : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                <span className="font-semibold">{item.path}</span>
                {previewSample && (
                  <span className="text-[10px] text-slate-400 dark:text-slate-500 max-w-[140px] truncate ml-2">
                    {previewSample}
                  </span>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
