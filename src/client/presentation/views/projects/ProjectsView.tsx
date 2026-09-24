'use client';

import React from 'react';
import { FolderGit2 } from 'lucide-react';
import { ConfirmDialog } from '../../components/shared/ConfirmDialog';
import { EmptyState } from '../../components/shared/EmptyState';
import { ScrollToTopButton } from '../../components/shared/ScrollToTopButton';
import { useProjects } from './hook/useProjects';
import { Project } from '@/src/client/domain/project/entity/project';
import { ROUTES } from '@/src/core/constants/routes';
import { PROJECTS_TEXT, PROJECTS_SEMANTIC_ID } from './constant';
import {
  ProjectsHeader,
  ProjectsFilterBar,
  ProjectGridCard,
  ProjectTableView,
  ProjectFormModal,
} from './components';

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
    accounts,
  } = useProjects(undefined, initialProjects);

  return (
    <div id={PROJECTS_SEMANTIC_ID.CONTAINER} className="space-y-6">
      {/* Header Toolbar */}
      <ProjectsHeader onAddClick={openAddDialog} />

      {/* Filters & Toolbar */}
      <ProjectsFilterBar
        search={search}
        onSearchChange={setSearch}
        statusFilter={statusFilter}
        onStatusFilterChange={setStatusFilter}
        sortBy={sortBy}
        onSortByChange={setSortBy}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
      />

      {/* Content Grid / Table */}
      {filteredProjects.length === 0 ? (
        <EmptyState
          icon={FolderGit2}
          title={PROJECTS_TEXT.EMPTY_TITLE}
          description={
            search
              ? `${PROJECTS_TEXT.EMPTY_SEARCH_DESC} "${search}"`
              : PROJECTS_TEXT.EMPTY_DESC
          }
          actionLabel={PROJECTS_TEXT.CREATE_PROJECT_BTN}
          onAction={openAddDialog}
        />
      ) : viewMode === 'grid' ? (
        <div id={PROJECTS_SEMANTIC_ID.PROJECT_GRID} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredProjects.map((project) => (
            <ProjectGridCard
              key={project.id}
              project={project}
              onNavigateDetail={() => router.push(ROUTES.PROJECT_DETAIL(project.id))}
              onToggleStatus={toggleProjectStatus}
              onEdit={openEditDialog}
              onDuplicate={handleDuplicate}
              onRestore={handleRestore}
              onSoftDelete={handleSoftDelete}
              onHardDeleteRequest={(target) => setDeletingProject(target)}
            />
          ))}
        </div>
      ) : (
        <ProjectTableView
          projects={filteredProjects}
          onNavigateDetail={(id) => router.push(ROUTES.PROJECT_DETAIL(id))}
          onEdit={openEditDialog}
        />
      )}

      {/* Project Add / Edit Dialog */}
      <ProjectFormModal
        isOpen={isFormOpen}
        onOpenChange={setIsFormOpen}
        editingProject={editingProject}
        form={form}
        onSubmit={onSubmitForm}
        accounts={accounts}
      />

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={!!deletingProject}
        onClose={() => setDeletingProject(null)}
        onConfirm={handleConfirmHardDelete}
        title={PROJECTS_TEXT.DELETE_DIALOG_TITLE}
        description={`${PROJECTS_TEXT.DELETE_DIALOG_DESC_PREFIX} "${deletingProject?.name}"${PROJECTS_TEXT.DELETE_DIALOG_DESC_SUFFIX}`}
        confirmLabel={PROJECTS_TEXT.DELETE_DIALOG_CONFIRM}
        variant="danger"
      />

      {/* Scroll to Top */}
      <ScrollToTopButton />
    </div>
  );
};

export default ProjectsView;