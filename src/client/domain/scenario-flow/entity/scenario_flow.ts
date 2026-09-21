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
  expected?: any;
}

export interface AssertionResult {
  rule: AssertionRule;
  passed: boolean;
  actual: any;
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
  bodyOverride?: any;
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
    body?: any;
    bodyType?: string;
  } | null;
}

export interface ScenarioFlowExecutionStep {
  id: string;
  executionId: string;
  flowStepId?: string | null;
  stepOrder: number;
  stepName: string;
  method: string;
  url: string;
  status: 'SUCCESS' | 'FAILED' | 'SKIPPED';
  httpStatusCode?: number | null;
  durationMs: number;
  requestSnapshot?: {
    method: string;
    url: string;
    headers: Record<string, string>;
    body: any;
  } | null;
  responseSnapshot?: {
    status: number;
    statusText: string;
    headers: Record<string, string>;
    body: any;
    responseTimeMs: number;
  } | null;
  extractedVariables?: Record<string, any> | null;
  assertionResults?: AssertionResult[] | null;
  errorMessage?: string | null;
  createdAt: string;
}

export interface ScenarioFlowExecution {
  id: string;
  flowId: string;
  environmentId?: string | null;
  status: 'RUNNING' | 'SUCCESS' | 'FAILED' | 'CANCELLED';
  triggerSource: string;
  targetMode: 'LIVE' | 'MOCK';
  totalSteps: number;
  passedSteps: number;
  failedSteps: number;
  durationMs: number;
  initialVariables?: Record<string, any> | null;
  finalVariables?: Record<string, any> | null;
  executedBy?: string | null;
  errorSummary?: string | null;
  createdAt: string;
  environment?: {
    id: string;
    name: string;
    environmentType: string;
    baseUrl?: string | null;
  } | null;
  steps?: ScenarioFlowExecutionStep[];
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
  variables?: Record<string, any> | null;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string | null;

  defaultEnvironment?: {
    id: string;
    name: string;
    environmentType: string;
    baseUrl?: string | null;
  } | null;

  steps?: ScenarioFlowStep[];
  executions?: ScenarioFlowExecution[];
}
