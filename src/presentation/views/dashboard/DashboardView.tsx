'use client';

import React from 'react';
import {
  FolderGit2,
  Globe,
  Layers,
  FileCode,
  CheckCircle2,
  Plus,
  Upload,
  Download,
  Settings,
  ArrowRight,
  Zap,
  Activity,
  Code2,
} from 'lucide-react';
import { HttpMethodBadge } from '../../components/shared/HttpMethodBadge';
import { StatusBadge } from '../../components/shared/StatusBadge';
import { MethodRequest } from '../../../core/utils/types';
import { useDashboardViewModel } from './useDashboardViewModel';
import { MockApiDatabase } from '@/src/core/db/mock-api-database';
import { createDatabaseSnapshotUseCase } from '@/src/domain/database';
import { ROUTES } from '@/src/core/constants/routes';

export const DashboardView: React.FC<{ initialDb?: MockApiDatabase }> = ({ initialDb }) => {
  const databaseSnapshotUseCase = createDatabaseSnapshotUseCase();
  const {
    db,
    router,
    activeProjects,
    activeApis,
    methodCounts,
    totalApisCount,
    openImportExport,
  } = useDashboardViewModel(databaseSnapshotUseCase, initialDb);

  return (
    <div className="space-y-8">
      {/* Section 12: Editorial Dashboard Hero */}
      <div className="relative overflow-hidden rounded-3xl border border-slate-800 bg-slate-950 p-6 sm:p-10 text-white shadow-2xl">
        <div className="absolute -top-32 -right-32 w-96 h-96 bg-purple-600/30 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute -bottom-20 left-1/3 w-80 h-80 bg-fuchsia-600/20 rounded-full blur-[100px] pointer-events-none" />

        <div className="relative z-10 max-w-3xl space-y-5">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-mono font-semibold bg-purple-500/15 text-purple-300 border border-purple-500/30">
            <span className="w-2 h-2 rounded-full bg-purple-400 animate-pulse" />
            MOCK API STUDIO ENGINE
          </div>

          <h1 className="font-display text-3xl sm:text-5xl font-bold leading-[1.05] tracking-tight">
            Build predictable APIs <span className="text-gradient">before the backend exists.</span>
          </h1>

          <p className="text-sm text-slate-300 max-w-xl leading-relaxed">
            Create endpoints, define deterministic or weighted response rules, configure headers & parameters, and test multi-environment URLs instantly.
          </p>

          <div className="pt-2 flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={() => router.push('/projects?new=true')}
              className="inline-flex items-center gap-2 px-4 py-2.5 text-xs font-semibold text-slate-950 bg-white hover:bg-slate-100 rounded-xl shadow-lg transition-all hover:scale-[1.02]"
            >
              <Plus className="w-4 h-4" />
              Create Project
            </button>
            <button
              type="button"
              onClick={openImportExport}
              className="inline-flex items-center gap-2 px-4 py-2.5 text-xs font-semibold text-white bg-slate-900 border border-slate-800 hover:bg-slate-800 rounded-xl transition-colors"
            >
              <Upload className="w-4 h-4 text-purple-400" />
              Import / Export JSON
            </button>
          </div>
        </div>
      </div>

      {/* Statistic Cards Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Projects Card */}
        <div className="p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-widest font-mono">
              PROJECTS
            </span>
            <div className="p-2.5 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20">
              <FolderGit2 className="w-4 h-4" />
            </div>
          </div>
          <div>
            <span className="font-display text-3xl font-bold text-slate-900 dark:text-slate-100">
              {db.projects.filter((p) => !p.deletedAt).length}
            </span>
            <span className="ml-2 text-xs text-emerald-600 dark:text-emerald-400 font-semibold font-mono">
              {activeProjects.length} Active
            </span>
          </div>
        </div>

        {/* Environments Card */}
        <div className="p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-widest font-mono">
              ENVIRONMENTS
            </span>
            <div className="p-2.5 rounded-xl bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border border-cyan-500/20">
              <Globe className="w-4 h-4" />
            </div>
          </div>
          <div>
            <span className="font-display text-3xl font-bold text-slate-900 dark:text-slate-100">
              {db.environments.filter((e) => !e.deletedAt).length}
            </span>
            <span className="ml-2 text-xs text-slate-500 font-medium font-mono">Configured</span>
          </div>
        </div>

        {/* API Collections Card */}
        <div className="p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-widest font-mono">
              ENDPOINTS
            </span>
            <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
              <Layers className="w-4 h-4" />
            </div>
          </div>
          <div>
            <span className="font-display text-3xl font-bold text-slate-900 dark:text-slate-100">
              {totalApisCount}
            </span>
            <span className="ml-2 text-xs text-amber-600 dark:text-amber-400 font-semibold font-mono">
              {activeApis.length} Active
            </span>
          </div>
        </div>

        {/* Scenarios Card */}
        <div className="p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-widest font-mono">
              SCENARIOS
            </span>
            <div className="p-2.5 rounded-xl bg-fuchsia-500/10 text-fuchsia-600 dark:text-fuchsia-400 border border-fuchsia-500/20">
              <FileCode className="w-4 h-4" />
            </div>
          </div>
          <div>
            <span className="font-display text-3xl font-bold text-slate-900 dark:text-slate-100">
              {db.requestScenarios.filter((r) => !r.deletedAt).length}
            </span>
            <span className="ml-2 text-xs text-fuchsia-500 font-semibold font-mono">
              {db.responseScenarios.filter((r) => !r.deletedAt).length} Resps
            </span>
          </div>
        </div>
      </div>

      {/* HTTP Method Distribution Bar */}
      {totalApisCount > 0 && (
        <div className="p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-semibold text-slate-800 dark:text-slate-200 uppercase tracking-widest font-mono">
              HTTP Methods Distribution
            </h3>
            <span className="text-xs text-slate-500 font-mono">{totalApisCount} Endpoints Total</span>
          </div>

          <div className="h-3 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden flex">
            {Object.entries(methodCounts).map(([method, count]) => {
              const pct = (count / totalApisCount) * 100;
              const bgMap: Record<string, string> = {
                GET: 'bg-emerald-500',
                POST: 'bg-indigo-500',
                PUT: 'bg-amber-500',
                PATCH: 'bg-yellow-500',
                DELETE: 'bg-rose-500',
                OPTIONS: 'bg-purple-500',
                HEAD: 'bg-slate-500',
              };
              return (
                <div
                  key={method}
                  style={{ width: `${pct}%` }}
                  className={`${bgMap[method] || 'bg-indigo-500'} h-full border-r border-slate-950/20`}
                  title={`${method}: ${count} (${pct.toFixed(0)}%)`}
                />
              );
            })}
          </div>

          <div className="flex flex-wrap items-center gap-3 pt-1">
            {Object.entries(methodCounts).map(([method, count]) => (
              <div key={method} className="flex items-center gap-2 text-xs font-mono">
                <HttpMethodBadge method={method as MethodRequest} size="sm" />
                <span className="text-slate-700 dark:text-slate-300 font-bold">{count}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Main Grid: Recent Projects & Recent APIs */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Projects */}
        <div className="p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <FolderGit2 className="w-4 h-4 text-purple-500" />
              <h3 className="font-display text-base font-bold text-slate-900 dark:text-slate-100">
                Recent Projects
              </h3>
            </div>
            <button
              onClick={() => router.push(ROUTES.PROJECTS)}
              className="text-xs font-semibold text-purple-600 dark:text-purple-400 hover:underline inline-flex items-center gap-1"
            >
              View All
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-2.5">
            {activeProjects.length === 0 ? (
              <p className="text-xs text-slate-500 italic py-6 text-center">No active projects found.</p>
            ) : (
              activeProjects.slice(0, 4).map((project) => {
                const projectApis = db.apiCollections.filter(
                  (a) => a.projectId === project.id && !a.deletedAt
                );
                const projectEnvs = db.environments.filter(
                  (e) => e.projectId === project.id && !e.deletedAt
                );

                return (
                  <div
                    key={project.id}
                    onClick={() => router.push(ROUTES.PROJECT_DETAIL(project.id))}
                    className="p-4 border border-slate-200 dark:border-slate-800/80 hover:border-purple-500 dark:hover:border-purple-500 rounded-xl bg-slate-50/50 dark:bg-slate-950/50 hover:bg-slate-50 dark:hover:bg-slate-950 transition-all cursor-pointer flex items-center justify-between group"
                  >
                    <div className="space-y-1 min-w-0 pr-2">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-xs text-slate-900 dark:text-slate-100 truncate group-hover:text-purple-400 transition-colors">
                          {project.name}
                        </span>
                        <StatusBadge status={project.status} />
                      </div>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-1">
                        {project.description || 'No description provided.'}
                      </p>
                    </div>

                    <div className="flex items-center gap-3 shrink-0 text-[11px] font-mono text-slate-500">
                      <span className="bg-slate-200/60 dark:bg-slate-800 px-2 py-0.5 rounded text-slate-600 dark:text-slate-300">{projectEnvs.length} Envs</span>
                      <span className="bg-purple-500/10 text-purple-600 dark:text-purple-300 px-2 py-0.5 rounded border border-purple-500/20">{projectApis.length} APIs</span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Recent APIs */}
        <div className="p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <Layers className="w-4 h-4 text-purple-500" />
              <h3 className="font-display text-base font-bold text-slate-900 dark:text-slate-100">
                Configured Endpoints
              </h3>
            </div>
            <span className="text-xs text-slate-500 font-mono">{activeApis.length} Active</span>
          </div>

          <div className="space-y-2.5">
            {activeApis.length === 0 ? (
              <p className="text-xs text-slate-500 italic py-6 text-center">No active API endpoints found.</p>
            ) : (
              activeApis.slice(0, 5).map((api) => {
                const reqCount = db.requestScenarios.filter(
                  (r) => r.apiId === api.id && !r.deletedAt
                ).length;
                const project = db.projects.find((p) => p.id === api.projectId);

                return (
                  <div
                    key={api.id}
                    onClick={() => router.push(ROUTES.API_DETAIL(api.projectId, api.id))}
                    className="p-3.5 border border-slate-200 dark:border-slate-800/80 hover:border-purple-500 dark:hover:border-purple-500 rounded-xl bg-slate-50/50 dark:bg-slate-950/50 hover:bg-slate-50 dark:hover:bg-slate-950 transition-all cursor-pointer flex items-center justify-between group"
                  >
                    <div className="flex items-center gap-3 min-w-0 pr-2">
                      <HttpMethodBadge method={api.methodRequest} size="sm" />
                      <div className="min-w-0">
                        <span className="font-mono text-xs font-bold text-slate-900 dark:text-slate-100 block truncate group-hover:text-purple-400 transition-colors">
                          {api.path}
                        </span>
                        <span className="text-[10px] text-slate-500 block truncate">
                          {api.name} • {project ? project.name : 'Project'}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <span className="px-2.5 py-1 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-[10px] font-mono rounded-lg border border-slate-200 dark:border-slate-700">
                        {reqCount} Rules
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardView;
