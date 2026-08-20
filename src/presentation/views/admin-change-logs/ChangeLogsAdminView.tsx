'use client';

import React, { useState } from 'react';
import { useAdminChangeLogs, ChangeLogEntry } from './useAdminChangeLogs';
import { Search, RefreshCw, Clock, User, Eye, X, Filter, ChevronLeft, ChevronRight, Activity, Database, FileCode2 } from 'lucide-react';
import { cn } from '@/src/core/utils/cn';

export const ChangeLogsAdminView: React.FC = () => {
  const {
    changeLogs,
    projects,
    totalCount,
    loading,
    error,
    search,
    setSearch,
    actionFilter,
    setActionFilter,
    projectFilter,
    setProjectFilter,
    page,
    setPage,
    totalPages,
    refresh,
  } = useAdminChangeLogs();

  const [activeLogDetails, setActiveLogDetails] = useState<ChangeLogEntry | null>(null);

  // Helper to format date
  const formatDate = (isoString: string) => {
    try {
      const date = new Date(isoString);
      return new Intl.DateTimeFormat('id-ID', {
        dateStyle: 'medium',
        timeStyle: 'short',
      }).format(date);
    } catch {
      return isoString;
    }
  };

  // Helper to render action badge
  const renderActionBadge = (action: ChangeLogEntry['action']) => {
    const styles: Record<ChangeLogEntry['action'], string> = {
      CREATE: 'bg-emerald-50 text-emerald-700 ring-emerald-600/20 dark:bg-emerald-500/10 dark:text-emerald-400 dark:ring-emerald-500/20',
      UPDATE: 'bg-blue-50 text-blue-700 ring-blue-600/20 dark:bg-blue-500/10 dark:text-blue-400 dark:ring-blue-500/20',
      DELETE: 'bg-red-50 text-red-700 ring-red-600/20 dark:bg-red-500/10 dark:text-red-400 dark:ring-red-500/20',
      RESTORE: 'bg-teal-50 text-teal-700 ring-teal-600/20 dark:bg-teal-500/10 dark:text-teal-400 dark:ring-teal-500/20',
      IMPORT: 'bg-purple-50 text-purple-700 ring-purple-600/20 dark:bg-purple-500/10 dark:text-purple-400 dark:ring-purple-500/20',
      RESET: 'bg-amber-50 text-amber-700 ring-amber-600/20 dark:bg-amber-500/10 dark:text-amber-400 dark:ring-amber-500/20',
    };

    return (
      <span className={cn(
        'inline-flex items-center rounded-md px-2 py-1 text-xs font-semibold ring-1 ring-inset',
        styles[action] || 'bg-slate-50 text-slate-700 ring-slate-600/20 dark:bg-slate-500/10 dark:text-slate-400 dark:ring-slate-500/20'
      )}>
        {action}
      </span>
    );
  };

  // Helper to render entity type icon
  const getEntityTypeIcon = (type: ChangeLogEntry['entity_type']) => {
    switch (type) {
      case 'database':
        return <Database className="w-4 h-4 text-slate-500" />;
      case 'project':
        return <Activity className="w-4 h-4 text-indigo-500" />;
      default:
        return <FileCode2 className="w-4 h-4 text-blue-500" />;
    }
  };

  const parseJSON = (str: string | null) => {
    if (!str) return null;
    try {
      return JSON.parse(str);
    } catch {
      return str;
    }
  };

  return (
    <div className="w-full space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-200 dark:border-slate-800 pb-5">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Change Logs</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Riwayat audit aktivitas, modifikasi resource, dan proses impor data database.
          </p>
        </div>
        <button
          onClick={refresh}
          disabled={loading}
          className="flex items-center gap-2 text-sm font-medium text-slate-600 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 px-3.5 py-2 rounded-lg hover:shadow-sm transition-all disabled:opacity-50"
        >
          <RefreshCw className={cn('w-4 h-4', loading && 'animate-spin')} />
          Refresh
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 bg-slate-50 dark:bg-slate-900/50 p-4 rounded-xl border border-slate-200/60 dark:border-slate-800/60">
        <div className="relative md:col-span-2">
          <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
            <Search className="h-4.5 w-4.5 text-slate-400" />
          </span>
          <input
            type="text"
            placeholder="Cari deskripsi, operator, atau tipe..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="block w-full pl-10 pr-4 py-2 border border-slate-200 dark:border-slate-800 rounded-lg bg-white dark:bg-slate-950 text-slate-950 dark:text-white text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 dark:focus:ring-indigo-400/20 dark:focus:border-indigo-400 transition"
          />
        </div>

        {/* Action Filter */}
        <div className="relative">
          <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Filter className="h-4 w-4 text-slate-400" />
          </span>
          <select
            value={actionFilter}
            onChange={(e) => setActionFilter(e.target.value)}
            className="block w-full pl-9 pr-4 py-2 border border-slate-200 dark:border-slate-800 rounded-lg bg-white dark:bg-slate-950 text-slate-950 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 dark:focus:ring-indigo-400/20 dark:focus:border-indigo-400 transition appearance-none"
          >
            <option value="">Semua Aksi</option>
            <option value="CREATE">CREATE</option>
            <option value="UPDATE">UPDATE</option>
            <option value="DELETE">DELETE</option>
            <option value="RESTORE">RESTORE</option>
            <option value="IMPORT">IMPORT</option>
            <option value="RESET">RESET</option>
          </select>
        </div>

        {/* Project Filter */}
        <div className="relative">
          <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Filter className="h-4 w-4 text-slate-400" />
          </span>
          <select
            value={projectFilter}
            onChange={(e) => setProjectFilter(e.target.value)}
            className="block w-full pl-9 pr-4 py-2 border border-slate-200 dark:border-slate-800 rounded-lg bg-white dark:bg-slate-950 text-slate-950 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 dark:focus:ring-indigo-400/20 dark:focus:border-indigo-400 transition appearance-none"
          >
            <option value="">Semua Proyek</option>
            {projects.map((proj) => (
              <option key={proj.id} value={proj.id}>
                {proj.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Main Table or Card List */}
      <div className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800/80 rounded-xl shadow-sm overflow-hidden transition-colors">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 space-y-4">
            <RefreshCw className="w-8 h-8 text-indigo-500 animate-spin" />
            <span className="text-sm font-medium text-slate-500 dark:text-slate-400">Loading Change Logs...</span>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center py-16 px-4 text-center space-y-3">
            <span className="text-red-500 bg-red-50 dark:bg-red-500/10 p-3 rounded-full">
              <X className="w-6 h-6" />
            </span>
            <h3 className="font-semibold text-slate-950 dark:text-white text-sm">Gagal memuat log riwayat</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-xs">{error}</p>
          </div>
        ) : changeLogs.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 px-4 text-center space-y-3">
            <span className="text-slate-400 bg-slate-100 dark:bg-slate-900 p-3 rounded-full">
              <Clock className="w-6 h-6" />
            </span>
            <h3 className="font-semibold text-slate-950 dark:text-white text-sm">Tidak ada log perubahan</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-xs">
              Belum ada perubahan data atau filter pencarian Anda tidak menemukan hasil.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/30 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  <th className="py-3 px-4.5">Waktu</th>
                  <th className="py-3 px-4.5">Operator</th>
                  <th className="py-3 px-4.5">Aksi</th>
                  <th className="py-3 px-4.5">Tipe Resource</th>
                  <th className="py-3 px-4.5">Keterangan</th>
                  <th className="py-3 px-4.5 text-right">Detail</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800 text-sm text-slate-700 dark:text-slate-300">
                {changeLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/10 transition">
                    <td className="py-3.5 px-4.5 whitespace-nowrap text-xs text-slate-400 dark:text-slate-500 font-medium">
                      {formatDate(log.created_at)}
                    </td>
                    <td className="py-3.5 px-4.5 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <span className="w-6 h-6 rounded-full bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold text-xs uppercase">
                          {log.operator.charAt(0)}
                        </span>
                        <span className="font-medium text-slate-900 dark:text-slate-200">{log.operator}</span>
                      </div>
                    </td>
                    <td className="py-3.5 px-4.5 whitespace-nowrap">
                      {renderActionBadge(log.action)}
                    </td>
                    <td className="py-3.5 px-4.5 whitespace-nowrap">
                      <div className="flex items-center gap-1.5 capitalize text-xs">
                        {getEntityTypeIcon(log.entity_type)}
                        <span>{log.entity_type.replace('_', ' ')}</span>
                      </div>
                    </td>
                    <td className="py-3.5 px-4.5 max-w-sm truncate text-slate-900 dark:text-slate-100 font-medium">
                      {log.description}
                    </td>
                    <td className="py-3.5 px-4.5 text-right whitespace-nowrap">
                      <button
                        onClick={() => setActiveLogDetails(log)}
                        className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 hover:underline cursor-pointer"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        View
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-slate-200 dark:border-slate-800 px-4.5 py-4 bg-slate-50/50 dark:bg-slate-900/10">
            <span className="text-xs text-slate-500 dark:text-slate-400">
              Menampilkan <span className="font-semibold text-slate-800 dark:text-slate-200">{changeLogs.length}</span> dari{' '}
              <span className="font-semibold text-slate-800 dark:text-slate-200">{totalCount}</span> log
            </span>
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setPage((prev) => Math.max(prev - 1, 1))}
                disabled={page === 1}
                className="p-1.5 border border-slate-200 dark:border-slate-800 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-900 text-slate-600 dark:text-slate-400 disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 px-2.5">
                {page} / {totalPages}
              </span>
              <button
                onClick={() => setPage((prev) => Math.min(prev + 1, totalPages))}
                disabled={page === totalPages}
                className="p-1.5 border border-slate-200 dark:border-slate-800 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-900 text-slate-600 dark:text-slate-400 disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Inspect Modal Overlay */}
      {activeLogDetails && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm transition-opacity">
          <div className="relative w-full max-w-4xl bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800/90 shadow-2xl flex flex-col max-h-[85vh] overflow-hidden">
            {/* Modal Header */}
            <div className="flex justify-between items-center px-6 py-4.5 border-b border-slate-200 dark:border-slate-800">
              <div>
                <h3 className="text-lg font-bold text-slate-950 dark:text-white flex items-center gap-2">
                  <Clock className="w-5 h-5 text-indigo-500" />
                  Detail Perubahan Data
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  ID Perubahan: <span className="font-mono text-[10px] select-all">{activeLogDetails.id}</span>
                </p>
              </div>
              <button
                onClick={() => setActiveLogDetails(null)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {/* Log Meta Cards */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 bg-slate-50 dark:bg-slate-950/40 p-4 rounded-xl border border-slate-200/50 dark:border-slate-800/50">
                <div>
                  <span className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">Waktu</span>
                  <p className="text-xs font-semibold text-slate-900 dark:text-white mt-0.5">{formatDate(activeLogDetails.created_at)}</p>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">Operator</span>
                  <p className="text-xs font-semibold text-slate-900 dark:text-white mt-0.5">{activeLogDetails.operator}</p>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">Aksi</span>
                  <div className="mt-0.5">{renderActionBadge(activeLogDetails.action)}</div>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">Tipe Resource</span>
                  <p className="text-xs font-semibold text-slate-900 dark:text-white mt-0.5 capitalize">{activeLogDetails.entity_type.replace('_', ' ')}</p>
                </div>
              </div>

              <div>
                <span className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">Deskripsi Aktivitas</span>
                <p className="text-sm font-semibold text-slate-950 dark:text-white mt-1 border-l-3 border-indigo-500 pl-3 py-0.5">
                  {activeLogDetails.description}
                </p>
              </div>

              {/* State snapshots view */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Before State */}
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Keadaan Sebelum (Before)</span>
                    {!activeLogDetails.before_state && (
                      <span className="text-[10px] font-medium text-slate-400">Tidak Ada Data (Baru)</span>
                    )}
                  </div>
                  <div className="bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-200/80 dark:border-slate-900 overflow-hidden">
                    <pre className="p-4 overflow-auto font-mono text-xs max-h-80 text-slate-700 dark:text-slate-300 leading-relaxed select-all">
                      {activeLogDetails.before_state
                        ? JSON.stringify(parseJSON(activeLogDetails.before_state), null, 2)
                        : '// NULL (CREATE/IMPORT/RESET operation)'}
                    </pre>
                  </div>
                </div>

                {/* After State */}
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Keadaan Sesudah (After)</span>
                    {!activeLogDetails.after_state && (
                      <span className="text-[10px] font-medium text-slate-400">Tidak Ada Data (Terhapus)</span>
                    )}
                  </div>
                  <div className="bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-200/80 dark:border-slate-900 overflow-hidden">
                    <pre className="p-4 overflow-auto font-mono text-xs max-h-80 text-slate-700 dark:text-slate-300 leading-relaxed select-all">
                      {activeLogDetails.after_state
                        ? JSON.stringify(parseJSON(activeLogDetails.after_state), null, 2)
                        : '// NULL (DELETE/RESET operation)'}
                    </pre>
                  </div>
                </div>
              </div>

              {/* Metadata if present */}
              {activeLogDetails.metadata && (
                <div className="space-y-2">
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Informasi Metadata Tambahan</span>
                  <div className="bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-200/80 dark:border-slate-900 p-4">
                    <pre className="font-mono text-xs text-slate-700 dark:text-slate-300">
                      {JSON.stringify(parseJSON(activeLogDetails.metadata), null, 2)}
                    </pre>
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="flex justify-end gap-3 px-6 py-4 bg-slate-50 dark:bg-slate-900/60 border-t border-slate-200 dark:border-slate-800 shrink-0">
              <button
                type="button"
                onClick={() => setActiveLogDetails(null)}
                className="px-4 py-2 text-sm font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-200/50 dark:hover:bg-slate-800 rounded-lg cursor-pointer transition"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ChangeLogsAdminView;
