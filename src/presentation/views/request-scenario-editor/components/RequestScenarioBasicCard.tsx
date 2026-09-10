'use client';

import React from 'react';
import { Settings2 } from 'lucide-react';
import { StatusSwitch } from '@/src/presentation/components/shared/StatusSwitch';
import { MatchStrategy } from '@/src/core/utils/types';
import {
  REQUEST_SCENARIO_EDITOR_TEXT,
  REQUEST_SCENARIO_EDITOR_SEMANTIC_ID,
} from '../constant';

interface RequestScenarioBasicCardProps {
  name: string;
  onNameChange: (value: string) => void;
  priority: number;
  onPriorityChange: (value: number) => void;
  status: boolean;
  onStatusChange: (value: boolean) => void;
  matchStrategy: MatchStrategy;
  onMatchStrategyChange: (value: MatchStrategy) => void;
}

export const RequestScenarioBasicCard: React.FC<RequestScenarioBasicCardProps> = ({
  name,
  onNameChange,
  priority,
  onPriorityChange,
  status,
  onStatusChange,
  matchStrategy,
  onMatchStrategyChange,
}) => {
  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-xs space-y-4">
      <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
        <div className="flex items-center gap-2">
          <Settings2 className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
          <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100">
            Basic Configuration & Matchmaking Strategy
          </h2>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-slate-600 dark:text-slate-400">
            {REQUEST_SCENARIO_EDITOR_TEXT.LABEL_STATUS}:
          </span>
          <StatusSwitch
            checked={status}
            onCheckedChange={onStatusChange}
            label={status ? 'Active' : 'Inactive'}
            size="sm"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-4 text-xs">
        <div className="md:col-span-6 space-y-1.5">
          <label className="block font-semibold text-slate-700 dark:text-slate-300">
            {REQUEST_SCENARIO_EDITOR_TEXT.LABEL_NAME} <span className="text-red-500">*</span>
          </label>
          <input
            id={REQUEST_SCENARIO_EDITOR_SEMANTIC_ID.INPUT_NAME}
            type="text"
            required
            value={name}
            onChange={(e) => onNameChange(e.target.value)}
            placeholder={REQUEST_SCENARIO_EDITOR_TEXT.PLACEHOLDER_NAME}
            className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-900 dark:text-slate-100 focus:outline-none focus:border-indigo-500 font-medium"
          />
          <p className="text-[11px] text-slate-400">
            Identitas unik untuk mendeskripsikan kondisi skenario request ini.
          </p>
        </div>

        <div className="md:col-span-2 space-y-1.5">
          <label className="block font-semibold text-slate-700 dark:text-slate-300">
            {REQUEST_SCENARIO_EDITOR_TEXT.LABEL_PRIORITY}
          </label>
          <input
            id={REQUEST_SCENARIO_EDITOR_SEMANTIC_ID.INPUT_PRIORITY}
            type="number"
            min={1}
            value={priority}
            onChange={(e) => onPriorityChange(Number(e.target.value))}
            className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-900 dark:text-slate-100 focus:outline-none focus:border-indigo-500 font-mono"
          />
          <p className="text-[11px] text-slate-400">Prioritas evaluasi (nilai lebih tinggi dievaluasi duluan).</p>
        </div>

        <div className="md:col-span-4 space-y-1.5">
          <label className="block font-semibold text-slate-700 dark:text-slate-300">
            {REQUEST_SCENARIO_EDITOR_TEXT.LABEL_MATCH_STRATEGY}
          </label>
          <select
            id={REQUEST_SCENARIO_EDITOR_SEMANTIC_ID.SELECT_STRATEGY}
            value={matchStrategy}
            onChange={(e) => onMatchStrategyChange(e.target.value as MatchStrategy)}
            className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-900 dark:text-slate-100 focus:outline-none focus:border-indigo-500 cursor-pointer font-medium"
          >
            <option value="ALL">{REQUEST_SCENARIO_EDITOR_TEXT.STRATEGY_ALL}</option>
            <option value="ANY">{REQUEST_SCENARIO_EDITOR_TEXT.STRATEGY_ANY}</option>
          </select>
          <p className="text-[11px] text-slate-400">
            Pilih apakah seluruh kriteria harus cocok (AND) atau minimal satu cocok (OR).
          </p>
        </div>
      </div>
    </div>
  );
};

