'use client';

import React from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { X } from 'lucide-react';
import { UseFormReturn } from 'react-hook-form';
import { Environment } from '@/src/domain/environment/entity/environment';
import { ENVIRONMENTS_TEXT, ENVIRONMENTS_SEMANTIC_ID } from '../constant';

/* eslint-disable @typescript-eslint/no-explicit-any */
interface EnvironmentFormModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  editingEnv: Environment | null;
  form: UseFormReturn<any>;
  onSubmit: (data: any) => void;
}

export const EnvironmentFormModal: React.FC<EnvironmentFormModalProps> = ({
  isOpen,
  onOpenChange,
  editingEnv,
  form,
  onSubmit,
}) => {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = form;

  return (
    <Dialog.Root open={isOpen} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs z-50" />
        <Dialog.Content id={ENVIRONMENTS_SEMANTIC_ID.FORM_MODAL} className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-2xl z-50 space-y-4 focus:outline-none">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
            <Dialog.Title className="text-base font-semibold text-slate-900 dark:text-slate-100">
              {editingEnv ? ENVIRONMENTS_TEXT.MODAL_EDIT_TITLE : ENVIRONMENTS_TEXT.MODAL_ADD_TITLE}
            </Dialog.Title>
            <button
              type="button"
              onClick={() => onOpenChange(false)}
              className="text-slate-400 hover:text-slate-600"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                {ENVIRONMENTS_TEXT.LABEL_ENV_NAME}
              </label>
              <input
                id={ENVIRONMENTS_SEMANTIC_ID.FORM_INPUT_NAME}
                type="text"
                {...register('name')}
                placeholder={ENVIRONMENTS_TEXT.PLACEHOLDER_NAME}
                className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-900 dark:text-slate-100 focus:outline-none focus:border-indigo-500"
              />
              {errors.name && <p className="text-[11px] text-rose-500 mt-1">{String(errors.name.message)}</p>}
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                {ENVIRONMENTS_TEXT.LABEL_PUBLIC_URL}
              </label>
              <input
                id={ENVIRONMENTS_SEMANTIC_ID.FORM_INPUT_PUBLIC_URL}
                type="text"
                {...register('publicBaseUrl')}
                placeholder={ENVIRONMENTS_TEXT.PLACEHOLDER_PUBLIC_URL}
                className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-900 dark:text-slate-100 focus:outline-none focus:border-indigo-500 font-mono"
              />
              {errors.publicBaseUrl && (
                <p className="text-[11px] text-rose-500 mt-1">{String(errors.publicBaseUrl.message)}</p>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                {ENVIRONMENTS_TEXT.LABEL_ORIGIN_URL}
              </label>
              <input
                id={ENVIRONMENTS_SEMANTIC_ID.FORM_INPUT_ORIGIN_URL}
                type="text"
                {...register('originBaseUrl')}
                placeholder={ENVIRONMENTS_TEXT.PLACEHOLDER_ORIGIN_URL}
                className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-900 dark:text-slate-100 focus:outline-none focus:border-indigo-500 font-mono"
              />
            </div>

            <div className="flex items-center justify-between pt-2">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">{ENVIRONMENTS_TEXT.LABEL_ACTIVE_STATUS}</label>
              <input
                id={ENVIRONMENTS_SEMANTIC_ID.FORM_CHECKBOX_STATUS}
                type="checkbox"
                {...register('status')}
                className="w-4 h-4 text-indigo-600 rounded border-slate-300 dark:border-slate-700"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
              <button
                id={ENVIRONMENTS_SEMANTIC_ID.FORM_BTN_CANCEL}
                type="button"
                onClick={() => onOpenChange(false)}
                className="px-3.5 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 rounded-md"
              >
                {ENVIRONMENTS_TEXT.BTN_CANCEL}
              </button>
              <button
                id={ENVIRONMENTS_SEMANTIC_ID.FORM_BTN_SUBMIT}
                type="submit"
                disabled={isSubmitting}
                className="px-4 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded-md shadow-xs transition-colors"
              >
                {editingEnv ? ENVIRONMENTS_TEXT.BTN_SAVE : ENVIRONMENTS_TEXT.BTN_CREATE}
              </button>
            </div>
          </form>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
};
