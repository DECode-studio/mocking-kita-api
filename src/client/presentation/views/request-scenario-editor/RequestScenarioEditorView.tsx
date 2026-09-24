'use client';

import React from 'react';
import { Loader2 } from 'lucide-react';
import { ApiDetailSnapshot } from '@/src/client/domain/api/usecase/api_detail_usecase';
import { useRequestScenarioEditor } from './hook/useRequestScenarioEditor';
import {
  REQUEST_SCENARIO_EDITOR_TEXT,
  REQUEST_SCENARIO_EDITOR_SEMANTIC_ID,
} from './constant';
import {
  RequestScenarioEditorHeader,
  RequestScenarioBasicCard,
  RequestScenarioParamsCard,
  RequestScenarioBodyCard,
  RequestScenarioEditorFooter,
} from './components';
import { ScrollToTopButton } from '@/src/client/presentation/components/shared/ScrollToTopButton';

interface RequestScenarioEditorViewProps {
  projectId: string;
  apiId: string;
  scenarioId?: string | null;
  initialDetail?: ApiDetailSnapshot;
}

export const RequestScenarioEditorView: React.FC<RequestScenarioEditorViewProps> = ({
  projectId,
  apiId,
  scenarioId,
  initialDetail,
}) => {
  const {
    project,
    api,
    targetScenario,
    isEditMode,
    isLoading,
    isSaving,
    name,
    setName,
    priority,
    setPriority,
    status,
    setStatus,
    matchStrategy,
    setMatchStrategy,
    queryParams,
    setQueryParams,
    headers,
    setHeaders,
    body,
    setBody,
    bodyType,
    setBodyType,
    bodyRules,
    setBodyRules,
    strictBodyStructure,
    setStrictBodyStructure,
    handleSubmit,
    handleCancel,
  } = useRequestScenarioEditor({
    projectId,
    apiId,
    scenarioId,
    initialDetail,
  });

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
        <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
        <p className="text-xs text-slate-500 font-medium">{REQUEST_SCENARIO_EDITOR_TEXT.LOADING_SCENARIO_DETAILS}</p>
      </div>
    );
  }

  const pageTitle = isEditMode
    ? `${REQUEST_SCENARIO_EDITOR_TEXT.TITLE_EDIT_PREFIX} ${targetScenario?.name || name || REQUEST_SCENARIO_EDITOR_TEXT.DEFAULT_SCENARIO_NAME}`
    : REQUEST_SCENARIO_EDITOR_TEXT.TITLE_CREATE;

  return (
    <form
      id={REQUEST_SCENARIO_EDITOR_SEMANTIC_ID.FORM}
      onSubmit={handleSubmit}
      className="space-y-6 w-full pb-4"
    >
      {/* 1. Header with Breadcrumbs and Quick Actions */}
      <RequestScenarioEditorHeader
        projectId={projectId}
        apiId={apiId}
        project={project}
        api={api}
        pageTitle={pageTitle}
        isEditMode={isEditMode}
        isSaving={isSaving}
        onCancel={handleCancel}
      />

      {/* 2. Main Form Content Cards */}
      <div className="space-y-6">
        {/* Card: Basic Settings & Match Strategy */}
        <RequestScenarioBasicCard
          name={name}
          onNameChange={setName}
          priority={priority}
          onPriorityChange={setPriority}
          status={status}
          onStatusChange={setStatus}
          matchStrategy={matchStrategy}
          onMatchStrategyChange={setMatchStrategy}
        />

        {/* Card: Query Params & Headers */}
        <RequestScenarioParamsCard
          projectId={projectId}
          queryParams={queryParams}
          onQueryParamsChange={setQueryParams}
          headers={headers}
          onHeadersChange={setHeaders}
        />

        {/* Card: Request Body & Path Rules */}
        <RequestScenarioBodyCard
          projectId={projectId}
          body={body}
          onBodyChange={setBody}
          bodyType={bodyType}
          onBodyTypeChange={setBodyType}
          bodyRules={bodyRules}
          onBodyRulesChange={setBodyRules}
          strictBodyStructure={strictBodyStructure}
          onStrictBodyStructureChange={setStrictBodyStructure}
        />
      </div>

      {/* 3. Footer Action Bar */}
      <RequestScenarioEditorFooter
        isEditMode={isEditMode}
        isSaving={isSaving}
        onCancel={handleCancel}
      />

      {/* Scroll to Top */}
      <ScrollToTopButton />
    </form>
  );
};

export default RequestScenarioEditorView;