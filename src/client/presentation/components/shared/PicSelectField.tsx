'use client';


import React, { useState, useMemo } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { Users, X, Search, Check, Plus, UserCheck } from 'lucide-react';
import { Account } from '@/src/client/domain/account/entity/account';

interface PicSelectFieldProps {
  selectedPicIds: string[];
  onChange: (ids: string[]) => void;
  accounts: Account[];
  label?: string;
  placeholder?: string;
  badgeTheme?: 'purple' | 'indigo';
}

export const PicSelectField: React.FC<PicSelectFieldProps> = ({
  selectedPicIds,
  onChange,
  accounts,
  label = 'Person In Charge (PIC)',
  placeholder = 'Klik untuk memilih PIC...',
  badgeTheme = 'purple',
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [tempSelected, setTempSelected] = useState<string[]>(selectedPicIds);

  const openModal = () => {
    setTempSelected(selectedPicIds);
    setSearch('');
    setIsModalOpen(true);
  };

  const handleApply = () => {
    onChange(tempSelected);
    setIsModalOpen(false);
  };

  const handleRemoveOne = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    onChange(selectedPicIds.filter((picId) => picId !== id));
  };

  const toggleTempPic = (id: string) => {
    if (tempSelected.includes(id)) {
      setTempSelected(tempSelected.filter((item) => item !== id));
    } else {
      setTempSelected([...tempSelected, id]);
    }
  };

  const selectedAccounts = useMemo(() => {
    return accounts.filter((acc) => selectedPicIds.includes(acc.id));
  }, [accounts, selectedPicIds]);

  const filteredAccounts = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return accounts;
    return accounts.filter(
      (acc) =>
        acc.name.toLowerCase().includes(q) ||
        acc.username.toLowerCase().includes(q)
    );
  }, [accounts, search]);

  const themeClasses = badgeTheme === 'indigo' ? {
    countBg: 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400',
    chip: 'bg-indigo-100 dark:bg-indigo-950/80 text-indigo-900 dark:text-indigo-200',
    icon: 'text-indigo-600 dark:text-indigo-400',
    btnPrimary: 'bg-indigo-600 hover:bg-indigo-500',
    selectedItem: 'bg-indigo-50 dark:bg-indigo-950/50 border-indigo-300 dark:border-indigo-800/80 text-indigo-900 dark:text-indigo-100',
    checkbox: 'bg-indigo-600 border-indigo-600',
  } : {
    countBg: 'bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400',
    chip: 'bg-purple-100 dark:bg-purple-950/80 text-purple-900 dark:text-purple-200',
    icon: 'text-purple-600 dark:text-purple-400',
    btnPrimary: 'bg-purple-600 hover:bg-purple-500',
    selectedItem: 'bg-purple-50 dark:bg-purple-950/50 border-purple-300 dark:border-purple-800/80 text-purple-900 dark:text-purple-100',
    checkbox: 'bg-purple-600 border-purple-600',
  };

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
          {label}
        </label>
        {selectedPicIds.length > 0 && (
          <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded ${themeClasses.countBg}`}>
            {selectedPicIds.length} PIC dipilih
          </span>
        )}
      </div>

      {/* Trigger Box */}
      <div
        onClick={openModal}
        className="w-full min-h-9.5 px-2.5 py-1.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 hover:border-purple-500/50 dark:hover:border-purple-500/50 rounded-lg cursor-pointer transition-colors flex flex-wrap items-center gap-1.5"
      >
        {selectedAccounts.length === 0 ? (
          <div className="flex items-center gap-2 text-xs text-slate-400 dark:text-slate-500 py-0.5 px-1">
            <Users className="w-3.5 h-3.5" />
            <span>{placeholder}</span>
          </div>
        ) : (
          <>
            {selectedAccounts.map((acc) => (
              <span
                key={acc.id}
                className={`inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-md font-medium ${themeClasses.chip}`}
              >
                <UserCheck className={`w-3 h-3 ${themeClasses.icon}`} />
                <span>{acc.name}</span>
                <button
                  type="button"
                  onClick={(e) => handleRemoveOne(acc.id, e)}
                  className="hover:text-rose-600 dark:hover:text-rose-400 p-0.5 rounded"
                  title="Hapus PIC"
                >
                  <X className="w-2.5 h-2.5" />
                </button>
              </span>
            ))}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                openModal();
              }}
              className="inline-flex items-center gap-0.5 text-[10px] px-1.5 py-0.5 rounded bg-slate-200/70 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-300 dark:hover:bg-slate-700 transition-colors ml-auto"
            >
              <Plus className="w-3 h-3" />
              <span>Ubah PIC</span>
            </button>
          </>
        )}
      </div>

      {/* Selection Modal */}
      <Dialog.Root open={isModalOpen} onOpenChange={setIsModalOpen}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs z-60" />
          <Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-2xl z-60 space-y-3.5 focus:outline-none">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2.5">
              <div className="flex items-center gap-2">
                <Users className={`w-4 h-4 ${themeClasses.icon}`} />
                <Dialog.Title className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                  Pilih PIC (Person In Charge)
                </Dialog.Title>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Search Box */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Cari nama atau email..."
                className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-900 dark:text-slate-100 focus:outline-none focus:border-purple-500"
              />
            </div>

            {/* Account List */}
            <div className="max-h-56 overflow-y-auto space-y-1 pr-1">
              {filteredAccounts.length === 0 ? (
                <p className="text-xs text-slate-400 text-center py-6">
                  Tidak ada akun ditemukan
                </p>
              ) : (
                filteredAccounts.map((acc) => {
                  const isChecked = tempSelected.includes(acc.id);
                  return (
                    <div
                      key={acc.id}
                      onClick={() => toggleTempPic(acc.id)}
                      className={`flex items-center justify-between px-2.5 py-2 rounded-lg text-xs cursor-pointer transition-colors border ${
                        isChecked
                          ? themeClasses.selectedItem
                          : 'hover:bg-slate-100 dark:hover:bg-slate-800/60 border-transparent text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0 flex-1">
                        <div
                          className={`w-4 h-4 rounded flex items-center justify-center shrink-0 border transition-colors ${
                            isChecked
                              ? `${themeClasses.checkbox} text-white`
                              : 'border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950'
                          }`}
                        >
                          {isChecked && <Check className="w-3 h-3 stroke-3" />}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="font-medium truncate text-xs">{acc.name}</p>
                          <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate">
                            @{acc.username}
                          </p>
                        </div>
                      </div>

                      {acc.googleId ? (
                        <span className="text-[9px] px-1.5 py-0.5 bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 font-medium rounded shrink-0">
                          Google ✓
                        </span>
                      ) : (
                        <span className="text-[9px] px-1.5 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-400 rounded shrink-0">
                          No Google ID
                        </span>
                      )}
                    </div>
                  );
                })
              )}
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setTempSelected([])}
                className="text-xs text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
              >
                Clear All
              </button>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-3 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 rounded-md"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={handleApply}
                  className={`px-3.5 py-1.5 text-xs font-semibold text-white rounded-md shadow-xs transition-colors ${themeClasses.btnPrimary}`}
                >
                  Pilih ({tempSelected.length})
                </button>
              </div>
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </div>
  );
};