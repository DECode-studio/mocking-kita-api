import React, { useState, useEffect } from 'react';
import {
  X,
  Server,
  FolderGit2,
  Plus,
  Trash2,
  Eye,
  EyeOff,
  KeyRound,
  Shield,
  Globe,
  Lock,
  User,
  Info,
  Layers,
  Sparkles,
  CheckCircle2,
} from 'lucide-react';
import {
  Environment,
  EnvironmentVariable,
  EnvironmentValuesMap,
  ALL_ENVIRONMENT_TYPES,
  normalizeEnvironmentValues,
  getEnvironmentBaseUrl,
} from '@/src/client/domain/environment/entity/environment';
import { Project } from '@/src/client/domain/project/entity/project';
import { EnvironmentType } from '@/src/core/utils/types';
import { StatusSwitch } from '@/src/client/presentation/components/shared/StatusSwitch';
import { EnvironmentFormData } from '../hook/useEnvironments';
import { ENVIRONMENTS_SEMANTIC_ID, ENVIRONMENTS_TEXT } from '../constant';
import { generateId } from '@/src/core/utils/uuid';

interface EnvironmentFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: EnvironmentFormData) => Promise<void>;
  editingEnvironment: Environment | null;
  projects: Project[];
  defaultProjectId?: string;
}

interface VariableDraftItem {
  id: string;
  key: string;
  value: string;
  type: 'plain' | 'secret';
  enabled: boolean;
  description?: string;
  showValue?: boolean;
}

const STAGE_CONFIG: Record<
  EnvironmentType,
  { label: string; badgeColor: string; placeholder: string; helper: string }
> = {
  LOCAL: {
    label: 'LOCAL',
    badgeColor: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800',
    placeholder: 'Otomatis dihandle Mock Engine (http://localhost:PORT)',
    helper: 'Dikelola otomatis oleh internal mock engine',
  },
  DEVELOPMENT: {
    label: 'DEVELOPMENT',
    badgeColor: 'bg-blue-50 text-blue-700 dark:bg-blue-950/50 dark:text-blue-400 border-blue-200 dark:border-blue-800',
    placeholder: 'https://dev-api.example.com',
    helper: 'Endpoint untuk pengembangan & dev integration',
  },
  TESTING: {
    label: 'TESTING',
    badgeColor: 'bg-amber-50 text-amber-700 dark:bg-amber-950/50 dark:text-amber-400 border-amber-200 dark:border-amber-800',
    placeholder: 'https://test-api.example.com',
    helper: 'Endpoint untuk QA / automated test server',
  },
  STAGING: {
    label: 'STAGING',
    badgeColor: 'bg-purple-50 text-purple-700 dark:bg-purple-950/50 dark:text-purple-400 border-purple-200 dark:border-purple-800',
    placeholder: 'https://staging-api.example.com',
    helper: 'Endpoint pre-production mirip production',
  },
  PRODUCTION: {
    label: 'PRODUCTION',
    badgeColor: 'bg-rose-50 text-rose-700 dark:bg-rose-950/50 dark:text-rose-400 border-rose-200 dark:border-rose-800',
    placeholder: 'https://api.example.com',
    helper: 'Live production API endpoint',
  },
};

export const EnvironmentFormModal: React.FC<EnvironmentFormModalProps> = ({
  isOpen,
  onClose,
  onSave,
  editingEnvironment,
  projects,
  defaultProjectId,
}) => {
  const [name, setName] = useState('');
  const [projectId, setProjectId] = useState('');
  const [isBaseUrl, setIsBaseUrl] = useState(true);
  const [stageValues, setStageValues] = useState<EnvironmentValuesMap>({
    LOCAL: null,
    DEVELOPMENT: '',
    TESTING: '',
    STAGING: '',
    PRODUCTION: '',
  });
  const [status, setStatus] = useState(true);
  const [variables, setVariables] = useState<VariableDraftItem[]>([]);
  const [showVariablesSection, setShowVariablesSection] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (editingEnvironment) {
      setName(editingEnvironment.name);
      setProjectId(editingEnvironment.projectId);
      const isBase = editingEnvironment.isBaseUrl !== false;
      setIsBaseUrl(isBase);
      setStatus(editingEnvironment.status);

      // Populate stage values
      const initialValues: EnvironmentValuesMap = {
        LOCAL: null,
        DEVELOPMENT: '',
        TESTING: '',
        STAGING: '',
        PRODUCTION: '',
      };

      if (editingEnvironment.values && Object.keys(editingEnvironment.values).length > 0) {
        for (const stage of ALL_ENVIRONMENT_TYPES) {
          const val = editingEnvironment.values[stage];
          if (val !== undefined && val !== null) {
            initialValues[stage] = String(val);
          }
        }
      } else {
        // Fallback for legacy environment records with single baseUrl + environmentType
        const legacyBaseUrl = getEnvironmentBaseUrl(editingEnvironment);
        if (legacyBaseUrl && editingEnvironment.environmentType) {
          initialValues[editingEnvironment.environmentType] = legacyBaseUrl;
        }
      }

      if (isBase) {
        initialValues.LOCAL = null;
      }
      setStageValues(initialValues);

      // Custom variables
      let initialVars: VariableDraftItem[] = [];
      if (Array.isArray(editingEnvironment.variables) && editingEnvironment.variables.length > 0) {
        initialVars = editingEnvironment.variables
          .filter((v) => v.key.toLowerCase() !== 'baseurl' && v.key.toLowerCase() !== 'base_url')
          .map((v) => ({
            id: v.id || generateId(),
            key: v.key || '',
            value: v.value || '',
            type: v.type || 'plain',
            enabled: v.enabled !== false,
            description: v.description || '',
            showValue: false,
          }));
      }
      setVariables(initialVars);
      if (initialVars.length > 0) {
        setShowVariablesSection(true);
      }
    } else {
      setName('');
      setProjectId(defaultProjectId || (projects.length > 0 ? projects[0].id : ''));
      setIsBaseUrl(true);
      setStageValues({
        LOCAL: null,
        DEVELOPMENT: '',
        TESTING: '',
        STAGING: '',
        PRODUCTION: '',
      });
      setStatus(true);
      setVariables([]);
      setShowVariablesSection(false);
    }
  }, [editingEnvironment, projects, defaultProjectId, isOpen]);

  if (!isOpen) return null;

  const handleStageValueChange = (stage: EnvironmentType, val: string) => {
    setStageValues((prev) => ({
      ...prev,
      [stage]: val,
    }));
  };

  const handleToggleIsBaseUrl = (val: boolean) => {
    setIsBaseUrl(val);
    setStageValues((prev) => {
      if (val) {
        return { ...prev, LOCAL: null };
      }
      return { ...prev, LOCAL: prev.LOCAL || '' };
    });
  };

  const handleAddVariable = (
    key = '',
    value = '',
    type: 'plain' | 'secret' = 'plain',
    description = ''
  ) => {
    setVariables((prev) => [
      ...prev,
      {
        id: generateId(),
        key,
        value,
        type,
        enabled: true,
        description,
        showValue: type === 'plain',
      },
    ]);
    setShowVariablesSection(true);
  };

  const handleUpdateVariable = (id: string, updates: Partial<VariableDraftItem>) => {
    setVariables((prev) =>
      prev.map((item) => (item.id === id ? { ...item, ...updates } : item))
    );
  };

  const handleRemoveVariable = (id: string) => {
    setVariables((prev) => prev.filter((item) => item.id !== id));
  };

  const handleToggleShowValue = (id: string) => {
    setVariables((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, showValue: !item.showValue } : item
      )
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !projectId) return;

    // Filter out rows where key is completely empty
    const cleanVariables: EnvironmentVariable[] = variables
      .filter((v) => v.key.trim().length > 0)
      .map((v) => ({
        id: v.id,
        key: v.key.trim(),
        value: v.value,
        type: v.type,
        enabled: v.enabled,
        description: v.description?.trim() || undefined,
      }));

    // Normalize matrix values using domain helper
    const normalizedMatrix = normalizeEnvironmentValues(stageValues, isBaseUrl);

    // Provide legacy fallbacks for maximum safety
    const firstFilledStage =
      ALL_ENVIRONMENT_TYPES.find((s) => s !== 'LOCAL' && normalizedMatrix[s]) || 'DEVELOPMENT';
    const legacyBaseUrl = normalizedMatrix[firstFilledStage] || '';

    setIsSubmitting(true);
    try {
      await onSave({
        name: name.trim(),
        projectId,
        isBaseUrl,
        values: normalizedMatrix,
        environmentType: firstFilledStage,
        variables: cleanVariables,
        baseUrl: legacyBaseUrl,
        status,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs overflow-y-auto">
      <div
        id={ENVIRONMENTS_SEMANTIC_ID.FORM_MODAL}
        className="relative w-full max-w-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl overflow-hidden my-8"
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-900">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-indigo-50 dark:bg-indigo-950/50 rounded-lg text-indigo-600 dark:text-indigo-400">
              <Server className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
                {editingEnvironment ? ENVIRONMENTS_TEXT.EDIT_BUTTON : ENVIRONMENTS_TEXT.CREATE_BUTTON}
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Multi-environment matrix configuration (Local, Dev, Test, Staging, Prod)
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Top Fields: Name, Project & Status */}
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-4">
            {/* Name */}
            <div className="sm:col-span-6">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                {ENVIRONMENTS_TEXT.FORM.NAME_LABEL} <span className="text-rose-500">*</span>
              </label>
              <input
                id={ENVIRONMENTS_SEMANTIC_ID.FORM_NAME_INPUT}
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Platform AUTH, KPM Gateway, Payment API"
                className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500"
              />
            </div>

            {/* Project Select */}
            <div className="sm:col-span-4">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                {ENVIRONMENTS_TEXT.FORM.PROJECT_LABEL} <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <FolderGit2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <select
                  id={ENVIRONMENTS_SEMANTIC_ID.FORM_PROJECT_SELECT}
                  required
                  value={projectId}
                  onChange={(e) => setProjectId(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-sm bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-slate-900 dark:text-slate-100 cursor-pointer"
                >
                  <option value="" disabled>
                    {ENVIRONMENTS_TEXT.FORM.SELECT_PROJECT}
                  </option>
                  {projects.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Status Switch */}
            <div className="sm:col-span-2 flex flex-col justify-end">
              <div className="flex items-center justify-between px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg h-9.5">
                <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Active
                </span>
                <StatusSwitch checked={status} onCheckedChange={setStatus} />
              </div>
            </div>
          </div>

          {/* Environment Classification: Base URL Service vs Config Variables */}
          <div className="p-3 bg-slate-50/80 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800/80 rounded-xl space-y-2">
            <div className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
              <Layers className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
              <span>Klasifikasi Environment</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => handleToggleIsBaseUrl(true)}
                className={`p-3 text-left rounded-lg border transition-all cursor-pointer flex items-start gap-2.5 ${
                  isBaseUrl
                    ? 'bg-white dark:bg-slate-900 border-indigo-600 dark:border-indigo-500 shadow-xs ring-2 ring-indigo-500/20 text-slate-900 dark:text-slate-100'
                    : 'bg-white/70 dark:bg-slate-900/40 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 text-slate-700 dark:text-slate-300'
                }`}
              >
                <div className={`p-1.5 rounded-md shrink-0 ${isBaseUrl ? 'bg-indigo-600 text-white' : 'bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400'}`}>
                  <Globe className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1">
                    <span>Base URL Service Endpoint</span>
                    {isBaseUrl && <CheckCircle2 className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />}
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 leading-snug">
                    Base URL untuk routing API ke server target (Dev, Testing, Staging, Prod). LOCAL dikelola otomatis oleh Mock API Studio.
                  </p>
                </div>
              </button>

              <button
                type="button"
                onClick={() => handleToggleIsBaseUrl(false)}
                className={`p-3 text-left rounded-lg border transition-all cursor-pointer flex items-start gap-2.5 ${
                  !isBaseUrl
                    ? 'bg-white dark:bg-slate-900 border-amber-600 dark:border-amber-500 shadow-xs ring-2 ring-amber-500/20 text-slate-900 dark:text-slate-100'
                    : 'bg-white/70 dark:bg-slate-900/40 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 text-slate-700 dark:text-slate-300'
                }`}
              >
                <div className={`p-1.5 rounded-md shrink-0 ${!isBaseUrl ? 'bg-amber-600 text-white' : 'bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400'}`}>
                  <KeyRound className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1">
                    <span>General Variables & Config</span>
                    {!isBaseUrl && <CheckCircle2 className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />}
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 leading-snug">
                    Variabel konfigurasi, secret key, atau token per stage (semua 5 stage termasuk LOCAL dapat diisi).
                  </p>
                </div>
              </button>
            </div>
          </div>

          {/* Section: Matrix Values Per Environment Stage */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <label className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                  <Globe className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                  <span>Nilai Multi-Environment Matrix (5 Stages)</span>
                </label>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  {isBaseUrl
                    ? 'Tentukan target Base URL server untuk setiap stage testing dan deployment.'
                    : 'Tentukan nilai variabel/konfigurasi untuk setiap stage.'}
                </p>
              </div>
            </div>

            <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden divide-y divide-slate-100 dark:divide-slate-800 bg-white dark:bg-slate-900/60">
              {ALL_ENVIRONMENT_TYPES.map((stage) => {
                const config = STAGE_CONFIG[stage];
                const isLocalBase = isBaseUrl && stage === 'LOCAL';

                return (
                  <div
                    key={stage}
                    className={`p-3 transition-colors ${
                      isLocalBase
                        ? 'bg-slate-50/70 dark:bg-slate-950/50'
                        : 'hover:bg-slate-50/40 dark:hover:bg-slate-850/40'
                    }`}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center gap-2 justify-between">
                      <div className="flex items-center gap-2 w-44 shrink-0">
                        <span
                          className={`px-2 py-0.5 text-[10px] font-bold font-mono rounded-md border ${config.badgeColor}`}
                        >
                          {config.label}
                        </span>
                        {isLocalBase && (
                          <span className="text-[10px] font-semibold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/50 px-1.5 py-0.5 rounded border border-emerald-200 dark:border-emerald-800">
                            Auto Mock
                          </span>
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        {isLocalBase ? (
                          <div className="relative">
                            <input
                              type="text"
                              disabled
                              value=""
                              placeholder="Dikelola otomatis oleh Mock API Studio lokal (http://localhost:PORT)"
                              className="w-full px-3 py-1.5 text-xs font-mono bg-slate-100 dark:bg-slate-950/80 border border-dashed border-slate-300 dark:border-slate-800 rounded-lg text-slate-500 dark:text-slate-400 placeholder:text-slate-400 dark:placeholder:text-slate-600 cursor-not-allowed select-none"
                            />
                            <div className="absolute right-2.5 top-1/2 -translate-y-1/2 flex items-center gap-1 text-[11px]">
                              <Sparkles className="w-3.5 h-3.5 text-emerald-500" />
                              <span className="text-[10px] hidden sm:inline text-emerald-600 dark:text-emerald-400 font-medium">Internal Proxy</span>
                            </div>
                          </div>
                        ) : (
                          <div className="relative">
                            <input
                              type="text"
                              value={stageValues[stage] ?? ''}
                              onChange={(e) => handleStageValueChange(stage, e.target.value)}
                              placeholder={config.placeholder}
                              className="w-full px-3 py-1.5 text-xs font-mono bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-600"
                            />
                            {stageValues[stage] && (
                              <button
                                type="button"
                                onClick={() => handleStageValueChange(stage, '')}
                                className="absolute right-2 top-1/2 -translate-y-1/2 p-0.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 rounded cursor-pointer"
                                title="Clear"
                              >
                                <X className="w-3 h-3" />
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {isBaseUrl && (
              <div className="flex items-start gap-2 p-2.5 bg-blue-50/70 dark:bg-blue-950/30 border border-blue-200/70 dark:border-blue-900/50 rounded-lg text-xs text-blue-800 dark:text-blue-300">
                <Info className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
                <p className="text-[11px] leading-relaxed">
                  <strong>Pola Desain Base URL:</strong> Panggilan skenario flow pada stage <code>LOCAL</code> selalu diarahkan langsung ke internal Mock Engine Mock API Studio. Jika skenario dijalankan pada stage <code>DEVELOPMENT</code>, <code>STAGING</code>, atau <code>PRODUCTION</code>, runner otomatis mengambil base URL yang diisi di atas.
                </p>
              </div>
            )}
          </div>

          {/* Section: Additional Custom Variables (Optional) */}
          <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
            <div className="flex items-center justify-between mb-2">
              <button
                type="button"
                onClick={() => setShowVariablesSection(!showVariablesSection)}
                className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5 hover:text-indigo-600 dark:hover:text-indigo-400 cursor-pointer"
              >
                <KeyRound className="w-3.5 h-3.5 text-indigo-500" />
                <span>Custom Variables & Secrets (Opsional: {variables.length})</span>
                <span className="text-[10px] text-slate-400 font-normal">
                  {showVariablesSection ? '(Klik untuk sembunyikan)' : '(Klik untuk tampilkan)'}
                </span>
              </button>

              {showVariablesSection && (
                <div className="flex items-center flex-wrap gap-1.5">
                  <button
                    type="button"
                    onClick={() => handleAddVariable('apiKey', '', 'secret', 'API key credential')}
                    className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-medium text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 hover:bg-amber-100 rounded border border-amber-200 dark:border-amber-800 cursor-pointer"
                  >
                    <KeyRound className="w-2.5 h-2.5" />
                    <span>+ API Key</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleAddVariable('bearerToken', '', 'secret', 'Bearer token')}
                    className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-medium text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 hover:bg-emerald-100 rounded border border-emerald-200 dark:border-emerald-800 cursor-pointer"
                  >
                    <Shield className="w-2.5 h-2.5" />
                    <span>+ Bearer</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      handleAddVariable('username', '', 'plain', 'Auth username');
                      handleAddVariable('password', '', 'secret', 'Auth password');
                    }}
                    className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-medium text-purple-700 dark:text-purple-400 bg-purple-50 dark:bg-purple-950/40 hover:bg-purple-100 rounded border border-purple-200 dark:border-purple-800 cursor-pointer"
                  >
                    <User className="w-2.5 h-2.5" />
                    <span>+ Basic Auth</span>
                  </button>
                </div>
              )}
            </div>

            {showVariablesSection && (
              <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden bg-slate-50/40 dark:bg-slate-950/40">
                <div className="grid grid-cols-12 gap-2 px-3 py-1.5 bg-slate-100/80 dark:bg-slate-800/80 text-[11px] font-bold text-slate-700 dark:text-slate-300 border-b border-slate-200 dark:border-slate-700">
                  <div className="col-span-1 text-center">Use</div>
                  <div className="col-span-4">Variable Key</div>
                  <div className="col-span-5">Value</div>
                  <div className="col-span-2 text-right pr-2">Action</div>
                </div>

                <div className="max-h-48 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800">
                  {variables.length === 0 ? (
                    <div className="py-5 text-center text-xs text-slate-500 dark:text-slate-400">
                      <p>Belum ada variabel kustom tambahan.</p>
                    </div>
                  ) : (
                    variables.map((item) => (
                      <div
                        key={item.id}
                        className={`grid grid-cols-12 gap-2 items-center px-3 py-1.5 text-xs transition-colors ${
                          item.enabled ? 'bg-white dark:bg-slate-900/60' : 'bg-slate-50/70 dark:bg-slate-950/50 opacity-60'
                        }`}
                      >
                        <div className="col-span-1 flex justify-center">
                          <input
                            type="checkbox"
                            checked={item.enabled}
                            onChange={(e) => handleUpdateVariable(item.id, { enabled: e.target.checked })}
                            className="w-3.5 h-3.5 rounded text-indigo-600 focus:ring-indigo-500 border-slate-300 dark:border-slate-600 cursor-pointer"
                          />
                        </div>

                        <div className="col-span-4">
                          <input
                            type="text"
                            value={item.key}
                            onChange={(e) => handleUpdateVariable(item.id, { key: e.target.value })}
                            placeholder="e.g. clientSecret, appId"
                            className="w-full px-2 py-1 font-mono text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded focus:outline-hidden focus:ring-1 focus:ring-indigo-500 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-600"
                          />
                        </div>

                        <div className="col-span-5 relative flex items-center">
                          <input
                            type={item.type === 'secret' && !item.showValue ? 'password' : 'text'}
                            value={item.value}
                            onChange={(e) => handleUpdateVariable(item.id, { value: e.target.value })}
                            placeholder="Value..."
                            className="w-full pl-2 pr-14 py-1 font-mono text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded focus:outline-hidden focus:ring-1 focus:ring-indigo-500 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-600"
                          />
                          <div className="absolute right-1 flex items-center gap-0.5">
                            {item.type === 'secret' && (
                              <button
                                type="button"
                                onClick={() => handleToggleShowValue(item.id)}
                                className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                                title={item.showValue ? 'Hide value' : 'Show value'}
                              >
                                {item.showValue ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={() =>
                                handleUpdateVariable(item.id, {
                                  type: item.type === 'secret' ? 'plain' : 'secret',
                                  showValue: item.type === 'secret',
                                })
                              }
                              className={`p-1 rounded text-[10px] cursor-pointer ${
                                item.type === 'secret'
                                  ? 'text-amber-600 dark:text-amber-400 font-bold'
                                  : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'
                              }`}
                              title={item.type === 'secret' ? 'Masked Secret' : 'Plain Text'}
                            >
                              {item.type === 'secret' ? <Lock className="w-3 h-3" /> : <span className="text-[10px]">T</span>}
                            </button>
                          </div>
                        </div>

                        <div className="col-span-2 flex items-center justify-end pr-1">
                          <button
                            type="button"
                            onClick={() => handleRemoveVariable(item.id)}
                            className="p-1 text-slate-400 hover:text-rose-500 rounded transition-colors cursor-pointer"
                            title="Remove variable"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                <div className="p-2 bg-slate-50 dark:bg-slate-900/80 border-t border-slate-200 dark:border-slate-800 flex justify-between items-center">
                  <button
                    type="button"
                    onClick={() => handleAddVariable()}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 bg-white dark:bg-slate-800 border border-indigo-200 dark:border-indigo-800 rounded-lg shadow-2xs hover:bg-indigo-50 dark:hover:bg-indigo-950/40 transition-colors cursor-pointer"
                  >
                    <Plus className="w-3 h-3" />
                    <span>{ENVIRONMENTS_TEXT.FORM.ADD_VARIABLE}</span>
                  </button>
                  <span className="text-[10px] text-slate-500 dark:text-slate-400">
                    {variables.length} variabel
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/40 dark:bg-slate-900/90 -mx-6 -mb-6 px-6 py-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
            >
              {ENVIRONMENTS_TEXT.FORM.CANCEL}
            </button>
            <button
              id={ENVIRONMENTS_SEMANTIC_ID.FORM_SUBMIT_BTN}
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600 rounded-lg shadow-sm transition-colors cursor-pointer disabled:opacity-50"
            >
              {isSubmitting ? 'Saving...' : ENVIRONMENTS_TEXT.FORM.SAVE}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
