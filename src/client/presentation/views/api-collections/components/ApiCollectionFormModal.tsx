'use client';


import React from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { X } from 'lucide-react';
import { UseFormReturn } from 'react-hook-form';
import { ApiCollection } from '@/src/client/domain/api/entity/api_collection';
import { Collection } from '@/src/client/domain/collection/entity/collection';
import { Account } from '@/src/client/domain/account/entity/account';
import { API_COLLECTIONS_TEXT, API_COLLECTIONS_SEMANTIC_ID } from '../constant';
import { PicSelectField } from '@/src/client/presentation/components/shared/PicSelectField';

/* eslint-disable @typescript-eslint/no-explicit-any */
interface ApiCollectionFormModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  editingApi: ApiCollection | null;
  form: UseFormReturn<any>;
  onSubmit: (data: any) => void;
  collections: Collection[];
  accounts?: Account[];
}

export const ApiCollectionFormModal: React.FC<ApiCollectionFormModalProps> = ({
  isOpen,
  onOpenChange,
  editingApi,
  form,
  onSubmit,
  collections,
  accounts = [],
}) => {
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = form;

  const selectedPicIds = watch('picIds') || [];

  return (
    <Dialog.Root open={isOpen} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs z-50" />
        <Dialog.Content id={API_COLLECTIONS_SEMANTIC_ID.FORM_MODAL} className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-2xl z-50 space-y-4 focus:outline-none">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
            <Dialog.Title className="text-base font-semibold text-slate-900 dark:text-slate-100">
              {editingApi ? API_COLLECTIONS_TEXT.MODAL_EDIT_TITLE : API_COLLECTIONS_TEXT.MODAL_ADD_TITLE}
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
                {API_COLLECTIONS_TEXT.LABEL_NAME}
              </label>
              <input
                id={API_COLLECTIONS_SEMANTIC_ID.FORM_INPUT_NAME}
                type="text"
                {...register('name')}
                placeholder={API_COLLECTIONS_TEXT.PLACEHOLDER_NAME}
                className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-900 dark:text-slate-100 focus:outline-none focus:border-indigo-500"
              />
              {errors.name && <p className="text-[11px] text-rose-500 mt-1">{String(errors.name.message)}</p>}
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Folder / Collection (Optional)
              </label>
              <select
                {...register('collectionId')}
                className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-900 dark:text-slate-100 focus:outline-none focus:border-indigo-500"
              >
                <option value="">No Collection (Ungrouped)</option>
                {collections.map((col) => (
                  <option key={col.id} value={col.id}>
                    {col.name}
                  </option>
                ))}
              </select>
            </div>

            <PicSelectField
              selectedPicIds={selectedPicIds}
              onChange={(ids) => setValue('picIds', ids, { shouldValidate: true, shouldDirty: true })}
              accounts={accounts}
              label="Person In Charge (PIC) - Optional"
              placeholder="Pilih PIC endpoint..."
              badgeTheme="indigo"
            />

            <div className="grid grid-cols-3 gap-2">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  {API_COLLECTIONS_TEXT.LABEL_METHOD}
                </label>
                <select
                  id={API_COLLECTIONS_SEMANTIC_ID.FORM_SELECT_METHOD}
                  {...register('methodRequest')}
                  className="w-full px-2 py-2 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-900 dark:text-slate-100 focus:outline-none font-medium"
                >
                  <option value="GET">GET</option>
                  <option value="POST">POST</option>
                  <option value="PUT">PUT</option>
                  <option value="PATCH">PATCH</option>
                  <option value="DELETE">DELETE</option>
                </select>
              </div>

              <div className="col-span-2">
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  {API_COLLECTIONS_TEXT.LABEL_PATH}
                </label>
                <input
                  id={API_COLLECTIONS_SEMANTIC_ID.FORM_INPUT_PATH}
                  type="text"
                  {...register('path')}
                  placeholder={API_COLLECTIONS_TEXT.PLACEHOLDER_PATH}
                  className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-900 dark:text-slate-100 focus:outline-none focus:border-indigo-500 font-mono"
                />
                {errors.path && <p className="text-[11px] text-rose-500 mt-1">{String(errors.path.message)}</p>}
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                {API_COLLECTIONS_TEXT.LABEL_DESCRIPTION}
              </label>
              <textarea
                id={API_COLLECTIONS_SEMANTIC_ID.FORM_TEXTAREA_DESC}
                {...register('description')}
                rows={2}
                placeholder={API_COLLECTIONS_TEXT.PLACEHOLDER_DESC}
                className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-900 dark:text-slate-100 focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div className="flex items-center justify-between pt-2">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">{API_COLLECTIONS_TEXT.LABEL_ACTIVE_STATUS}</label>
              <input
                id={API_COLLECTIONS_SEMANTIC_ID.FORM_CHECKBOX_STATUS}
                type="checkbox"
                {...register('status')}
                className="w-4 h-4 text-indigo-600 rounded border-slate-300 dark:border-slate-700"
              />
            </div>

            <div id={API_COLLECTIONS_SEMANTIC_ID.FORM_FOOTER} className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
              <button
                id={API_COLLECTIONS_SEMANTIC_ID.FORM_BTN_CANCEL}
                type="button"
                onClick={() => onOpenChange(false)}
                className="px-3.5 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 rounded-md"
              >
                {API_COLLECTIONS_TEXT.BTN_CANCEL}
              </button>
              <button
                id={API_COLLECTIONS_SEMANTIC_ID.FORM_BTN_SUBMIT}
                type="submit"
                disabled={isSubmitting}
                className="px-4 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded-md shadow-xs transition-colors"
              >
                {editingApi ? API_COLLECTIONS_TEXT.BTN_SAVE : API_COLLECTIONS_TEXT.BTN_CREATE}
              </button>
            </div>
          </form>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
};