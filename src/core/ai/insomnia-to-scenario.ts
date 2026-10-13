/**
 * Insomnia Collection to Mocking Kita Scenario Flow Template Converter
 * Converts Insomnia YAML / JSON export files (v4/v5) into Scenario Flow Template v1
 */

import YAML from 'yaml';

export interface InsomniaConvertResult {
  success: boolean;
  template?: Record<string, any>;
  summary?: {
    flowName: string;
    totalSteps: number;
    environmentsExtracted: number;
    variablesFound: string[];
    chainingTagsFound: number;
  };
  warnings?: string[];
  error?: string;
}

export function convertInsomniaToScenarioFlow(rawContent: string): InsomniaConvertResult {
  const warnings: string[] = [];
  let data: any = null;

  try {
    const trimmed = rawContent.trim();
    if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
      data = JSON.parse(trimmed);
    } else {
      data = YAML.parse(trimmed);
    }
  } catch (err: any) {
    return {
      success: false,
      error: `Gagal membaca format Insomnia (bukan JSON/YAML yang valid): ${err.message}`,
    };
  }

  if (!data || typeof data !== 'object') {
    return { success: false, error: 'Konten file Insomnia kosong atau tidak valid.' };
  }

  const resources: any[] = Array.isArray(data.resources) ? data.resources : [];
  if (resources.length === 0) {
    return { success: false, error: 'Tidak ditemukan resources pada file Insomnia ini.' };
  }

  // 1. Identify Workspace & Meta
  const workspace = resources.find((r) => r._type === 'workspace') || { name: 'Converted Insomnia Flow' };
  const flowName = workspace.name || 'Converted Insomnia Scenario Flow';

  // 2. Identify Environments
  const baseEnv = resources.find((r) => r._type === 'environment' && !r.parentId?.startsWith('env_')) || null;
  const subEnvs = resources.filter((r) => r._type === 'environment' && r.parentId?.startsWith('env_'));

  const environments: any[] = [];
  const globalVariables: Record<string, any> = {};

  if (baseEnv && typeof baseEnv.data === 'object') {
    Object.assign(globalVariables, baseEnv.data);
  }

  // Build standard environments
  const defaultEnvId = 'gateway-dev';
  environments.push({
    id: defaultEnvId,
    name: baseEnv?.name || 'Default Environment',
    environmentType: 'DEVELOPMENT',
    values: {
      LOCAL: null,
      DEVELOPMENT: globalVariables.baseUrl || globalVariables.base_url || 'https://api-dev.example.com',
      TESTING: null,
      STAGING: null,
      PRODUCTION: null,
    },
    baseUrl: globalVariables.baseUrl || globalVariables.base_url || 'https://api-dev.example.com',
    variables: Object.entries(globalVariables).map(([key, val]) => ({
      key,
      value: String(val),
    })),
    isDefault: true,
  });

  for (const sub of subEnvs) {
    const subValues = typeof sub.data === 'object' ? sub.data : {};
    environments.push({
      id: `env-${sub._id || Math.random().toString(36).substring(2, 8)}`,
      name: sub.name || 'Sub Environment',
      environmentType: 'TESTING',
      values: {
        LOCAL: null,
        DEVELOPMENT: null,
        TESTING: subValues.baseUrl || subValues.base_url || 'https://api-test.example.com',
        STAGING: null,
        PRODUCTION: null,
      },
      baseUrl: subValues.baseUrl || subValues.base_url || 'https://api-test.example.com',
      variables: Object.entries(subValues).map(([key, val]) => ({
        key,
        value: String(val),
      })),
      isDefault: false,
    });
  }

  // 3. Extract Folders (Request Groups)
  const folderMap = new Map<string, string>();
  for (const r of resources) {
    if (r._type === 'request_group') {
      folderMap.set(r._id, r.name || 'General');
    }
  }

  // 4. Extract Requests
  const rawRequests = resources.filter((r) => r._type === 'request');
  if (rawRequests.length === 0) {
    return { success: false, error: 'Tidak ditemukan HTTP Request di dalam file Insomnia ini.' };
  }

  let chainingTagsFound = 0;
  const variablesFoundSet = new Set<string>();

  // Map request dependencies for topological sorting
  interface StepNode {
    id: string;
    insomniaId: string;
    order: number;
    name: string;
    method: string;
    path: string;
    collection: string;
    headers: Record<string, string>;
    body: any;
    bodyType: string;
    queryParams: Record<string, string>;
    dependsOn: string[]; // IDs of other requests
    extractVariables: Record<string, string>;
    raw: any;
  }

  const nodes: StepNode[] = [];
  const reqIdToNodeMap = new Map<string, StepNode>();

  for (let i = 0; i < rawRequests.length; i++) {
    const req = rawRequests[i];
    const collectionName = req.parentId && folderMap.has(req.parentId) ? folderMap.get(req.parentId)! : 'General';

    // Parse URL & Path
    let rawUrl = String(req.url || '/');
    let parsedPath = rawUrl;
    try {
      if (rawUrl.startsWith('http://') || rawUrl.startsWith('https://')) {
        const u = new URL(rawUrl);
        parsedPath = u.pathname;
      } else if (rawUrl.startsWith('{{')) {
        // e.g. {{baseUrl}}/v1/users
        parsedPath = rawUrl.replace(/^\{\{[^}]+\}\}/, '');
        if (!parsedPath.startsWith('/')) parsedPath = '/' + parsedPath;
      }
    } catch {
      // keep parsedPath as is
    }

    // Convert Headers
    const headers: Record<string, string> = {};
    if (Array.isArray(req.headers)) {
      for (const h of req.headers) {
        if (h.name && h.value && !h.disabled) {
          headers[h.name] = h.value;
        }
      }
    }

    // Convert Query Parameters
    const queryParams: Record<string, string> = {};
    if (Array.isArray(req.parameters)) {
      for (const p of req.parameters) {
        if (p.name && !p.disabled) {
          queryParams[p.name] = p.value || '';
        }
      }
    }

    // Convert Body
    let body: any = null;
    let bodyType = 'NONE';
    if (req.body && req.body.text) {
      bodyType = 'JSON';
      try {
        body = JSON.parse(req.body.text);
      } catch {
        body = req.body.text;
      }
    }

    // Detect Insomnia Chaining Tags: {% response 'body', 'req_xxx', 'b64::...::46bf', ... %}
    const bodyStr = typeof body === 'object' ? JSON.stringify(body) : String(body || '');
    const headersStr = JSON.stringify(headers);
    const combinedStr = bodyStr + ' ' + headersStr + ' ' + rawUrl;

    const dependsOn: string[] = [];
    const chainingRegex = /\{%\s*response\s*'([^']+)'\s*,\s*'([^']+)'\s*,\s*'([^']+)'/g;
    let match: RegExpExecArray | null;

    while ((match = chainingRegex.exec(combinedStr)) !== null) {
      chainingTagsFound++;
      const sourceReqId = match[2];
      const encodedPath = match[3];

      dependsOn.push(sourceReqId);

      // Try decode b64 JSONPath if available
      let jsonPath = '$.data';
      if (encodedPath.startsWith('b64::')) {
        try {
          const parts = encodedPath.split('::');
          if (parts[1]) {
            jsonPath = Buffer.from(parts[1], 'base64').toString('utf-8');
          }
        } catch {
          // ignore
        }
      }

      // Track variable name
      const cleanVarName = `var_${sourceReqId.replace(/[^a-zA-Z0-9]/g, '_')}_${Math.random().toString(36).substring(2, 6)}`;
      variablesFoundSet.add(cleanVarName);
    }

    // Match standard {{var}} variables
    const varMatches = combinedStr.match(/\{\{([a-zA-Z0-9_$.-]+)\}\}/g);
    if (varMatches) {
      for (const vm of varMatches) {
        const v = vm.replace(/[{}]/g, '').trim();
        if (!v.startsWith('$') && !v.startsWith('datasheet.')) {
          variablesFoundSet.add(v);
        }
      }
    }

    const node: StepNode = {
      id: req._id || `step_${i + 1}`,
      insomniaId: req._id,
      order: i + 1,
      name: req.name || `Request ${i + 1}`,
      method: (req.method || 'GET').toUpperCase(),
      path: parsedPath || '/',
      collection: collectionName,
      headers,
      body,
      bodyType,
      queryParams,
      dependsOn,
      extractVariables: {},
      raw: req,
    };

    nodes.push(node);
    reqIdToNodeMap.set(req._id, node);
  }

  // 5. Populate extractVariables for producer steps based on chaining
  for (const node of nodes) {
    for (const depReqId of node.dependsOn) {
      const producerNode = reqIdToNodeMap.get(depReqId);
      if (producerNode) {
        const varName = `step_${producerNode.order}_token`;
        producerNode.extractVariables[varName] = '$.data.token';
        variablesFoundSet.add(varName);
      }
    }
  }

  // 6. Build Final Steps Array
  const steps = nodes.map((n, idx) => ({
    order: idx + 1,
    name: n.name,
    enabled: true,
    delayMs: 0,
    continueOnError: false,
    api: {
      method: n.method,
      path: n.path,
      name: n.name,
      collection: n.collection,
      targetEnvironment: defaultEnvId,
      environmentIds: [defaultEnvId],
      targetEnvironmentType: 'DEVELOPMENT',
    },
    requestScenario: {
      name: `${n.name} (Auto Imported)`,
      headers: Object.keys(n.headers).length > 0 ? n.headers : { 'Content-Type': 'application/json' },
      body: n.body,
      bodyType: n.bodyType,
      queryParams: Object.keys(n.queryParams).length > 0 ? n.queryParams : undefined,
    },
    overrides: {
      headers: null,
      queryParams: null,
      pathParams: null,
      body: null,
      bodyType: n.bodyType,
    },
    expectedResponseScenario: {
      statusCode: 200,
      body: {
        code: 'OK',
        message: 'Mock response generated from Insomnia import',
      },
    },
    extractVariables: Object.keys(n.extractVariables).length > 0 ? n.extractVariables : undefined,
    assertions: [
      {
        id: `ast_${idx + 1}`,
        type: 'STATUS_CODE',
        property: 'status',
        operator: 'EQUALS',
        expectedValue: '200',
        message: `Step ${idx + 1} (${n.name}) harus return HTTP 200`,
      },
    ],
  }));

  // 7. Compose Scenario Flow Template v1
  const template = {
    $schema: 'mock-api-studio/scenario-flow/v1',
    version: '1.0',
    exportedAt: new Date().toISOString(),
    environments,
    flow: {
      name: flowName,
      description: `Scenario Flow hasil konversi otomatis dari koleksi Insomnia "${flowName}"`,
      stopOnFailure: true,
      variables: globalVariables,
    },
    steps,
  };

  return {
    success: true,
    template,
    summary: {
      flowName,
      totalSteps: steps.length,
      environmentsExtracted: environments.length,
      variablesFound: Array.from(variablesFoundSet),
      chainingTagsFound,
    },
    warnings: warnings.length > 0 ? warnings : undefined,
  };
}
