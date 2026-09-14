'use client';


import React from 'react';
import { Plus, Trash2, Route, Info } from 'lucide-react';
import { BodyPathRule, ParamMatchOperator } from '@/src/core/utils/types';
import { extractAllJsonPaths } from '@/src/core/utils/param-matcher';
import { StatusSwitch } from '@/src/client/presentation/components/shared/StatusSwitch';
import { PathAutocompleteInput } from './PathAutocompleteInput';

interface BodyPathRulesEditorProps {
  rules: BodyPathRule[];
  onChange: (newRules: BodyPathRule[]) => void;
  bodyContent: unknown;
  strictBodyStructure?: boolean;
  onStrictBodyStructureChange?: (strict: boolean) => void;
  idPrefix?: string;
}

export const BodyPathRulesEditor: React.FC<BodyPathRulesEditorProps> = ({
  rules,
  onChange,
  bodyContent,
  strictBodyStructure = true,
  onStrictBodyStructureChange,
  idPrefix = 'body-path-rules',
}) => {
  const suggestions = React.useMemo(() => {
    return extractAllJsonPaths(bodyContent);
  }, [bodyContent]);

  const updateRule = (index: number, updatedFields: Partial<BodyPathRule>) => {
    const updated = [...rules];
    updated[index] = { ...updated[index], ...updatedFields };
    onChange(updated);
  };

  const addRule = () => {
    const firstSuggested = suggestions[0]?.path || '';
    const newRule: BodyPathRule = {
      path: firstSuggested,
      operator: 'equal',
      value: '',
      enabled: true,
    };
    onChange([...rules, newRule]);
  };

  const deleteRule = (index: number) => {
    const updated = rules.filter((_, i) => i !== index);
    onChange(updated);
  };

  return (
    <div className="space-y-2 border border-slate-200 dark:border-slate-800 rounded-xl p-3.5 bg-slate-50/70 dark:bg-slate-950/40">
      <div className="flex items-center justify-between pb-1.5 border-b border-slate-200/70 dark:border-slate-800/70">
        <div className="flex items-center gap-2">
          <Route className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
          <label className="font-semibold text-xs text-slate-800 dark:text-slate-200">
            Body Path Rules (Dot-Notation Matcher)
          </label>
          <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20">
            {rules.length} rule{rules.length === 1 ? '' : 's'}
          </span>
        </div>
        <button
          id={`${idPrefix}-add-btn`}
          type="button"
          onClick={addRule}
          className="inline-flex items-center gap-1 text-[11px] font-medium text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5" /> Add Path Rule
        </button>
      </div>

      <p className="text-[11px] text-slate-500 flex items-start gap-1">
        <Info className="w-3.5 h-3.5 shrink-0 mt-0.5 text-slate-400" />
        <span>
          Cek nilai spesifik dari JSON body via path dot-notation (contoh: <code className="font-mono text-indigo-600 dark:text-indigo-400 bg-indigo-500/10 px-1 py-0.5 rounded">debitur.0.id_number</code> atau <code className="font-mono text-indigo-600 dark:text-indigo-400 bg-indigo-500/10 px-1 py-0.5 rounded">transaction_id</code>). Path otomatis disarankan dari Request Body.
        </span>
      </p>

      {rules.length === 0 ? (
        <div className="text-center py-3 text-xs text-slate-400 italic bg-white dark:bg-slate-900 rounded-lg border border-dashed border-slate-200 dark:border-slate-800">
          Belum ada path rule. Klik &quot;Add Path Rule&quot; untuk menambahkan aturan pencocokan spesifik field.
        </div>
      ) : (
        <div className="space-y-2">
          {rules.map((rule, index) => {
            const isValDisabled = rule.operator === 'null' || rule.operator === 'empty_array';
            return (
              <div
                key={index}
                className={`flex items-center gap-2 p-1.5 rounded-lg border transition-colors ${
                  rule.enabled
                    ? 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800'
                    : 'bg-slate-100/60 dark:bg-slate-950/60 border-slate-200/50 dark:border-slate-800/50 opacity-60'
                }`}
              >
                <div className="shrink-0">
                  <StatusSwitch
                    checked={rule.enabled}
                    onCheckedChange={(checked) => updateRule(index, { enabled: checked })}
                    size="sm"
                  />
                </div>

                {/* Path input with auto-complete from body */}
                <div className="w-2/5 min-w-32.5">
                  <PathAutocompleteInput
                    id={`${idPrefix}-row-${index}-path`}
                    value={rule.path}
                    onChange={(newPath) => updateRule(index, { path: newPath })}
                    suggestions={suggestions}
                    placeholder="Path (e.g. debitur.0.id_number)"
                    disabled={!rule.enabled}
                  />
                </div>

                {/* Operator selector */}
                <select
                  id={`${idPrefix}-row-${index}-operator`}
                  value={rule.operator === ('regex_i' as any) ? 'regex' : rule.operator}
                  disabled={!rule.enabled}
                  onChange={(e) => updateRule(index, { operator: e.target.value as ParamMatchOperator })}
                  className="px-1.5 py-1 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-md text-[11px] font-mono font-medium text-slate-700 dark:text-slate-300 focus:outline-none cursor-pointer shrink-0"
                >
                  <option value="equal">= equal</option>
                  <option value="regex">.* regex</option>
                  <option value="null">∅ null</option>
                  <option value="empty_array">[] empty_array</option>
                </select>

                {/* Expected value input */}
                <input
                  id={`${idPrefix}-row-${index}-value`}
                  type="text"
                  value={isValDisabled ? `(${rule.operator})` : String(rule.value ?? '')}
                  disabled={!rule.enabled || isValDisabled}
                  onChange={(e) => updateRule(index, { value: e.target.value })}
                  placeholder={isValDisabled ? `(${rule.operator})` : 'Expected value'}
                  className={`flex-1 px-2 py-1 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-md text-slate-900 dark:text-slate-100 focus:outline-none text-xs font-mono ${
                    isValDisabled ? 'opacity-40 italic cursor-not-allowed' : ''
                  }`}
                />

                <button
                  type="button"
                  onClick={() => deleteRule(index)}
                  className="p-1 text-slate-400 hover:text-red-500 transition-colors cursor-pointer shrink-0"
                  title="Remove Path Rule"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            );
          })}
        </div>
      )}

      {rules.length > 0 && onStrictBodyStructureChange && (
        <div className="pt-2.5 mt-2 border-t border-slate-200/70 dark:border-slate-800/70 flex items-center justify-between">
          <div className="space-y-0.5 pr-3">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                Strict Body Structure
              </span>
              <span
                className={`px-1.5 py-0.5 rounded text-[10px] font-mono font-bold ${
                  strictBodyStructure !== false
                    ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                    : 'bg-slate-500/10 text-slate-500 dark:text-slate-400 border border-slate-500/20'
                }`}
              >
                {strictBodyStructure !== false ? 'Strict (Structure Checked)' : 'Flexible (Only Rules Checked)'}
              </span>
            </div>
            <p className="text-[11px] text-slate-500">
              {strictBodyStructure !== false
                ? 'Aktif: Struktur JSON body harus sama persis dengan template (nilai selain rules bebas).'
                : 'Non-aktif: Struktur JSON body bebas (tidak harus sama), asalkan aturan Body Path Rules terpenuhi.'}
            </p>
          </div>
          <div className="shrink-0">
            <StatusSwitch
              id={`${idPrefix}-strict-structure-switch`}
              checked={strictBodyStructure !== false}
              onCheckedChange={(checked) => onStrictBodyStructureChange(checked)}
              size="md"
            />
          </div>
        </div>
      )}
    </div>
  );
};
