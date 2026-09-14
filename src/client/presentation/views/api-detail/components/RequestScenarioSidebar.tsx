'use client';


import React from 'react';
import { Plus, Search } from 'lucide-react';
import { RequestScenario } from '@/src/client/domain/request-scenario/entity/request_scenario';
import { ResponseScenario } from '@/src/client/domain/response-scenario/entity/response_scenario';
import { StatusSwitch } from '@/src/client/presentation/components/shared/StatusSwitch';
import { API_DETAIL_TEXT, API_DETAIL_SEMANTIC_ID } from '../constant';

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
    <div id={API_DETAIL_SEMANTIC_ID.SCENARIO_SIDEBAR} className="lg:col-span-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 space-y-3 flex flex-col justify-between shadow-xs">
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
            {API_DETAIL_TEXT.SIDEBAR_TITLE}
          </h3>
          <button
            id={API_DETAIL_SEMANTIC_ID.SCENARIO_SIDEBAR_ADD_BTN}
            type="button"
            onClick={onAddClick}
            className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded-md transition-colors"
          >
            <Plus className="w-3.5 h-3.5" /> {API_DETAIL_TEXT.SIDEBAR_ADD_BTN}
          </button>
        </div>

        <div className="relative">
          <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            id={API_DETAIL_SEMANTIC_ID.SCENARIO_SIDEBAR_SEARCH}
            type="text"
            value={scenarioSearch}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder={API_DETAIL_TEXT.SIDEBAR_SEARCH_PLACEHOLDER}
            className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-md text-slate-900 dark:text-slate-100 focus:outline-none focus:border-indigo-500"
          />
        </div>

        <div className="space-y-1.5 max-h-120 overflow-y-auto pr-1">
          {filtered.length === 0 ? (
            <p className="text-xs text-slate-400 text-center py-6 font-sans">
              {API_DETAIL_TEXT.SIDEBAR_EMPTY}
            </p>
          ) : (
            filtered.map((req) => {
              const respCount = responseScenarios.filter(
                (r) => r.requestScenarioId === req.id && !r.deletedAt
              ).length;
              const isActive = req.id === activeReqScenarioId;

              return (
                <div
                  key={req.id}
                  onClick={() => onSelectScenario(req.id)}
                  data-tour="req-scenario-item"
                  className={`p-3 rounded-lg border cursor-pointer transition-all flex items-center justify-between gap-2 ${
                    isActive
                      ? 'bg-indigo-50/70 dark:bg-indigo-950/60 border-indigo-500/50 shadow-2xs'
                      : 'bg-slate-50/50 dark:bg-slate-950/40 border-slate-200/60 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800/40'
                  }`}
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <span className="font-bold text-xs text-slate-900 dark:text-slate-100 truncate block">
                        {req.name}
                      </span>
                    </div>
                    <span className="text-[10px] font-mono text-slate-400 block">
                      Priority: {req.priority} • {respCount} resps
                    </span>
                  </div>

                  <div className="flex items-center gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
                    <StatusSwitch
                      checked={req.status}
                      onCheckedChange={() => onToggleStatus(req.id)}
                      size="sm"
                    />
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