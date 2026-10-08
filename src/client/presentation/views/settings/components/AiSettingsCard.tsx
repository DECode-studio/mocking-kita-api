'use client';

import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  Key,
  Plus,
  Trash2,
  CheckCircle2,
  XCircle,
  Eye,
  EyeOff,
  RefreshCw,
  ShieldCheck,
  Zap,
  Sliders,
  AlertTriangle,
  ArrowUpDown,
  Lock,
} from 'lucide-react';
import { useUIStore } from '../../../stores/uiStore';

interface StoredApiKey {
  id: string;
  name: string;
  provider: string;
  keyHint: string;
  priority: number;
  isActive: boolean;
  lastUsedAt: string | null;
  failureCount: number;
  lastError: string | null;
  createdAt: string;
}

export const AiSettingsCard: React.FC = () => {
  const { addToast } = useUIStore();
  const [keys, setKeys] = useState<StoredApiKey[]>([]);
  const [hasEnvFallback, setHasEnvFallback] = useState(false);
  const [envKeyHint, setEnvKeyHint] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Add Key Modal State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newKeyName, setNewKeyName] = useState('');
  const [newKeyValue, setNewKeyValue] = useState('');
  const [newKeyPriority, setNewKeyPriority] = useState(1);
  const [showKeySecret, setShowKeySecret] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Test Key State
  const [testingKeyId, setTestingKeyId] = useState<string | null>(null);

  const fetchKeys = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/ai/keys');
      if (res.ok) {
        const data = await res.json();
        setKeys(data.keys || []);
        setHasEnvFallback(Boolean(data.hasEnvFallback));
        setEnvKeyHint(data.envKeyHint || null);
      }
    } catch (err: any) {
      addToast({ type: 'error', title: 'Gagal memuat daftar AI API Key', description: err.message });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchKeys();
  }, []);

  const handleAddKey = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newKeyValue.trim()) {
      addToast({ type: 'error', title: 'Validasi Gagal', description: 'API Key wajib diisi.' });
      return;
    }

    setIsSaving(true);
    try {
      const res = await fetch('/api/ai/keys', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newKeyName.trim() || 'NVIDIA NIM Key',
          apiKey: newKeyValue.trim(),
          priority: Number(newKeyPriority) || 1,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Gagal menyimpan API Key');
      }

      addToast({ type: 'success', title: 'Berhasil Tersimpan', description: 'API Key berhasil dienkripsi dan disimpan.' });
      setIsAddModalOpen(false);
      setNewKeyName('');
      setNewKeyValue('');
      setNewKeyPriority(keys.length + 1);
      fetchKeys();
    } catch (err: any) {
      addToast({ type: 'error', title: 'Gagal Menyimpan', description: err.message });
    } finally {
      setIsSaving(false);
    }
  };

  const handleToggleActive = async (key: StoredApiKey) => {
    try {
      const res = await fetch(`/api/ai/keys/${key.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !key.isActive }),
      });
      if (res.ok) {
        addToast({ type: 'success', title: 'Status Diperbarui', description: `API Key ${key.name} ${!key.isActive ? 'diaktifkan' : 'dinonaktifkan'}.` });
        fetchKeys();
      }
    } catch (err: any) {
      addToast({ type: 'error', title: 'Gagal Memperbarui', description: err.message });
    }
  };

  const handleDeleteKey = async (keyId: string, name: string) => {
    if (!confirm(`Hapus API Key "${name}"?`)) return;
    try {
      const res = await fetch(`/api/ai/keys/${keyId}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        addToast({ type: 'success', title: 'Terhapus', description: `API Key "${name}" berhasil dihapus.` });
        fetchKeys();
      }
    } catch (err: any) {
      addToast({ type: 'error', title: 'Gagal Menghapus', description: err.message });
    }
  };

  const handleTestKey = async (keyId: string) => {
    setTestingKeyId(keyId);
    try {
      const res = await fetch('/api/ai/keys/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ keyId }),
      });
      const data = await res.json();
      if (data.success) {
        addToast({ type: 'success', title: 'Tes Koneksi Berhasil', description: data.message });
      } else {
        addToast({ type: 'error', title: 'Tes Koneksi Gagal', description: data.message });
      }
      fetchKeys();
    } catch (err: any) {
      addToast({ type: 'error', title: 'Gagal Menguji Kunci', description: err.message });
    } finally {
      setTestingKeyId(null);
    }
  };

  return (
    <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xl shadow-slate-950/5 overflow-hidden">
      {/* Header */}
      <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-slate-50/50 dark:bg-slate-950/40">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-linear-to-tr from-purple-600 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-purple-500/20">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <span>NVIDIA NIM & AI API Keys</span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-purple-500/15 text-purple-600 dark:text-purple-300 border border-purple-500/20">
                AES-256-GCM Encrypted
              </span>
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Kelola beberapa API Key untuk sistem <strong>Auto-Fallback & Failover</strong> saat batas kuota/rate-limit tercapai.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={fetchKeys}
            disabled={isLoading}
            title="Muat Ulang"
            className="p-2 rounded-xl border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>

          <button
            type="button"
            onClick={() => {
              setNewKeyPriority(keys.length + 1);
              setIsAddModalOpen(true);
            }}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-linear-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs font-semibold shadow-md shadow-purple-500/20 transition-all active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>Tambah API Key</span>
          </button>
        </div>
      </div>

      {/* Body List */}
      <div className="p-6 space-y-4">
        {keys.length === 0 && !hasEnvFallback ? (
          <div className="rounded-2xl border border-dashed border-slate-300 dark:border-slate-800 p-8 text-center text-slate-400 space-y-3">
            <Lock className="w-10 h-10 mx-auto text-slate-500 stroke-1" />
            <div>
              <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Belum ada API Key tersimpan di database.
              </p>
              <p className="text-[11px] text-slate-500 mt-1 max-w-md mx-auto">
                Tambahkan API Key NVIDIA NIM Anda agar Chat Assistant dan fitur AI dapat digunakan. Kunci Anda akan dienkripsi dengan standar AES-256-GCM.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setIsAddModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-purple-600 text-white text-xs font-semibold shadow-md shadow-purple-600/20 hover:bg-purple-500"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Tambah Kunci Pertama</span>
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {keys.map((k, index) => (
              <div
                key={k.id}
                className={`p-4 rounded-2xl border transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 ${
                  k.isActive
                    ? 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 shadow-xs'
                    : 'border-slate-200/60 dark:border-slate-800/40 bg-slate-50/50 dark:bg-slate-950/20 opacity-60'
                }`}
              >
                {/* Left info */}
                <div className="flex items-start gap-3 min-w-0">
                  <div
                    className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${
                      k.isActive
                        ? 'bg-purple-500/20 text-purple-600 dark:text-purple-400'
                        : 'bg-slate-200 dark:bg-slate-800 text-slate-400'
                    }`}
                  >
                    <Key className="w-4 h-4" />
                  </div>

                  <div className="space-y-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate">
                        {k.name}
                      </span>
                      <span className="px-2 py-0.2 rounded-full text-[10px] font-mono font-semibold bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20">
                        Prioritas #{k.priority}
                      </span>
                      {index === 0 && k.isActive && (
                        <span className="px-2 py-0.2 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
                          Utama (Primary)
                        </span>
                      )}
                      {index > 0 && k.isActive && (
                        <span className="px-2 py-0.2 rounded-full text-[10px] font-medium bg-amber-500/15 text-amber-600 dark:text-amber-400">
                          Fallback #{index}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-3 text-[11px] text-slate-500 font-mono">
                      <span>{k.keyHint}</span>
                      <span>•</span>
                      <span>
                        Digunakan:{' '}
                        {k.lastUsedAt ? new Date(k.lastUsedAt).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' }) : 'Belum pernah'}
                      </span>
                      {k.failureCount > 0 && (
                        <span className="text-rose-500 flex items-center gap-1 font-sans">
                          <AlertTriangle className="w-3 h-3" /> {k.failureCount}x gagal
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Right actions */}
                <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto">
                  <button
                    type="button"
                    onClick={() => handleTestKey(k.id)}
                    disabled={testingKeyId === k.id}
                    className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-medium text-slate-700 dark:text-slate-300 transition-colors"
                  >
                    <Zap className={`w-3.5 h-3.5 text-amber-500 ${testingKeyId === k.id ? 'animate-bounce' : ''}`} />
                    <span>{testingKeyId === k.id ? 'Menguji...' : 'Tes Kunci'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleToggleActive(k)}
                    className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                      k.isActive
                        ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/25'
                        : 'bg-slate-200 dark:bg-slate-800 text-slate-500 hover:bg-slate-300 dark:hover:bg-slate-700'
                    }`}
                  >
                    {k.isActive ? 'Aktif' : 'Nonaktif'}
                  </button>

                  <button
                    type="button"
                    onClick={() => handleDeleteKey(k.id, k.name)}
                    title="Hapus Kunci"
                    className="p-1.5 rounded-lg hover:bg-rose-500/10 text-slate-400 hover:text-rose-500 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}

            {/* .env Fallback Indicator if present */}
            {hasEnvFallback && (
              <div className="p-3.5 rounded-2xl border border-dashed border-slate-300 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/40 flex items-center justify-between text-xs text-slate-500">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-500" />
                  <span>
                    Environment Fallback (<code className="font-mono text-purple-400">.env NVIDIA_API_KEY</code>):{' '}
                    <strong className="font-mono">{envKeyHint}</strong>
                  </span>
                </div>
                <span className="px-2 py-0.5 rounded text-[10px] bg-slate-200 dark:bg-slate-800 font-medium">
                  Final Fallback
                </span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Add Key Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in">
          <div className="w-full max-w-md rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <Key className="w-5 h-5 text-purple-500" />
                <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                  Tambah NVIDIA NIM API Key
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAddKey} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Nama Label Kunci:
                </label>
                <input
                  type="text"
                  value={newKeyName}
                  onChange={(e) => setNewKeyName(e.target.value)}
                  placeholder="e.g. Primary NIM Key, Backup Team Account"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-purple-500/30"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  API Key Value (nvapi-...):
                </label>
                <div className="relative">
                  <input
                    type={showKeySecret ? 'text' : 'password'}
                    value={newKeyValue}
                    onChange={(e) => setNewKeyValue(e.target.value)}
                    placeholder="nvapi-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                    className="w-full px-3 py-2 pr-10 font-mono rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-purple-500/30"
                  />
                  <button
                    type="button"
                    onClick={() => setShowKeySecret(!showKeySecret)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                  >
                    {showKeySecret ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                <p className="text-[11px] text-slate-400 mt-1">
                  🔒 Kunci akan otomatis dienkripsi dengan standar AES-256-GCM sebelum disimpan di database.
                </p>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Urutan Prioritas (Priority Order):
                </label>
                <input
                  type="number"
                  min={1}
                  max={99}
                  value={newKeyPriority}
                  onChange={(e) => setNewKeyPriority(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-purple-500/30 font-mono"
                />
                <p className="text-[11px] text-slate-400 mt-1">
                  Kunci dengan prioritas lebih rendah (misal 1) akan dicoba terlebih dahulu sebelum fallback ke 2, 3, dst.
                </p>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-semibold shadow-md shadow-purple-600/30 disabled:opacity-50"
                >
                  {isSaving ? 'Menyimpan...' : 'Simpan & Enkripsi'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
