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
  | 'STAGING'
  | 'PRODUCTION';

export type MatchType =
  | 'EXACT'
  | 'PARTIAL'
  | 'REGEX'
  | 'JSON_SCHEMA';

export type RequestBodyType =
  | 'JSON'
  | 'FORM_DATA'
  | 'URL_ENCODED'
  | 'NONE';

