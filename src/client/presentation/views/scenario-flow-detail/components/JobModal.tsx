'use client';

import React, { useState, useEffect } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import {
  X,
  Clock,
  Repeat,
  Calendar,
  Layers,
  Database,
  Code2,
  Play,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Sparkles,
} from 'lucide-react';
import { ScenarioFlowJob } from '@/src/client/domain/scenario-flow/entity/scenario_flow';
import { Environment } from '@/src/client/domain/environment/entity/environment';
import { DataSheet } from '@/src/client/domain/data-sheet/entity/data_sheet';

interface JobModalProps {
  isOpen: boolean;
  onClose: () => void;
  flowId?: string;
  flows?: Array<{ id: string; name: string }>;
  projectId?: string;
  environments: Environment[];
  dataSheets: DataSheet[];
  editingJob: ScenarioFlowJob | null;
  onSave: (data: any) => Promise<void>;
}

const CRON_PRESETS = [
  { label: 'Every 1 min', expr: '* * * * *', desc: 'Runs every minute' },
  { label: 'Every 5 mins', expr: '*/5 * * * *', desc: 'Runs every 5 minutes' },
  { label: 'Every 15 mins', expr: '*/15 * * * *', desc: 'Runs every 15 minutes' },
  { label: 'Every 1 hour', expr: '0 * * * *', desc: 'Runs at minute 0 every hour' },
  { label: 'Daily (00:00)', expr: '0 0 * * *', desc: 'Runs daily at midnight' },
  { label: 'Daily (08:00)', expr: '0 8 * * *', desc: 'Runs daily at 8:00 AM' },
  { label: 'Weekdays (09:00)', expr: '0 9 * * 1-5', desc: 'Monday to Friday at 9:00 AM' },
];

export const JobModal: React.FC<JobModalProps> = ({
  isOpen,
  onClose,
  flowId,
  flows = [],
  projectId,
  environments,
  dataSheets,
  editingJob,
  onSave,
}) => {
  const [selectedFlowId, setSelectedFlowId] = useState(flowId || '');
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [environmentId, setEnvironmentId] = useState<string>('');
  const [targetMode, setTargetMode] = useState<'LIVE' | 'MOCK'>('LIVE');
  const [scheduleType, setScheduleType] = useState<'CRON' | 'INTERVAL' | 'ONCE'>('CRON');
  const [cronExpression, setCronExpression] = useState('*/5 * * * *');
  const [intervalVal, setIntervalVal] = useState(300); // in seconds
  const [intervalUnit, setIntervalUnit] = useState<'seconds' | 'minutes' | 'hours'>('minutes');
  const [scheduledAt, setScheduledAt] = useState('');
  
  const [stopCondition, setStopCondition] = useState<'FOREVER' | 'MAX_ITERATIONS' | 'UNTIL_DATE' | 'DATASHEET_EXHAUSTED'>('FOREVER');
  const [maxIterations, setMaxIterations] = useState<number | ''>(10);
  const [endAt, setEndAt] = useState('');

  const [dataSourceType, setDataSourceType] = useState<'NONE' | 'STATIC' | 'DATASHEET'>('NONE');
  const [dataSheetId, setDataSheetId] = useState('');
  const [dataIterationMode, setDataIterationMode] = useState<'PER_TICK' | 'BATCH_ALL'>('PER_TICK');
  const [customVariablesJson, setCustomVariablesJson] = useState('{\n  \n}');
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [jsonError, setJsonError] = useState<string | null>(null);

  useEffect(() => {
    if (editingJob) {
      setSelectedFlowId(editingJob.flowId);
      setName(editingJob.name || '');
      setDescription(editingJob.description || '');
      setEnvironmentId(editingJob.environmentId || '');
      setTargetMode(editingJob.targetMode || 'LIVE');
      setScheduleType(editingJob.scheduleType || 'CRON');
      setCronExpression(editingJob.cronExpression || '*/5 * * * *');
      
      const sec = editingJob.intervalSeconds || 300;
      if (sec % 3600 === 0) {
        setIntervalVal(sec / 3600);
        setIntervalUnit('hours');
      } else if (sec % 60 === 0) {
        setIntervalVal(sec / 60);
        setIntervalUnit('minutes');
      } else {
        setIntervalVal(sec);
        setIntervalUnit('seconds');
      }

      setScheduledAt(
        editingJob.scheduledAt
          ? new Date(editingJob.scheduledAt).toISOString().slice(0, 16)
          : ''
      );
      setStopCondition(editingJob.stopCondition || 'FOREVER');
      setMaxIterations(editingJob.maxIterations ?? 10);
      setEndAt(
        editingJob.endAt
          ? new Date(editingJob.endAt).toISOString().slice(0, 16)
          : ''
      );
      setDataSourceType(editingJob.dataSourceType || 'NONE');
      setDataSheetId(editingJob.dataSheetId || '');
      setDataIterationMode(editingJob.dataIterationMode || 'PER_TICK');
      setCustomVariablesJson(
        editingJob.customVariables
          ? JSON.stringify(editingJob.customVariables, null, 2)
          : '{\n  \n}'
      );
    } else {
      setSelectedFlowId(flowId || flows[0]?.id || '');
      setName('');
      setDescription('');
      setEnvironmentId(environments[0]?.id || '');
      setTargetMode('LIVE');
      setScheduleType('CRON');
      setCronExpression('*/5 * * * *');
      setIntervalVal(5);
      setIntervalUnit('minutes');
      setScheduledAt('');
      setStopCondition('FOREVER');
      setMaxIterations(10);
      setEndAt('');
      setDataSourceType('NONE');
      setDataSheetId(dataSheets[0]?.id || '');
      setDataIterationMode('PER_TICK');
      setCustomVariablesJson('{\n  \n}');
    }
    setJsonError(null);
  }, [editingJob, isOpen, environments, dataSheets, flowId, flows]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFlowId) {
      alert('Please select a scenario flow');
      return;
    }
    if (!name.trim()) {
      alert('Please enter a job name');
      return;
    }

    let parsedCustomVariables: any = null;
    if (dataSourceType === 'STATIC' || customVariablesJson.trim() !== '{\n  \n}') {
      try {
        if (customVariablesJson.trim()) {
          parsedCustomVariables = JSON.parse(customVariablesJson);
        }
      } catch (err: any) {
        setJsonError('Invalid JSON format: ' + err.message);
        return;
      }
    }

    let calculatedIntervalSec = intervalVal;
    if (intervalUnit === 'minutes') calculatedIntervalSec = intervalVal * 60;
    if (intervalUnit === 'hours') calculatedIntervalSec = intervalVal * 3600;

    const payload = {
      flowId: selectedFlowId,
      projectId: projectId || null,
      name: name.trim(),
      description: description.trim() || null,
      environmentId: environmentId || null,
      targetMode,
      scheduleType,
      cronExpression: scheduleType === 'CRON' ? cronExpression.trim() : null,
      intervalSeconds: scheduleType === 'INTERVAL' ? Math.max(1, calculatedIntervalSec) : null,
      scheduledAt: scheduleType === 'ONCE' && scheduledAt ? new Date(scheduledAt).toISOString() : null,
      stopCondition,
      maxIterations: stopCondition === 'MAX_ITERATIONS' && maxIterations ? Number(maxIterations) : null,
      endAt: stopCondition === 'UNTIL_DATE' && endAt ? new Date(endAt).toISOString() : null,
      dataSourceType,
      dataSheetId: dataSourceType === 'DATASHEET' ? dataSheetId || null : null,
      dataIterationMode: dataSourceType === 'DATASHEET' ? dataIterationMode : 'PER_TICK',
      customVariables: parsedCustomVariables,
    };

    try {
      setIsSubmitting(true);
      await onSave(payload);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog.Root open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs z-50 animate-in fade-in duration-200" />
        <Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-7 shadow-2xl z-50 space-y-6 animate-in zoom-in-95 duration-200">
          
          {/* Header */}
          <div className="flex items-start justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-linear-to-tr from-purple-600 to-indigo-600 text-white flex items-center justify-center shadow-md shadow-purple-500/20">
                <Clock className="w-5 h-5" />
              </div>
              <div>
                <Dialog.Title className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                  {editingJob ? 'Edit Scheduled Job' : 'Create Job Schedule'}
                </Dialog.Title>
                <Dialog.Description className="text-xs text-slate-500 dark:text-slate-400">
                  Configure automated cron schedules, Data Sheet iteration, and stop conditions.
                </Dialog.Description>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            
            {/* 1. Basic Info */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {!flowId && flows.length > 0 && (
                <div className="sm:col-span-2 space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Target Scenario Flow <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={selectedFlowId}
                    onChange={(e) => setSelectedFlowId(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl text-xs bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 focus:border-purple-500 text-slate-900 dark:text-white outline-none cursor-pointer"
                  >
                    {flows.map((f) => (
                      <option key={f.id} value={f.id}>
                        {f.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}
              <div className="sm:col-span-2 space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Job Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Daily Payment Reconciliation, Bulk User Seed"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl text-xs bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 outline-none transition-all text-slate-900 dark:text-white placeholder:text-slate-400"
                />
              </div>

              <div className="sm:col-span-2 space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Description <span className="text-slate-400 font-normal">(Optional)</span>
                </label>
                <input
                  type="text"
                  placeholder="Purpose of this automated scheduled flow..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl text-xs bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 outline-none transition-all text-slate-900 dark:text-white placeholder:text-slate-400"
                />
              </div>

              {/* Target Environment */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Target Environment
                </label>
                <select
                  value={environmentId}
                  onChange={(e) => setEnvironmentId(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl text-xs bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 text-slate-900 dark:text-white outline-none cursor-pointer"
                >
                  <option value="">Default Flow Environment</option>
                  {environments.map((env) => (
                    <option key={env.id} value={env.id}>
                      {env.name} ({env.environmentType})
                    </option>
                  ))}
                </select>
              </div>

              {/* Target Mode */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Execution Mode
                </label>
                <div className="flex rounded-xl p-1 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                  <button
                    type="button"
                    onClick={() => setTargetMode('LIVE')}
                    className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                      targetMode === 'LIVE'
                        ? 'bg-purple-600 text-white shadow-xs'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    Live Request
                  </button>
                  <button
                    type="button"
                    onClick={() => setTargetMode('MOCK')}
                    className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                      targetMode === 'MOCK'
                        ? 'bg-purple-600 text-white shadow-xs'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    Mock Proxy
                  </button>
                </div>
              </div>
            </div>

            {/* 2. Schedule Type & Parameters */}
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/60 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                  <span className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                    Schedule Trigger
                  </span>
                </div>
                {/* Switch Schedule Type */}
                <div className="flex rounded-lg p-0.5 bg-slate-200/80 dark:bg-slate-700 text-[11px] font-medium">
                  {(['CRON', 'INTERVAL', 'ONCE'] as const).map((type) => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => setScheduleType(type)}
                      className={`px-2.5 py-1 rounded-md transition-all ${
                        scheduleType === type
                          ? 'bg-white dark:bg-slate-900 text-purple-600 dark:text-purple-400 font-bold shadow-2xs'
                          : 'text-slate-600 dark:text-slate-400'
                      }`}
                    >
                      {type}
                    </button>
                  ))}
                </div>
              </div>

              {/* CRON Option */}
              {scheduleType === 'CRON' && (
                <div className="space-y-3">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                      Cron Expression
                    </label>
                    <input
                      type="text"
                      value={cronExpression}
                      onChange={(e) => setCronExpression(e.target.value)}
                      placeholder="* * * * *"
                      className="w-full font-mono px-3.5 py-2 rounded-xl text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-purple-600 dark:text-purple-400 font-semibold focus:border-purple-500 outline-none"
                    />
                  </div>

                  {/* Preset Chips */}
                  <div className="space-y-1.5">
                    <span className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1">
                      <Sparkles className="w-3 h-3 text-purple-500" /> Quick Presets:
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {CRON_PRESETS.map((preset) => (
                        <button
                          key={preset.expr}
                          type="button"
                          onClick={() => setCronExpression(preset.expr)}
                          className={`px-2.5 py-1 rounded-lg text-[11px] font-medium border transition-all ${
                            cronExpression === preset.expr
                              ? 'bg-purple-600 text-white border-purple-600 shadow-xs'
                              : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-purple-400'
                          }`}
                          title={preset.desc}
                        >
                          {preset.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* INTERVAL Option */}
              {scheduleType === 'INTERVAL' && (
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Run Every
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min={1}
                      value={intervalVal}
                      onChange={(e) => setIntervalVal(Number(e.target.value))}
                      className="w-28 px-3.5 py-2 rounded-xl text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white outline-none"
                    />
                    <select
                      value={intervalUnit}
                      onChange={(e) => setIntervalUnit(e.target.value as any)}
                      className="px-3.5 py-2 rounded-xl text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white outline-none cursor-pointer"
                    >
                      <option value="seconds">Seconds</option>
                      <option value="minutes">Minutes</option>
                      <option value="hours">Hours</option>
                    </select>
                  </div>
                </div>
              )}

              {/* ONCE Option */}
              {scheduleType === 'ONCE' && (
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Run At (Date & Time)
                  </label>
                  <input
                    type="datetime-local"
                    value={scheduledAt}
                    onChange={(e) => setScheduledAt(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white outline-none"
                  />
                </div>
              )}
            </div>

            {/* 3. Data Source (DataSheet vs Static vs None) */}
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/60 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Database className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                  <span className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                    Data Source & Variables
                  </span>
                </div>
                <div className="flex rounded-lg p-0.5 bg-slate-200/80 dark:bg-slate-700 text-[11px] font-medium">
                  {(['NONE', 'DATASHEET', 'STATIC'] as const).map((source) => (
                    <button
                      key={source}
                      type="button"
                      onClick={() => setDataSourceType(source)}
                      className={`px-2.5 py-1 rounded-md transition-all ${
                        dataSourceType === source
                          ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 font-bold shadow-2xs'
                          : 'text-slate-600 dark:text-slate-400'
                      }`}
                    >
                      {source === 'NONE' ? 'Default' : source === 'DATASHEET' ? 'Data Sheet' : 'Custom JSON'}
                    </button>
                  ))}
                </div>
              </div>

              {/* DataSheet Picker */}
              {dataSourceType === 'DATASHEET' && (
                <div className="space-y-3 animate-in fade-in duration-150">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                        Select Data Sheet
                      </label>
                      <select
                        value={dataSheetId}
                        onChange={(e) => setDataSheetId(e.target.value)}
                        className="w-full px-3.5 py-2 rounded-xl text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white outline-none cursor-pointer"
                      >
                        <option value="">-- Choose Data Sheet --</option>
                        {dataSheets.map((ds) => (
                          <option key={ds.id} value={ds.id}>
                            {ds.name} ({ds.code})
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                        Iteration Mode
                      </label>
                      <select
                        value={dataIterationMode}
                        onChange={(e) => setDataIterationMode(e.target.value as any)}
                        className="w-full px-3.5 py-2 rounded-xl text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white outline-none cursor-pointer"
                      >
                        <option value="PER_TICK">1 Row per Scheduled Trigger (Sequential)</option>
                        <option value="BATCH_ALL">Run All Rows per Trigger (Batch)</option>
                      </select>
                    </div>
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    Row column values (e.g. <code className="text-purple-600 dark:text-purple-400">{'{{userId}}'}</code>, <code className="text-purple-600 dark:text-purple-400">{'{{amount}}'}</code>) will be automatically injected into flow steps.
                  </p>
                </div>
              )}

              {/* Static JSON Variables */}
              {dataSourceType === 'STATIC' && (
                <div className="space-y-1.5 animate-in fade-in duration-150">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center justify-between">
                    <span>Static JSON Variables</span>
                    <span className="text-[10px] text-slate-400 font-mono">JSON format</span>
                  </label>
                  <textarea
                    rows={4}
                    value={customVariablesJson}
                    onChange={(e) => {
                      setCustomVariablesJson(e.target.value);
                      setJsonError(null);
                    }}
                    className="w-full font-mono px-3.5 py-2.5 rounded-xl text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white outline-none focus:border-indigo-500"
                  />
                  {jsonError && (
                    <p className="text-[11px] text-red-500 flex items-center gap-1">
                      <AlertCircle className="w-3.5 h-3.5" /> {jsonError}
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* 4. Stop Condition */}
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/60 space-y-3">
              <div className="flex items-center gap-2">
                <Repeat className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <span className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                  Stop / Termination Condition
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Stop Condition
                  </label>
                  <select
                    value={stopCondition}
                    onChange={(e) => setStopCondition(e.target.value as any)}
                    className="w-full px-3.5 py-2 rounded-xl text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white outline-none cursor-pointer"
                  >
                    <option value="FOREVER">Continuous (Run forever until manual pause)</option>
                    <option value="MAX_ITERATIONS">Limit by Total Iteration Count</option>
                    <option value="UNTIL_DATE">Stop at Specific Date & Time</option>
                    {dataSourceType === 'DATASHEET' && (
                      <option value="DATASHEET_EXHAUSTED">Stop when Data Sheet Rows End</option>
                    )}
                  </select>
                </div>

                {stopCondition === 'MAX_ITERATIONS' && (
                  <div className="space-y-1.5 animate-in fade-in">
                    <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                      Max Iterations
                    </label>
                    <input
                      type="number"
                      min={1}
                      value={maxIterations}
                      onChange={(e) => setMaxIterations(e.target.value === '' ? '' : Number(e.target.value))}
                      placeholder="e.g. 50"
                      className="w-full px-3.5 py-2 rounded-xl text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white outline-none"
                    />
                  </div>
                )}

                {stopCondition === 'UNTIL_DATE' && (
                  <div className="space-y-1.5 animate-in fade-in">
                    <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                      End Date & Time
                    </label>
                    <input
                      type="datetime-local"
                      value={endAt}
                      onChange={(e) => setEndAt(e.target.value)}
                      className="w-full px-3.5 py-2 rounded-xl text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white outline-none"
                    />
                  </div>
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="inline-flex items-center gap-1.5 px-5 py-2 text-xs font-semibold text-white bg-linear-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 rounded-xl shadow-md shadow-purple-500/20 disabled:opacity-50 transition-all cursor-pointer"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>{editingJob ? 'Save Changes' : 'Create Job Schedule'}</span>
              </button>
            </div>
          </form>

        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
};
