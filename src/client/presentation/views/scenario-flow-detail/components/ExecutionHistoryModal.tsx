'use client';

import React from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import {
  X,
  History,
  CheckCircle2,
  XCircle,
  Clock,
  ArrowRight,
  FileDown,
  FileSpreadsheet,
} from 'lucide-react';
import { ScenarioFlowExecution } from '@/src/client/domain/scenario-flow/entity/scenario_flow';
import { formatDate } from '@/src/core/utils/date';
import {
  exportExecutionToMarkdown,
  exportExecutionToCsv,
} from '../utils/scenarioFlowLogExport';
import { SCENARIO_FLOW_DETAIL_SEMANTIC_ID } from '../constant';

interface ExecutionHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  flowName?: string;
  executions: ScenarioFlowExecution[];
  onSelectExecution: (exec: ScenarioFlowExecution) => void;
  onExportExecution?: (exec: ScenarioFlowExecution, format: 'md' | 'csv') => void;
}

export const ExecutionHistoryModal: React.FC<ExecutionHistoryModalProps> = ({
  isOpen,
  onClose,
  flowName,
  executions,
  onSelectExecution,
  onExportExecution,
}) => {
  const handlePickExecution = (exec: ScenarioFlowExecution) => {
    onSelectExecution(exec);
    onClose();
  };

  return (
    <Dialog.Root open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs z-50 animate-in fade-in" />
        <Dialog.Content
          id={SCENARIO_FLOW_DETAIL_SEMANTIC_ID.MODAL_HISTORY}
          className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-2xl z-50 max-h-[85vh] overflow-y-auto space-y-4"
        >
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-purple-500/10 dark:bg-purple-500/20 text-purple-600 dark:text-purple-400 flex items-center justify-center">
                <History className="w-4 h-4" />
              </div>
              <div>
                <Dialog.Title className="text-base font-bold text-slate-900 dark:text-white">
                  Execution Run History
                </Dialog.Title>
                <Dialog.Description className="text-xs text-slate-500 dark:text-slate-400">
                  Past test executions saved in database
                </Dialog.Description>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {executions.length === 0 ? (
            <div className="py-12 text-center text-slate-500 text-xs space-y-2">
              <Clock className="w-8 h-8 mx-auto text-slate-400" />
              <p>No executions recorded yet.</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {executions.map((exec) => {
                const passed = exec.status === 'SUCCESS';
                return (
                  <div
                    key={exec.id}
                    onClick={() => handlePickExecution(exec)}
                    className="py-3 px-3.5 -mx-3.5 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/50 flex items-center justify-between gap-4 transition-colors cursor-pointer group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="shrink-0">
                        {passed ? (
                          <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                        ) : (
                          <XCircle className="w-5 h-5 text-rose-500" />
                        )}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-slate-900 dark:text-white">
                            {passed ? 'Passed All Steps' : `Failed (${exec.passedSteps}/${exec.totalSteps})`}
                          </span>
                          {exec.environment && (
                            <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
                              {exec.environment.name}
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-slate-500 font-mono mt-0.5">
                          {formatDate(exec.createdAt)} • by {exec.executedBy || 'User'}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      {/* Export Action Buttons */}
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            if (onExportExecution) {
                              onExportExecution(exec, 'md');
                            } else {
                              exportExecutionToMarkdown(exec, flowName);
                            }
                          }}
                          title="Download report as Markdown (.md)"
                          className="px-2 py-0.5 rounded text-[11px] font-semibold text-slate-600 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-slate-200 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 transition-colors flex items-center gap-1 cursor-pointer"
                        >
                          <FileDown className="w-3 h-3 text-indigo-500" />
                          <span>MD</span>
                        </button>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            if (onExportExecution) {
                              onExportExecution(exec, 'csv');
                            } else {
                              exportExecutionToCsv(exec, flowName);
                            }
                          }}
                          title="Download results as CSV (.csv)"
                          className="px-2 py-0.5 rounded text-[11px] font-semibold text-slate-600 dark:text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-slate-200 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 transition-colors flex items-center gap-1 cursor-pointer"
                        >
                          <FileSpreadsheet className="w-3 h-3 text-emerald-500" />
                          <span>CSV</span>
                        </button>
                      </div>

                      <span className="text-xs font-mono text-slate-400 flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {exec.durationMs}ms
                      </span>
                      <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-purple-500 transition-colors" />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
};
