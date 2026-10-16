export interface VariableExtractor {
  variable: string;
  from: 'body' | 'headers' | 'status';
  path: string;
  defaultValue?: string;
}

export interface AssertionRule {
  id?: string;
  type: 'statusCode' | 'bodyPath' | 'header' | 'responseTime';
  path?: string;
  operator: 'equals' | 'notEquals' | 'contains' | 'notContains' | 'exists' | 'notExists' | 'greaterThan' | 'lessThan' | 'in_datasheet';
  expected?: unknown;
}

export interface AssertionResult {
  rule: AssertionRule;
  passed: boolean;
  actual: unknown;
  message?: string;
}

export interface ScenarioFlowStep {
  id: string;
  flowId: string;
  apiId?: string | null;
  requestScenarioId?: string | null;
  stepOrder: number;
  name: string;
  description?: string | null;
  enabled: boolean;
  delayMs: number;
  continueOnError: boolean;
  methodOverride?: string | null;
  pathOverride?: string | null;
  headersOverride?: Record<string, string> | null;
  queryParamsOverride?: Record<string, string> | null;
  pathParamsOverride?: Record<string, string> | null;
  bodyOverride?: unknown;
  bodyType?: string | null;
  extractors?: VariableExtractor[] | null;
  assertions?: AssertionRule[] | null;
  targetEnvironmentType?: string | null;
  targetEnvironment?: string | null;
  createdAt: string;
  updatedAt: string;

  api?: {
    id: string;
    name: string;
    methodRequest: string;
    path: string;
    projectId?: string;
    project?: { id: string; name: string } | null;
    collection?: { id: string; name: string } | null;
  } | null;

  requestScenario?: {
    id: string;
    name: string;
    headers?: Record<string, string> | null;
    queryParams?: Record<string, string> | null;
    pathParams?: Record<string, string> | null;
    body?: unknown;
    bodyType?: string;
  } | null;
}

export interface RequestSnapshot {
  method?: string;
  url?: string;
  headers?: Record<string, string>;
  body?: unknown;
  bodyType?: string;
}

export interface ResponseSnapshot {
  status?: number;
  statusText?: string;
  headers?: Record<string, string>;
  body?: unknown;
  responseTimeMs?: number;
}

export interface ScenarioFlowExecutionStep {
  id: string;
  executionId: string;
  flowStepId?: string | null;
  stepOrder: number;
  stepName: string;
  method: string;
  url: string;
  status: 'SUCCESS' | 'FAILED' | 'SKIPPED' | string;
  httpStatusCode?: number | null;
  durationMs: number;
  requestSnapshot?: RequestSnapshot | null;
  responseSnapshot?: ResponseSnapshot | null;
  extractedVariables?: Record<string, unknown> | null;
  assertionResults?: AssertionResult[] | null;
  errorMessage?: string | null;
  createdAt: string | Date;
}

export interface ScenarioFlowJob {
  id: string;
  projectId?: string | null;
  flowId: string;
  environmentId?: string | null;
  name: string;
  description?: string | null;
  status: 'ACTIVE' | 'PAUSED' | 'COMPLETED' | 'FAILED';
  scheduleType: 'CRON' | 'INTERVAL' | 'ONCE';
  cronExpression?: string | null;
  intervalSeconds?: number | null;
  scheduledAt?: string | null;
  targetMode: 'LIVE' | 'MOCK';
  stopCondition: 'FOREVER' | 'MAX_ITERATIONS' | 'UNTIL_DATE' | 'DATASHEET_EXHAUSTED';
  maxIterations?: number | null;
  currentIteration: number;
  endAt?: string | null;
  dataSourceType: 'NONE' | 'STATIC' | 'DATASHEET';
  dataSheetId?: string | null;
  dataIterationMode: 'PER_TICK' | 'BATCH_ALL';
  dataSheetCurrentIndex: number;
  customVariables?: Record<string, unknown> | null;
  lastRunAt?: string | null;
  nextRunAt?: string | null;
  lastStatus?: string | null;
  lastError?: string | null;
  totalRuns: number;
  successRuns: number;
  failedRuns: number;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string | null;
  flow?: {
    id: string;
    name: string;
  };
  environment?: {
    id: string;
    name: string;
  } | null;
  dataSheet?: {
    id: string;
    name: string;
    code: string;
  } | null;
}

export interface ScenarioFlowExecution {
  id: string;
  flowId: string;
  environmentId?: string | null;
  jobId?: string | null;
  status: 'RUNNING' | 'SUCCESS' | 'FAILED' | 'CANCELLED' | string;
  triggerSource: string;
  targetMode: 'LIVE' | 'MOCK' | string;
  totalSteps: number;
  passedSteps: number;
  failedSteps: number;
  durationMs: number;
  initialVariables?: unknown;
  finalVariables?: unknown;
  executedBy?: string | null;
  errorSummary?: string | null;
  createdAt: string | Date;
  environment?: {
    id: string;
    name: string;
    environmentType?: string;
    variables?: unknown;
    baseUrl?: string | null;
  } | null;
  job?: {
    id: string;
    name: string;
    scheduleType?: string;
    cronExpression?: string | null;
  } | null;
  flow?: {
    id: string;
    name: string;
    projectId?: string | null;
  } | null;
  steps?: ScenarioFlowExecutionStep[];
}

export interface JobExecutionsResult {
  items: ScenarioFlowExecution[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface GetJobExecutionsFilter {
  jobId?: string;
  flowId?: string;
  projectId?: string;
  status?: string;
  startDate?: string;
  endDate?: string;
  page?: number;
  limit?: number;
}


export interface ScenarioFlow {
  id: string;
  projectId?: string | null;
  project?: { id: string; name: string } | null;
  name: string;
  description?: string | null;
  status: boolean;
  defaultEnvironmentId?: string | null;
  stopOnFailure: boolean;
  variables?: Record<string, unknown> | null;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string | null;

  defaultEnvironment?: {
    id: string;
    name: string;
    environmentType: string;
    variables?: unknown;
    baseUrl?: string | null;
  } | null;

  steps?: ScenarioFlowStep[];
  executions?: ScenarioFlowExecution[];
  jobs?: ScenarioFlowJob[];
}

export interface FlowExportTemplate {
  $schema?: string;
  version?: string;
  exportedAt?: string;
  environments?: Array<{
    id?: string;
    name: string;
    isBaseUrl?: boolean;
    values?: Partial<Record<'LOCAL' | 'DEVELOPMENT' | 'STAGING' | 'PRODUCTION' | 'TESTING', string | null>>;
    environmentType?: 'LOCAL' | 'DEVELOPMENT' | 'STAGING' | 'PRODUCTION' | 'TESTING';
    baseUrl?: string;
    variables?: unknown[];
    isDefault?: boolean;
  }>;
  flow: {
    name: string;
    description?: string | null;
    stopOnFailure: boolean;
    variables?: Record<string, unknown>;
  };
  steps: Array<{
    order: number;
    name: string;
    description?: string | null;
    enabled: boolean;
    delayMs?: number;
    continueOnError?: boolean;
    api: {
      method: string;
      path: string;
      name?: string;
      collection?: string | null;
      description?: string | null;
      targetEnvironment?: string | null;
      environmentIds?: string[];
      environments?: string[];
    };
    requestScenario?: {
      name: string;
      description?: string | null;
      headers?: Record<string, string>;
      queryParams?: Record<string, string>;
      pathParams?: Record<string, string>;
      body?: unknown;
      bodyType?: string;
    };
    expectedResponseScenario?: {
      name?: string;
      statusCode?: number;
      headers?: Record<string, string>;
      body?: unknown;
    };
    overrides?: {
      method?: string | null;
      path?: string | null;
      headers?: Record<string, string> | null;
      queryParams?: Record<string, string> | null;
      pathParams?: Record<string, string> | null;
      body?: unknown;
    };
    extractors?: VariableExtractor[];
    assertions?: AssertionRule[];
  }>;
}


