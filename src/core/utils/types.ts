export type MethodRequest =
  | 'GET'
  | 'POST'
  | 'PUT'
  | 'PATCH'
  | 'DELETE'
  | 'OPTIONS'
  | 'HEAD';

export type EnvironmentType =
  | 'LOCAL'
  | 'DEVELOPMENT'
  | 'TESTING'
  | 'STAGING'
  | 'PRODUCTION';

export type MatchType =
  | 'EXACT'
  | 'PARTIAL'
  | 'REGEX'
  | 'JSON_SCHEMA';

export type ParamMatchOperator =
  | 'equal'
  | 'regex'
  | 'null'
  | 'empty_array'
  | 'in_datasheet';

export type MatchStrategy = 'ALL' | 'ANY';

export type ParamRule = {
  operator: ParamMatchOperator;
  value?: unknown;
  enabled?: boolean;
};

export type BodyPathRule = {
  id?: string;
  path: string;
  operator: ParamMatchOperator;
  value?: unknown;
  enabled: boolean;
};

export type PathSuggestion = {
  path: string;
  sampleValue?: unknown;
};

export type RequestBodyType =
  | 'JSON'
  | 'FORM_DATA'
  | 'URL_ENCODED'
  | 'NONE';



