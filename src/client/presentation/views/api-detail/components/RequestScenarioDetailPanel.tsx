'use client';


import React from 'react';
import { Edit2, Copy, Trash2, Layers } from 'lucide-react';
import { RequestScenario } from '@/src/client/domain/request-scenario/entity/request_scenario';
import { StatusBadge } from '@/src/client/presentation/components/shared/StatusBadge';
import { StatusSwitch } from '@/src/client/presentation/components/shared/StatusSwitch';
import { extractParamRule, updateDeepPath } from '@/src/core/utils/param-matcher';
import { API_DETAIL_TEXT, API_DETAIL_SEMANTIC_ID } from '../constant';
import { DeepJsonTreeViewer } from './DeepJsonTreeViewer';

/* eslint-disable @typescript-eslint/no-explicit-any */
interface RequestScenarioDetailPanelProps {
  scenario: RequestScenario;
  onEdit: () => void;
  onDuplicate: () => void;
  onDeleteRequest: () => void;
  onUpdateScenario?: (updated: RequestScenario) => void;
  children?: React.ReactNode;
}

export const RequestScenarioDetailPanel: React.FC<RequestScenarioDetailPanelProps> = ({
  scenario,
  onEdit,
  onDuplicate,
  onDeleteRequest,
  onUpdateScenario,
  children,
}) => {
  const handleTogglePath = (
    field: 'queryParams' | 'headers' | 'body',
    path: (string | number)[],
    currentEnabled: boolean
  ) => {
    if (!onUpdateScenario) return;

    let targetObj = scenario[field];
    if (typeof targetObj === 'string') {
      try {
        targetObj = JSON.parse(targetObj);
      } catch {
        targetObj = {};
      }
    } else if (!targetObj || typeof targetObj !== 'object') {
      targetObj = {};
    }

    const updatedObj = updateDeepPath(targetObj, path, (currentVal) => {
      const rule = extractParamRule(currentVal);
      const nextEnabled = !currentEnabled;
      if (rule.operator === 'equal' && nextEnabled) {
        return rule.value;
      }
      return {
        $operator: rule.operator,
        $value: rule.value,
        $enabled: nextEnabled,
      };
    });

    onUpdateScenario({
      ...scenario,
      [field]: updatedObj,
    });
  };

  const handleToggleBodyRule = (index: number, currentEnabled: boolean) => {
    if (!onUpdateScenario || !scenario.bodyRules) return;
    const updatedRules = [...scenario.bodyRules];
    updatedRules[index] = {
      ...updatedRules[index],
      enabled: !currentEnabled,
    };
    onUpdateScenario({
      ...scenario,
      bodyRules: updatedRules,
    });
  };

  const handleToggleStrictStructure = (currentStrict: boolean) => {
    if (!onUpdateScenario) return;
    onUpdateScenario({
      ...scenario,
      strictBodyStructure: !currentStrict,
    });
  };

  const parsedBody = React.useMemo(() => {
    if (typeof scenario.body === 'string') {
      const trimmed = scenario.body.trim();
      if (!trimmed) return {};
      try {
        return JSON.parse(trimmed);
      } catch {
        return scenario.body;
      }
    }
    return scenario.body ?? {};
  }, [scenario.body]);

  const strategy = scenario.matchStrategy || 'ALL';
  const bodyType = scenario.bodyType || 'JSON';
  const bodyRules = scenario.bodyRules || [];

  return (
    <div id={API_DETAIL_SEMANTIC_ID.SCENARIO_DETAIL} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 space-y-6 shadow-xs">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <h3 className="font-bold text-base text-slate-900 dark:text-slate-100">{scenario.name}</h3>
            <StatusBadge status={scenario.status} />
            <span
              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium font-mono ${
                strategy === 'ANY'
                  ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20'
                  : 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20'
              }`}
            >
              <Layers className="w-3 h-3" />
              {strategy === 'ANY' ? 'Match ANY (OR)' : 'Match ALL (AND)'}
            </span>
          </div>
          <p className="text-xs text-slate-500 font-mono">
            {API_DETAIL_TEXT.DETAIL_RULE_WEIGHT}: <span className="font-bold text-indigo-600 dark:text-indigo-400">{scenario.priority}</span>
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onEdit}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors cursor-pointer"
          >
            <Edit2 className="w-3.5 h-3.5" /> Edit Rule
          </button>
          <button
            type="button"
            onClick={onDuplicate}
            className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-lg cursor-pointer"
            title="Duplicate Rule"
          >
            <Copy className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={onDeleteRequest}
            className="p-1.5 text-rose-500 hover:text-rose-700 rounded-lg cursor-pointer"
            title="Delete Rule"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="space-y-4">
        <div>
          <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2 font-mono">
            {API_DETAIL_TEXT.DETAIL_PARAM_MATCHING}
          </h4>
          <div className="p-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-xs font-mono text-slate-800 dark:text-slate-200 max-h-60 overflow-y-auto">
            <DeepJsonTreeViewer
              data={scenario.queryParams}
              onTogglePath={(path, currentEnabled) =>
                handleTogglePath('queryParams', path, currentEnabled)
              }
              readOnly={!onUpdateScenario}
            />
          </div>
        </div>

        <div>
          <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2 font-mono">
            {API_DETAIL_TEXT.DETAIL_HEADER_MATCHING}
          </h4>
          <div className="p-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-xs font-mono text-slate-800 dark:text-slate-200 max-h-60 overflow-y-auto">
            <DeepJsonTreeViewer
              data={scenario.headers}
              onTogglePath={(path, currentEnabled) =>
                handleTogglePath('headers', path, currentEnabled)
              }
              readOnly={!onUpdateScenario}
            />
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-500 font-mono">
              {bodyType === 'JSON'
                ? 'Full Body Payload Matching'
                : bodyType === 'FORM_DATA'
                ? 'Body Fields & Files Matching'
                : bodyType === 'URL_ENCODED'
                ? 'URL Encoded Fields Matching'
                : API_DETAIL_TEXT.DETAIL_BODY_MATCHING}
            </h4>
            <span
              className={`px-2 py-0.5 rounded text-[10px] font-mono font-semibold uppercase tracking-wider border ${
                bodyType === 'JSON'
                  ? 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/20'
                  : bodyType === 'FORM_DATA'
                  ? 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20'
                  : bodyType === 'URL_ENCODED'
                  ? 'bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border-cyan-500/20'
                  : 'bg-slate-500/10 text-slate-600 dark:text-slate-400 border-slate-500/20'
              }`}
            >
              {bodyType}
            </span>
          </div>

          {bodyType === 'NONE' ? (
            <div className="py-4 text-center text-xs text-slate-400 italic bg-slate-50 dark:bg-slate-950/40 rounded-lg border border-dashed border-slate-200 dark:border-slate-800">
              Skenario ini tidak mengevaluasi request body (Body Type: None).
            </div>
          ) : (
            <div className="p-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-xs font-mono text-slate-800 dark:text-slate-200 max-h-72 overflow-y-auto">
              <DeepJsonTreeViewer
                data={parsedBody}
                onTogglePath={(path, currentEnabled) =>
                  handleTogglePath('body', path, currentEnabled)
                }
                readOnly={!onUpdateScenario}
              />
            </div>
          )}
        </div>

        {bodyType !== 'NONE' && bodyRules.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-500 font-mono">
                Body Path Rules ({bodyRules.length})
              </h4>
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-mono text-slate-500">
                  Strict Structure:
                </span>
                <span
                  className={`px-1.5 py-0.2 rounded border text-[10px] font-mono uppercase font-bold tracking-wider ${
                    scenario.strictBodyStructure !== false
                      ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20'
                      : 'bg-slate-500/10 text-slate-500 dark:text-slate-400 border-slate-500/20'
                  }`}
                >
                  {scenario.strictBodyStructure !== false ? 'ON' : 'OFF'}
                </span>
                {onUpdateScenario && (
                  <StatusSwitch
                    size="sm"
                    checked={scenario.strictBodyStructure !== false}
                    onCheckedChange={(checked) => handleToggleStrictStructure(scenario.strictBodyStructure !== false)}
                  />
                )}
              </div>
            </div>
            <div className="p-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-xs font-mono space-y-2">
              {bodyRules.map((rule, idx) => (
                <div
                  key={idx}
                  className={`flex items-center justify-between p-2 rounded border ${
                    rule.enabled
                      ? 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800'
                      : 'bg-slate-100/60 dark:bg-slate-950/60 border-slate-200/50 dark:border-slate-800/50 opacity-60'
                  }`}
                >
                  <div className="flex items-center gap-2 overflow-hidden">
                    <span className={`font-semibold text-indigo-600 dark:text-indigo-400 ${!rule.enabled ? 'line-through opacity-50' : ''}`}>
                      {rule.path}
                    </span>
                    <span className="px-1.5 py-0.2 rounded border text-[10px] font-mono uppercase font-bold tracking-wider bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700">
                      {rule.operator}
                    </span>
                    {rule.operator !== 'null' && rule.operator !== 'empty_array' && (
                      <span className={`text-slate-900 dark:text-slate-100 truncate ${!rule.enabled ? 'line-through opacity-50' : ''}`}>
                        {String(rule.value ?? '')}
                      </span>
                    )}
                    {!rule.enabled && (
                      <span className="text-[10px] text-amber-500 font-medium">(Disabled)</span>
                    )}
                  </div>
                  {onUpdateScenario && (
                    <div className="shrink-0 pl-2">
                      <StatusSwitch
                        size="sm"
                        checked={rule.enabled !== false}
                        onCheckedChange={(checked) => handleToggleBodyRule(idx, rule.enabled !== false)}
                      />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {children}
    </div>
  );
};
