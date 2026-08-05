'use client';

import React from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import {
  FolderGit2,
  Plus,
  Search,
  Grid,
  List as ListIcon,
  MoreVertical,
  Copy,
  Trash2,
  RotateCcw,
  Edit2,
  X,
  ExternalLink,
  Code2,
  Globe,
  Layers,
} from 'lucide-react';
import { StatusBadge } from '../../components/shared/StatusBadge';
import { StatusSwitch } from '../../components/shared/StatusSwitch';
import { ConfirmDialog } from '../../components/shared/ConfirmDialog';
import { EmptyState } from '../../components/shared/EmptyState';
import { formatDate } from '../../../core/utils/date';
import { useProjectsViewModel } from './useProjectsViewModel';

import { Project } from '@/src/domain/project/entity/project';
import { ROUTES } from '@/src/core/constants/routes';

export const ProjectsView: React.FC<{ initialProjects?: Project[] }> = ({ initialProjects = [] }) => {
  const {
    router,
    search,
    setSearch,
    statusFilter,
    setStatusFilter,
    sortBy,
    setSortBy,
    viewMode,
    setViewMode,
    isFormOpen,
    setIsFormOpen,
    editingProject,
    deletingProject,
    setDeletingProject,
    form,
    openAddDialog,
    openEditDialog,
    onSubmitForm,
    handleDuplicate,
    handleSoftDelete,
    handleRestore,
    handleConfirmHardDelete,
    filteredProjects,
    toggleProjectStatus,
  } = useProjectsViewModel(initialProjects);

  const { register, handleSubmit, formState: { errors, isSubmitting } } = form;

  return (
    <div className="space-y-6">
      {/* Header Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
            Projects Workspace
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Organize mock API definitions, environments, and response scenarios by project
          </p>
        </div>

        <button
          type="button"
          onClick={openAddDialog}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 text-xs font-semibold text-white bg-slate-900 dark:bg-slate-100 dark:text-slate-900 hover:bg-slate-800 dark:hover:bg-white rounded-xl shadow transition-all hover:scale-[1.02]"
        >
          <Plus className="w-4 h-4" />
          Add Project
        </button>
      </div>

      {/* Filters & Toolbar */}
      <div className="p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search projects..."
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 rounded-lg border border-slate-200 dark:border-slate-800 focus:outline-none focus:border-indigo-500"
          />
        </div>

        {/* Filter controls */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Status Tabs */}
          <div className="flex p-0.5 bg-slate-100 dark:bg-slate-800 rounded-lg text-[11px] font-medium">
            {(['ALL', 'ACTIVE', 'INACTIVE', 'DELETED'] as const).map((st) => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`px-2.5 py-1 rounded-md transition-colors ${
                  statusFilter === st
                    ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 font-semibold shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
              >
                {st}
              </button>
            ))}
          </div>

          {/* Sort By */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value === 'name' ? 'name' : 'date')}
            className="px-2.5 py-1 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-700 dark:text-slate-300 focus:outline-none font-medium"
          >
            <option value="date">Sort: Created Date</option>
            <option value="name">Sort: Name</option>
          </select>

          {/* View Toggle */}
          <div className="flex p-0.5 bg-slate-100 dark:bg-slate-800 rounded-lg">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-1 rounded ${viewMode === 'grid' ? 'bg-white dark:bg-slate-900 text-indigo-600 shadow-xs' : 'text-slate-400'}`}
              title="Grid View"
            >
              <Grid className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`p-1 rounded ${viewMode === 'table' ? 'bg-white dark:bg-slate-900 text-indigo-600 shadow-xs' : 'text-slate-400'}`}
              title="Table View"
            >
              <ListIcon className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Content Grid / Table */}
      {filteredProjects.length === 0 ? (
        <EmptyState
          icon={FolderGit2}
          title="No projects found"
          description={
            search
              ? `No projects matching "${search}"`
              : 'Create your first mock project to start adding environments and API definitions.'
          }
          actionLabel="Create Project"
          onAction={openAddDialog}
        />
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredProjects.map((project) => {
            return (
              <div
                key={project.id}
                className="group relative bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-purple-500/80 dark:hover:border-purple-500/80 rounded-2xl p-5 shadow-xs transition-all space-y-4 flex flex-col justify-between"
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-9 h-9 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20 flex items-center justify-center shrink-0">
                        <Code2 className="w-4 h-4" />
                      </div>
                      <h3
                        onClick={() => router.push(ROUTES.PROJECT_DETAIL(project.id))}
                        className="font-display font-bold text-base text-slate-900 dark:text-slate-100 hover:text-purple-400 cursor-pointer truncate transition-colors"
                      >
                        {project.name}
                      </h3>
                    </div>

                    <div className="flex items-center gap-1">
                      <StatusSwitch
                        checked={project.status}
                        onCheckedChange={() => toggleProjectStatus(project.id)}
                        size="sm"
                        disabled={!!project.deletedAt}
                      />

                      {/* Dropdown Menu */}
                      <DropdownMenu.Root>
                        <DropdownMenu.Trigger asChild>
                          <button className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded">
                            <MoreVertical className="w-4 h-4" />
                          </button>
                        </DropdownMenu.Trigger>
                        <DropdownMenu.Portal>
                          <DropdownMenu.Content
                            align="end"
                            className="w-44 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-1 shadow-xl z-50 text-xs text-slate-700 dark:text-slate-300 space-y-0.5"
                          >
                            <DropdownMenu.Item
                              onClick={() => router.push(`/projects/${project.id}`)}
                              className="flex items-center gap-2 px-2.5 py-1.5 rounded hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                            >
                              <ExternalLink className="w-3.5 h-3.5" />
                              <span>Open Detail</span>
                            </DropdownMenu.Item>
                            <DropdownMenu.Item
                              onClick={() => openEditDialog(project)}
                              className="flex items-center gap-2 px-2.5 py-1.5 rounded hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                              <span>Edit Details</span>
                            </DropdownMenu.Item>
                            <DropdownMenu.Item
                              onClick={() => handleDuplicate(project)}
                              className="flex items-center gap-2 px-2.5 py-1.5 rounded hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                            >
                              <Copy className="w-3.5 h-3.5" />
                              <span>Duplicate</span>
                            </DropdownMenu.Item>
                            <DropdownMenu.Separator className="h-px bg-slate-100 dark:bg-slate-800 my-1" />
                            {project.deletedAt ? (
                              <>
                                <DropdownMenu.Item
                                  onClick={() => handleRestore(project.id)}
                                  className="flex items-center gap-2 px-2.5 py-1.5 rounded text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 cursor-pointer"
                                >
                                  <RotateCcw className="w-3.5 h-3.5" />
                                  <span>Restore</span>
                                </DropdownMenu.Item>
                                <DropdownMenu.Item
                                  onClick={() =>
                                    setDeletingProject({ id: project.id, name: project.name, isPermanent: true })
                                  }
                                  className="flex items-center gap-2 px-2.5 py-1.5 rounded text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 cursor-pointer font-medium"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                  <span>Permanently Delete</span>
                                </DropdownMenu.Item>
                              </>
                            ) : (
                              <DropdownMenu.Item
                                onClick={() => handleSoftDelete(project.id)}
                                className="flex items-center gap-2 px-2.5 py-1.5 rounded text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 cursor-pointer"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                                <span>Soft Delete</span>
                              </DropdownMenu.Item>
                            )}
                          </DropdownMenu.Content>
                        </DropdownMenu.Portal>
                      </DropdownMenu.Root>
                    </div>
                  </div>

                  <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 min-h-8">
                    {project.description || 'No description provided.'}
                  </p>
                </div>

                <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs font-mono text-slate-500">
                  <span className="text-[10px]">{formatDate(project.createdAt)}</span>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* Table View */
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-xs">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-950 text-slate-500 dark:text-slate-400 uppercase tracking-wider font-semibold border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="p-3.5">Project Name</th>
                <th className="p-3.5">Status</th>
                <th className="p-3.5">Created Date</th>
                <th className="p-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredProjects.map((project) => {
                return (
                  <tr key={project.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors">
                    <td className="p-3.5">
                      <span
                        onClick={() => router.push(ROUTES.PROJECT_DETAIL(project.id))}
                        className="font-bold text-slate-900 dark:text-slate-100 hover:text-indigo-600 dark:hover:text-indigo-400 cursor-pointer block"
                      >
                        {project.name}
                      </span>
                      <span className="text-[11px] text-slate-400 block truncate max-w-xs">
                        {project.description || 'No description'}
                      </span>
                    </td>
                    <td className="p-3.5">
                      <StatusBadge status={project.status} />
                    </td>
                    <td className="p-3.5 font-mono text-slate-500">{formatDate(project.createdAt)}</td>
                    <td className="p-3.5 text-right space-x-2">
                      <button
                        onClick={() => router.push(ROUTES.PROJECT_DETAIL(project.id))}
                        className="px-2.5 py-1 text-xs font-semibold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/50 rounded hover:bg-indigo-100 transition-colors"
                      >
                        View
                      </button>
                      <button
                        onClick={() => openEditDialog(project)}
                        className="p-1 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
                        title="Edit"
                      >
                        <Edit2 className="w-3.5 h-3.5 inline" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Project Add / Edit Dialog */}
      <Dialog.Root open={isFormOpen} onOpenChange={setIsFormOpen}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs z-50" />
          <Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-2xl z-50 space-y-4 focus:outline-none">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <Dialog.Title className="text-base font-semibold text-slate-900 dark:text-slate-100">
                {editingProject ? 'Edit Project' : 'Add New Project'}
              </Dialog.Title>
              <button onClick={() => setIsFormOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit(onSubmitForm)} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Project Name *
                </label>
                <input
                  type="text"
                  {...register('name')}
                  placeholder="e.g. E-Commerce Platform API"
                  className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-900 dark:text-slate-100 focus:outline-none focus:border-indigo-500"
                />
                {errors.name && <p className="text-[11px] text-rose-500 mt-1">{errors.name.message}</p>}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Description
                </label>
                <textarea
                  {...register('description')}
                  rows={3}
                  placeholder="Brief summary of what this project provides..."
                  className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-900 dark:text-slate-100 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="flex items-center justify-between pt-2">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Active Status</label>
                <input
                  type="checkbox"
                  {...register('status')}
                  className="w-4 h-4 text-indigo-600 rounded border-slate-300 dark:border-slate-700"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsFormOpen(false)}
                  className="px-3.5 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 rounded-md"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded-md shadow-xs transition-colors"
                >
                  {editingProject ? 'Save Changes' : 'Create Project'}
                </button>
              </div>
            </form>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={!!deletingProject}
        onClose={() => setDeletingProject(null)}
        onConfirm={handleConfirmHardDelete}
        title="Permanently Delete Project?"
        description={`Are you sure you want to permanently delete "${deletingProject?.name}"? All associated environments, API definitions, and scenarios will be removed permanently.`}
        confirmLabel="Permanently Delete"
        variant="danger"
      />
    </div>
  );
};

export default ProjectsView;
