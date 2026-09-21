export interface VariableExtractor {
  variable: string;
  from: 'body' | 'headers' | 'status';
  path: string; // e.g. "data.token" or "authorization"
  defaultValue?: string;
}

export interface AssertionRule {
  id?: string;
  type: 'statusCode' | 'bodyPath' | 'header' | 'responseTime';
  path?: string; // for bodyPath (e.g. "data.items[0].id") or header name
  operator: 'equals' | 'notEquals' | 'contains' | 'notContains' | 'exists' | 'notExists' | 'greaterThan' | 'lessThan' | 'in_datasheet';
  expected?: any;
}

export interface AssertionResult {
  rule: AssertionRule;
  passed: boolean;
  actual: any;
  message?: string;
}

export interface ScenarioFlowStepInput {
  id?: string;
  flowId?: string;
  apiId?: string | null;
  requestScenarioId?: string | null;
  stepOrder: number;
  name: string;
  description?: string | null;
  enabled?: boolean;
  delayMs?: number;
  continueOnError?: boolean;
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
}

export interface ScenarioFlowInput {
  id?: string;
  projectId?: string | null;
  name: string;
  description?: string | null;
  status?: boolean;
  defaultEnvironmentId?: string | null;
  stopOnFailure?: boolean;
  variables?: Record<string, any> | null;
}

export interface FlowRunOptions {
  environmentId?: string | null;
  environmentType?: string | null;
  targetMode?: 'LIVE' | 'MOCK';
  initialVariables?: Record<string, any>;
  executedBy?: string;
}

export interface FlowExportTemplate {
  $schema: string;
  version: string;
  exportedAt: string;
  environments?: Array<{
    id?: string;
    name: string;
    environmentType?: 'LOCAL' | 'DEVELOPMENT' | 'STAGING' | 'PRODUCTION' | 'TESTING';
    baseUrl: string;
    isDefault?: boolean;
  }>;
  flow: {
    name: string;
    description?: string | null;
    stopOnFailure: boolean;
    variables?: Record<string, any>;
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
      body?: any;
      bodyType?: string;
    };
    expectedResponseScenario?: {
      name?: string;
      statusCode?: number;
      headers?: Record<string, string>;
      body?: any;
    };
    overrides?: {
      method?: string | null;
      path?: string | null;
      headers?: Record<string, string> | null;
      queryParams?: Record<string, string> | null;
      pathParams?: Record<string, string> | null;
      body?: any;
    };
    extractors?: VariableExtractor[];
    assertions?: AssertionRule[];
  }>;
}
