'use client';

import React from 'react';
import { useAdminChangeLogs } from './useAdminChangeLogs';
import { ChangeLogsAdminHeader } from './components/ChangeLogsAdminHeader';
import { ChangeLogsSearchFilterBar } from './components/ChangeLogsSearchFilterBar';
import { ChangeLogsTable } from './components/ChangeLogsTable';
import { ChangeLogDetailModal } from './components/ChangeLogDetailModal';
import { CHANGE_LOGS_ADMIN_SEMANTIC_ID } from './constant';

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
    activeLogDetails,
    openLogDetails,
    closeLogDetails,
    refresh,
  } = useAdminChangeLogs();

  return (
    <div id={CHANGE_LOGS_ADMIN_SEMANTIC_ID.CONTAINER} className="w-full space-y-6">
      {/* Header */}
      <ChangeLogsAdminHeader
        loading={loading}
        onRefresh={refresh}
      />

      {/* Filter and Search Bar */}
      <ChangeLogsSearchFilterBar
        search={search}
        onSearchChange={setSearch}
        actionFilter={actionFilter}
        onActionFilterChange={setActionFilter}
        projectFilter={projectFilter}
        onProjectFilterChange={setProjectFilter}
        projects={projects}
      />

      {/* Main Table or Card List */}
      <ChangeLogsTable
        changeLogs={changeLogs}
        loading={loading}
        error={error}
        totalCount={totalCount}
        page={page}
        totalPages={totalPages}
        onPageChange={setPage}
        onViewDetails={openLogDetails}
      />

      {/* Inspect Modal Overlay */}
      <ChangeLogDetailModal
        log={activeLogDetails}
        onClose={closeLogDetails}
      />
    </div>
  );
};

export default ChangeLogsAdminView;
