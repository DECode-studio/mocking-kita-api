'use client';

import React from 'react';
import { Plus, Search } from 'lucide-react';
import { RequestScenario } from '@/src/domain/request-scenario/entity/request_scenario';
import { ResponseScenario } from '@/src/domain/response-scenario/entity/response_scenario';
import { StatusSwitch } from '@/src/presentation/components/shared/StatusSwitch';

interface RequestScenarioSidebarProps {
  reqScenarios: RequestScenario[];
  responseScenarios: ResponseScenario[];
  activeReqScenarioId: string | null;
  scenarioSearch: string;
  onSearchChange: (search: string) => void;
  onSelectScenario: (id: string) => void;
  onAddClick: () => void;
  onToggleStatus: (id: string) => void;
}

export const RequestScenarioSidebar: React.FC<RequestScenarioSidebarProps> = ({
  reqScenarios,
  responseScenarios,
  activeReqScenarioId,
  scenarioSearch,
  onSearchChange,
  onSelectScenario,
  onAddClick,
  onToggleStatus,
}) => {
  const filtered = reqScenarios.filter((r) =>
    r.name.toLowerCase().includes(scenarioSearch.toLowerCase())
  );

  return (
    <div className="lg:col-span-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 space-y-3 flex flex-col justify-between shadow-xs">
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
            Request Scenarios
          </h3>
          <button
            type="button"
            onClick={onAddClick}
            className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded-md transition-colors"
          >
            <Plus className="w-3.5 h-3.5" /> Add
          </button>
        </div>

        <div className="relative">
          <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={scenarioSearch}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Filter scenarios..."
            className="w-full pl-8 pr-2.5 py-1 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-md text-slate-900 dark:text-slate-100 focus:outline-none"
          />
        </div>

        <div className="space-y-1.5 max-h-125 overflow-y-auto pr-1">
          {reqScenarios.length === 0 ? (
            <div className="p-4 border border-dashed border-slate-200 dark:border-slate-800 rounded-lg text-center">
              <p className="text-xs text-slate-500">No request scenarios configured.</p>
              <button
                type="button"
                onClick={onAddClick}
                className="mt-2 text-xs text-indigo-600 font-semibold hover:underline"
              >
                Create first scenario
              </button>
            </div>
          ) : (
            filtered.map((req) => {
              const isSelected = activeReqScenarioId === req.id;
              const respCount = responseScenarios.filter(
                (res) => res.requestScenarioId === req.id && !res.deletedAt
              ).length;

              return (
                <div
                  key={req.id}
                  onClick={() => onSelectScenario(req.id)}
                  className={`p-3 rounded-lg border text-left cursor-pointer transition-all space-y-2 ${
                    isSelected
                      ? 'border-indigo-600 bg-indigo-50/60 dark:bg-indigo-950/60 shadow-xs'
                      : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <span className="font-semibold text-xs text-slate-900 dark:text-slate-100 truncate">
                      {req.name}
                    </span>
                    <StatusSwitch
                      checked={req.status}
                      onCheckedChange={() => onToggleStatus(req.id)}
                      size="sm"
                    />
                  </div>

                  <div className="flex items-center justify-between text-[10px] font-mono text-slate-500">
                    <span className="px-1.5 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded uppercase">
                      {req.matchType}
                    </span>
                    <span>Prio: {req.priority}</span>
                    <span className="text-indigo-600 dark:text-indigo-400 font-semibold">
                      {respCount} Resps
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
