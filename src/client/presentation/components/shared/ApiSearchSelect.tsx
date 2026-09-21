'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { ApiCollection } from '@/src/client/domain/api/entity/api_collection';

interface GroupedApis {
  projectId: string;
  projectName: string;
  apis: ApiCollection[];
}

interface ApiLabelInfo {
  methodRequest: string;
  path: string;
  name: string;
}

interface ApiSearchSelectProps {
  groupedApis: GroupedApis[];
  selectedApiId: string;
  selectedApi: ApiLabelInfo | null;
  onSelect: (apiId: string) => void;
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function highlightMatch(text: string, query: string): React.ReactNode {
  const q = query.trim();
  if (!q) return text;
  const regex = new RegExp(`(${escapeRegExp(q)})`, 'gi');
  const parts = text.split(regex);
  return parts.map((part, i) =>
    i % 2 === 1 ? (
      <mark
        key={i}
        className="bg-purple-200 dark:bg-purple-500/40 text-purple-900 dark:text-purple-100 font-bold rounded-sm px-0.5"
      >
        {part}
      </mark>
    ) : (
      <React.Fragment key={i}>{part}</React.Fragment>
    )
  );
}

function apiLabel(api: ApiLabelInfo): string {
  return `[${api.methodRequest}] ${api.path} - ${api.name}`;
}

type ApiOption = { kind: 'custom' } | { kind: 'api'; api: ApiCollection };

export const ApiSearchSelect: React.FC<ApiSearchSelectProps> = ({
  groupedApis,
  selectedApiId,
  selectedApi,
  onSelect,
}) => {
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(0);
  const comboRef = useRef<HTMLDivElement>(null);
  const optionRefs = useRef<Array<HTMLDivElement | null>>([]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (comboRef.current && !comboRef.current.contains(e.target as Node)) {
        setIsOpen(false);
        setQuery('');
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    setHighlightedIndex(0);
  }, [query, isOpen]);

  const searchFilteredGroupedApis = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return groupedApis;
    return groupedApis
      .map((group) => ({
        ...group,
        apis: group.apis.filter((api) => apiLabel(api).toLowerCase().includes(q)),
      }))
      .filter((group) => group.apis.length > 0);
  }, [groupedApis, query]);

  const flatOptions = useMemo<ApiOption[]>(() => {
    const opts: ApiOption[] = [{ kind: 'custom' }];
    for (const group of searchFilteredGroupedApis) {
      for (const api of group.apis) {
        opts.push({ kind: 'api', api });
      }
    }
    return opts;
  }, [searchFilteredGroupedApis]);

  const apiIdToOptionIndex = useMemo(() => {
    const map = new Map<string, number>();
    flatOptions.forEach((opt, i) => {
      if (opt.kind === 'api') map.set(opt.api.id, i);
    });
    return map;
  }, [flatOptions]);

  useEffect(() => {
    if (!isOpen) return;
    optionRefs.current[highlightedIndex]?.scrollIntoView({ block: 'nearest' });
  }, [highlightedIndex, isOpen]);

  const selectOption = (apiId: string) => {
    onSelect(apiId);
    setIsOpen(false);
    setQuery('');
  };

  return (
    <div className="relative" ref={comboRef}>
      <div
        onClick={() => {
          setIsOpen(true);
          setQuery('');
        }}
        className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white focus-within:ring-2 focus-within:ring-purple-500/30 cursor-pointer flex items-center gap-2"
      >
        {isOpen ? (
          <input
            autoFocus
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onClick={(e) => e.stopPropagation()}
            onKeyDown={(e) => {
              if (e.key === 'Escape') {
                setIsOpen(false);
                setQuery('');
              } else if (e.key === 'ArrowDown') {
                e.preventDefault();
                setHighlightedIndex((prev) => Math.min(prev + 1, flatOptions.length - 1));
              } else if (e.key === 'ArrowUp') {
                e.preventDefault();
                setHighlightedIndex((prev) => Math.max(prev - 1, 0));
              } else if (e.key === 'Enter') {
                e.preventDefault();
                const opt = flatOptions[highlightedIndex];
                if (!opt) return;
                selectOption(opt.kind === 'custom' ? '' : opt.api.id);
              }
            }}
            placeholder="Cari method, path, atau nama endpoint..."
            className="w-full bg-transparent outline-hidden text-xs text-slate-900 dark:text-white placeholder:text-slate-400"
          />
        ) : (
          <span className={`truncate flex-1 ${selectedApi ? '' : 'text-slate-400'}`}>
            {selectedApi ? apiLabel(selectedApi) : '-- Or enter Custom Endpoint below --'}
          </span>
        )}
        <ChevronDown
          className={`w-3.5 h-3.5 shrink-0 text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`}
        />
      </div>

      {isOpen && (
        <div className="absolute z-20 mt-1 w-full max-h-64 overflow-y-auto rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-lg">
          <div
            ref={(el) => {
              optionRefs.current[0] = el;
            }}
            onClick={() => selectOption('')}
            onMouseEnter={() => setHighlightedIndex(0)}
            className={`px-3 py-2 text-xs cursor-pointer ${
              highlightedIndex === 0
                ? 'bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300'
                : 'text-slate-500 dark:text-slate-400'
            }`}
          >
            -- Or enter Custom Endpoint below --
          </div>
          {searchFilteredGroupedApis.length === 0 && (
            <div className="px-3 py-4 text-xs text-center text-slate-400">Tidak ada API yang cocok</div>
          )}
          {searchFilteredGroupedApis.map((group) => (
            <div key={group.projectId}>
              <div className="px-3 py-1 text-[10px] font-semibold text-slate-400 bg-slate-50 dark:bg-slate-950/60 sticky top-0">
                📁 {group.projectName}
              </div>
              {group.apis.map((api) => {
                const idx = apiIdToOptionIndex.get(api.id) ?? -1;
                const isKeyboardHighlighted = idx === highlightedIndex;
                return (
                  <div
                    key={api.id}
                    ref={(el) => {
                      optionRefs.current[idx] = el;
                    }}
                    onClick={() => selectOption(api.id)}
                    onMouseEnter={() => setHighlightedIndex(idx)}
                    className={`px-3 py-1.5 text-xs cursor-pointer ${
                      isKeyboardHighlighted
                        ? 'bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300'
                        : api.id === selectedApiId
                        ? 'bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300'
                        : 'text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    {highlightMatch(apiLabel(api), query)}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
