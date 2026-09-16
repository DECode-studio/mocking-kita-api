export const EXTERNAL_API_DOCS_TEXT = {
  TITLE: 'External Integration API Hub & Playground',
  SUBTITLE: 'Halaman dokumentasi resmi dan area pengujian interaktif (Playground) untuk 8 endpoint REST API eksternal. Digunakan oleh platform lain untuk mengelola APIs, Request Scenarios, Response Scenarios, dan OpenAPI Imports secara terprogram.',
  BADGE_TAG: 'OpenAPI 3.0 Interactive Developer Hub',
  BTN_DOWNLOAD_OPENAPI: 'Download OpenAPI JSON Spec',
  BTN_COPY_POSTMAN_URL: 'Copy Postman Import URL',
  BTN_COPIED_POSTMAN_URL: 'Copied Postman URL!',
  BTN_VIEW_MARKDOWN: 'View Markdown Contract',
  
  // Auth Bar
  AUTH_BAR_TITLE: 'Global JWT Auth Token (Playground)',
  AUTH_BAR_SUBTITLE: 'Token ini akan otomatis terisi saat Anda menguji endpoint /auth/signin di Playground.',
  PLACEHOLDER_AUTH_TOKEN: 'Paste Bearer JWT Token...',
  BTN_CLEAR_TOKEN: 'Clear',

  // Search & Filter
  SEARCH_PLACEHOLDER: 'Search endpoint path or summary...',
  NO_ENDPOINTS_TITLE: 'No matching endpoints found',
  NO_ENDPOINTS_DESC: 'Try adjusting your search query or category filter.',

  // Card Text
  AUTH_REQUIRED_BADGE: 'Auth Required',
  BTN_TEST_ENDPOINT: 'Test Endpoint',
  TAB_REQUEST_CONTRACT: 'Request Contract',
  TAB_RESPONSE_EXAMPLES: 'Response Examples',
  TAB_CURL_COMMAND: 'cURL Command',
  QUERY_PARAMS_HEADER: 'Query Parameters',
  TH_PARAM: 'Parameter',
  TH_TYPE: 'Type',
  TH_REQUIRED: 'Required',
  TH_DESCRIPTION: 'Description',
  LABEL_REQUIRED_YES: 'Yes',
  LABEL_REQUIRED_OPTIONAL: 'Optional',
  SAMPLE_REQUEST_BODY: 'Sample Request Body',
  RESPONSE_PAYLOAD_LABEL: 'Response Payload',
  TERMINAL_CURL_LABEL: 'Terminal cURL Command',
  BTN_COPY_JSON: 'Copy JSON',
  BTN_COPY_CURL: 'Copy cURL',
  BTN_COPIED: 'Copied',

  // Modal Text
  PLAYGROUND_CREDENTIALS_TITLE: 'Authentication Credentials',
  PLAYGROUND_TOKEN_TYPE_BEARER: 'Bearer Token (JWT)',
  PLAYGROUND_TOKEN_TYPE_APIKEY: 'x-api-key',
  LABEL_JWT_TOKEN: 'JWT Access Token:',
  LABEL_API_KEY: 'API Key Header (`x-api-key`):',
  PLACEHOLDER_JWT_TOKEN: 'Paste Bearer JWT Token or click Sign-In to auto-fetch...',
  PLACEHOLDER_API_KEY: 'Enter API key...',
  LABEL_REQUEST_BODY_JSON: 'Request Body (JSON):',
  BTN_SEND_REQUEST: 'Send Request',
  BTN_EXECUTING: 'Executing Request...',
  STATUS_LABEL: 'Status:',
  COPY_OUTPUT_BTN: 'Copy Output',
} as const;
