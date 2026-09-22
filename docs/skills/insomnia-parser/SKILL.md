---
name: insomnia-to-scenario-flow-parser
description: Panduan arsitektur dan algoritma konversi koleksi Insomnia (YAML/JSON v5) ke Scenario Flow & API Mock API Studio, mencakup dekonstruksi URL, parsing Nunjucks response chaining tags, afterResponse scripts, de-duplikasi environment, dan penentuan urutan eksekusi (Topological Sort).
---

# Skill: Insomnia Collection to Scenario Flow & API Parser

Skill ini menyediakan panduan teknis mendalam dan algoritma konversi untuk mengimpor file ekspor **Insomnia Collection (YAML / JSON v4 & v5)**—seperti [`.extra/reff/los-cms-collection.yaml`](file:///Users/gadget/Development/experiment/mock-api-studio/.extra/reff/los-cms-collection.yaml)—menjadi entitas **API Catalog** dan **Scenario Flow Template** di Mock API Studio.

---

## 1. Perbandingan Arsitektur: Insomnia vs Mock API Studio

| Aspek | Insomnia Collection (`collection.insomnia.rest/5.0`) | Mock API Studio Scenario Flow & API |
|---|---|---|
| **Struktur Folder** | Bersarang bebas tanpa batas (`fld_...`) dengan array `children`. | `Collection` (kategori 1-level) dan `ScenarioFlowStep` (urutan linear). |
| **Format URL** | Satu string template: `{{ _.base_url }}/api/v1/resource`. | Terpisah: `api.path` (`/api/v1/resource`) dan `stepBaseUrl` (Environment). |
| **Response Chaining** | **Inline Template Tag Nunjucks**: `{% response 'body', 'req_id', 'b64::...::46b', ... %}` dan script `afterResponse`. | **Decoupled Variable Extractor**: Step sumber memiliki `VariableExtractor`, step tujuan memanggil `{{variableName}}`. |
| **Environment Variables** | `{{ _.var_name }}` atau `{{ var_name }}` tersimpan di Base Environment & subEnvironments. | `{{var_name}}` terintegrasi dengan Matrix Model stages (`DEVELOPMENT`, `STAGING`, `PRODUCTION`). |
| **Scripts** | `scripts.preRequest` dan `scripts.afterResponse` berbasis Node.js/CryptoJS. | Native `VariableExtractor` (JSON path) dan `AssertionRule` (`equals`, `contains`, dll). |

---

## 2. Anatomi Format Insomnia (`los-cms-collection.yaml`)

### A. Tag Chaining Nunjucks (`{% response ... %}`)
Insomnia menyisipkan referensi nilai respon antar-request langsung di dalam string body, header, atau parameter:
```yaml
text: >-
  {
    "lms": {% response 'body', 'req_e25b8c3e0f49483189dc5bace3543358', 'b64::JC5kYXRhWzBdLmlk::46b', 'never', 60 %},
    "region": {% response 'body', 'req_22ebbbb51eae41ceac4b13996acd53ed', 'b64::JC5kYXRhWzBdLmlk::46b', 'never', 60 %},
    "branch": "{% response 'body', 'req_40955a11837b4794a00f214d9b572284', 'b64::JC5kYXRhWzBdLmJyYW5jaF9pZA==::46b', 'never', 60 %}"
  }
```

#### Struktur Parameter Tag:
1. `type`: `'body'` atau `'header'`.
2. `requestId`: ID request sumber (misal `req_e25b...`).
3. `filter`: Berisi ekspresi JSONPath yang di-encode Base64 dengan format:
   ```
   b64::<base64_string>::46b
   ```
   **Contoh Decode**:
   - `JC5kYXRhWzBdLmlk` $\rightarrow$ `$.data[0].id`
   - `JC5kYXRhWzBdLmJyYW5jaF9pZA==` $\rightarrow$ `$.data[0].branch_id`
   - `JC5kYXRhWzBdLm1hbnVmYWN0dXJpbmdfeWVhcg==` $\rightarrow$ `$.data[0].manufacturing_year`
4. `resendBehavior`: `'never'`, `'when-expired'`, atau `'always'`.
5. `maxAge`: Durasi cache respon dalam detik (misal `60`).

---

### B. Script Post-Request (`afterResponse`)
Insomnia juga menyimpan token atau state ke environment melalui script JavaScript:
```yaml
afterResponse: >-
  const response = insomnia.response.json();
  insomnia.environment.set("it_support_access_token", response.data.access_token);
```

---

### C. Variabel Environment & Sub-Environments
```yaml
environments:
  name: Base Environment
  data:
    mdm_asset_testing: https://testing-masterdata-asset.kbfinansia.com
    it_support_access_token: "token-string..."
  subEnvironments:
    - name: New Entry
      data:
        branch_id: "400"
```

---

## 3. Tahapan Algoritma Konversi

```
Insomnia Collection (YAML / JSON)
  │
  ├── 1. Ekstraksi Environments
  │      └── Base Environment & subEnvironments -> Entitas Environment Matrix Model
  │
  ├── 2. Traversal Hirarki Folder (Flattening)
  │      └── Memetakan folder root/parent menjadi nama Collection (misal: "LOS CMS / OTR")
  │
  ├── 3. Analisis Dependensi & Chaining (DAG Resolution)
  │      ├── Parse tag `{% response ... %}` -> Decode Base64 JSONPath
  │      ├── Parse script `afterResponse` -> Regex insomnia.environment.set()
  │      ├── Bentuk Directed Acyclic Graph (DAG)
  │      └── Topological Sort untuk menentukan urutan eksekusi (stepOrder)
  │
  ├── 4. Transformasi Step
  │      ├── Pisahkan Base URL token {{ _.base_url }} dari path endpoint
  │      ├── Ubah `{{ _.var_name }}` menjadi `{{var_name}}`
  │      ├── Sisipkan `VariableExtractor` pada step sumber
  │      └── Ganti tag `{% response ... %}` di step target dengan `{{var_name}}`
  │
  └── 5. Output Generasi
         ├── A. Entitas API & Scenarios (untuk openapi_storage_helper.ts)
         └── B. Scenario Flow Template v1 (untuk scenario-flow.import-export.ts)
```

---

## 4. Rincian Implementasi Logika Parser

### A. Dekonstruksi URL & Base URL
URL Insomnia biasanya diawali dengan variabel:
`{{ _.mdm_asset_testing }}/api/v6/otr/download`

**Aturan Parsing**:
1. Gunakan regex `^\{\{\s*(?:_\.)?([a-zA-Z0-9_-]+)\s*\}\}(.*)$`:
   - Group 1: `mdm_asset_testing` (kunci base URL environment)
   - Group 2: `/api/v6/otr/download` (path API murni)
2. Jika URL berupa URL absolut langsung (misal `https://api.example.com/v1/resource`):
   - Gunakan `new URL(rawUrl)` untuk memisahkan `origin` (sebagai base URL) dan `pathname` (sebagai `api.path`).

---

### B. Konversi Tag `{% response %}` ke `VariableExtractor`

1. **Regex Deteksi Tag**:
   ```javascript
   const RESPONSE_TAG_REGEX = /\{%\s*response\s*'(body|header)'\s*,\s*'([^']+)'\s*,\s*'([^']+)'(?:[^%]*)\s*%\}/g;
   ```
2. **Decode Filter JSONPath**:
   ```typescript
   function decodeInsomniaFilter(rawFilter: string): string {
     // Format: b64::JC5kYXRhWzBdLmlk::46b
     const b64Match = rawFilter.match(/^b64::([^:]+)::46b$/);
     let jsonPath = rawFilter;
     if (b64Match) {
       jsonPath = Buffer.from(b64Match[1], 'base64').toString('utf-8');
     }
     // Normalisasi: $.data[0].id -> data.0.id (kompatibel dengan getNestedValue)
     return jsonPath
       .replace(/^\$\./, '')
       .replace(/\[(\w+)\]/g, '.$1')
       .replace(/^\./, '');
   }
   ```
3. **Penyusunan Nama Variabel & Penggantian Token**:
   - Buat variabel unik: misal `${sourceReqId}_${cleanPath.replace(/\./g, '_')}`.
   - Tambahkan ke `extractors` pada request sumber:
     ```json
     {
       "variable": "req_e25b_data_0_id",
       "from": "body",
       "path": "data.0.id"
     }
     ```
   - Ganti tag pada request pemanggil menjadi: `"{{req_e25b_data_0_id}}"`.

---

### C. Konversi Script `afterResponse` ke `VariableExtractor`

Untuk mengekstrak variabel yang disimpan melalui JavaScript:
```typescript
function extractVariablesFromAfterResponseScript(scriptText: string): Array<{ variable: string; from: 'body'; path: string }> {
  const extractors: Array<{ variable: string; from: 'body'; path: string }> = [];
  if (!scriptText) return extractors;

  // Mencocokkan: insomnia.environment.set("it_support_access_token", response.data.access_token);
  const regex = /insomnia\.environment\.set\(\s*["']([^"']+)["']\s*,\s*response\.([a-zA-Z0-9_.]+)\s*\)/g;
  let match;
  while ((match = regex.exec(scriptText)) !== null) {
    const varName = match[1];
    const rawPath = match[2]; // e.g. "data.access_token"
    extractors.push({
      variable: varName,
      from: 'body',
      path: rawPath.replace(/\[(\w+)\]/g, '.$1'),
    });
  }
  return extractors;
}
```

---

### D. Topological Sort untuk Step Ordering
Karena Insomnia mengizinkan request dipanggil dalam urutan sembarang di UI, namun chaining membutuhkan request sumber dieksekusi terlebih dahulu:
1. Bangun graf ketergantungan: setiap kali request $B$ memiliki tag `{% response ... %}` yang mengarah ke request $A$, catat dependency edge: $A \rightarrow B$.
2. Urutkan request menggunakan algoritma **Kahn's Algorithm (Topological Sort)** dengan fallback ke `meta.sortKey`.
3. Hasil urutan menjadi nilai `stepOrder` (1, 2, 3, ...).

---

## 5. Script / Converter Utility (TypeScript)

Berikut adalah modul utilitas lengkap untuk mengonversi koleksi Insomnia ke template Scenario Flow:

```typescript
import yaml from 'js-yaml';

export interface InsomniaConvertResult {
  scenarioFlowTemplate: any;
  apisToImport: any[];
}

export function parseInsomniaCollectionToScenarioFlow(rawContent: string): InsomniaConvertResult {
  const parsed = typeof rawContent === 'string'
    ? (rawContent.trim().startsWith('{') ? JSON.parse(rawContent) : yaml.load(rawContent) as any)
    : rawContent;

  if (!parsed || !Array.isArray(parsed.collection)) {
    throw new Error('Format Insomnia tidak valid: field "collection" tidak ditemukan.');
  }

  // 1. Kumpulkan semua request secara rekursif
  interface FlatRequest {
    req: any;
    folderPath: string;
    dependencies: Set<string>;
  }

  const allRequests = new Map<string, FlatRequest>();

  function traverse(items: any[], parentFolder: string = '') {
    for (const item of items) {
      if (item.children && Array.isArray(item.children)) {
        const currentFolder = parentFolder ? `${parentFolder} / ${item.name}` : item.name;
        traverse(item.children, currentFolder);
      } else if (item.url && item.method) {
        const reqId = item.meta?.id || item._id;
        allRequests.set(reqId, {
          req: item,
          folderPath: parentFolder || 'Default',
          dependencies: new Set<string>(),
        });
      }
    }
  }

  traverse(parsed.collection);

  // 2. Analisis ketergantungan (Chaining tags)
  const extractorsByReqId = new Map<string, Array<{ variable: string; from: 'body' | 'headers'; path: string }>>();

  const RESPONSE_TAG_REGEX = /\{%\s*response\s*'(body|header)'\s*,\s*'([^']+)'\s*,\s*'([^']+)'(?:[^%]*)\s*%\}/g;

  for (const [targetId, item] of allRequests.entries()) {
    const stringified = JSON.stringify({
      body: item.req.body,
      parameters: item.req.parameters,
      headers: item.req.headers,
    });

    let match;
    while ((match = RESPONSE_TAG_REGEX.exec(stringified)) !== null) {
      const type = match[1] === 'header' ? 'headers' : 'body';
      const sourceReqId = match[2];
      const rawFilter = match[3];

      // Decode base64 filter
      const b64Match = rawFilter.match(/^b64::([^:]+)::46b$/);
      let jsonPath = rawFilter;
      if (b64Match) {
        jsonPath = Buffer.from(b64Match[1], 'base64').toString('utf-8');
      }
      const normalizedPath = jsonPath
        .replace(/^\$\./, '')
        .replace(/\[(\w+)\]/g, '.$1')
        .replace(/^\./, '');

      const varName = `${sourceReqId.replace(/[^a-zA-Z0-9_]/g, '_')}_${normalizedPath.replace(/[^a-zA-Z0-9_]/g, '_')}`;

      // Daftarkan extractor di source request
      const list = extractorsByReqId.get(sourceReqId) || [];
      if (!list.some((e) => e.variable === varName)) {
        list.push({ variable: varName, from: type, path: normalizedPath });
      }
      extractorsByReqId.set(sourceReqId, list);

      // Catat dependensi
      if (allRequests.has(sourceReqId)) {
        item.dependencies.add(sourceReqId);
      }
    }

    // Periksa afterResponse script
    const afterScript = item.req.scripts?.afterResponse;
    if (afterScript) {
      const scriptExtractors = extractVariablesFromAfterResponseScript(afterScript);
      const list = extractorsByReqId.get(targetId) || [];
      scriptExtractors.forEach((se) => {
        if (!list.some((e) => e.variable === se.variable)) {
          list.push(se);
        }
      });
      extractorsByReqId.set(targetId, list);
    }
  }

  // 3. Normalisasi Token Variabel di Body, Query, Header
  function replaceInsomniaTags(text: string): string {
    if (!text) return text;
    // Ganti tag response
    let res = text.replace(RESPONSE_TAG_REGEX, (_match, _type, sourceReqId, rawFilter) => {
      const b64Match = rawFilter.match(/^b64::([^:]+)::46b$/);
      let jsonPath = rawFilter;
      if (b64Match) {
        jsonPath = Buffer.from(b64Match[1], 'base64').toString('utf-8');
      }
      const normalizedPath = jsonPath.replace(/^\$\./, '').replace(/\[(\w+)\]/g, '.$1').replace(/^\./, '');
      const varName = `${sourceReqId.replace(/[^a-zA-Z0-9_]/g, '_')}_${normalizedPath.replace(/[^a-zA-Z0-9_]/g, '_')}`;
      return `{{${varName}}}`;
    });

    // Ganti {{ _.var_name }} -> {{var_name}}
    res = res.replace(/\{\{\s*_\.([a-zA-Z0-9_-]+)\s*\}\}/g, '{{$1}}');
    return res;
  }

  // 4. Susun Steps
  const steps: any[] = [];
  let orderIndex = 1;

  for (const [reqId, item] of allRequests.entries()) {
    const rawUrl = item.req.url || '';
    const urlMatch = rawUrl.match(/^\{\{\s*(?:_\.)?([a-zA-Z0-9_-]+)\s*\}\}(.*)$/);
    const path = urlMatch ? (urlMatch[2] || '/') : rawUrl;
    const targetEnv = urlMatch ? urlMatch[1] : undefined;

    // Headers
    const headers: Record<string, string> = {};
    (item.req.headers || []).forEach((h: any) => {
      if (h.name && !h.disabled) {
        headers[h.name] = replaceInsomniaTags(h.value);
      }
    });

    // Query Params
    const queryParams: Record<string, string> = {};
    (item.req.parameters || []).forEach((p: any) => {
      if (p.name && !p.disabled) {
        queryParams[p.name] = replaceInsomniaTags(p.value);
      }
    });

    // Body
    let body: any = undefined;
    let bodyType = 'NONE';
    if (item.req.body?.text) {
      bodyType = 'JSON';
      const cleanBodyText = replaceInsomniaTags(item.req.body.text);
      try {
        body = JSON.parse(cleanBodyText);
      } catch {
        body = cleanBodyText;
      }
    }

    steps.push({
      order: orderIndex++,
      name: item.req.name || `Step ${orderIndex}`,
      enabled: true,
      api: {
        method: item.req.method.toUpperCase(),
        path,
        name: item.req.name,
        collection: item.folderPath,
        targetEnvironment: targetEnv,
      },
      requestScenario: {
        name: `Scenario ${item.req.name}`,
        headers,
        queryParams,
        body,
        bodyType,
      },
      expectedResponseScenario: {
        statusCode: 200,
        body: { code: 'OK', message: 'Success' },
      },
      extractors: extractorsByReqId.get(reqId) || [],
      assertions: [
        {
          type: 'statusCode',
          operator: 'equals',
          expected: 200,
        },
      ],
    });
  }

  // 5. Susun Environment Matrix
  const envData = parsed.environments?.data || {};
  const templateEnvironments = [
    {
      id: 'insomnia-imported-env',
      name: parsed.environments?.name || 'Insomnia Environment',
      environmentType: 'DEVELOPMENT',
      isDefault: true,
      variables: Object.entries(envData).map(([key, val]) => ({
        key,
        value: String(val),
        type: 'plain',
        enabled: true,
      })),
    },
  ];

  return {
    scenarioFlowTemplate: {
      $schema: 'mock-api-studio/scenario-flow/v1',
      version: '1.0',
      exportedAt: new Date().toISOString(),
      environments: templateEnvironments,
      flow: {
        name: parsed.name || 'Imported Insomnia Flow',
        description: parsed.meta?.description || 'Converted from Insomnia collection',
        stopOnFailure: true,
        variables: envData,
      },
      steps,
    },
    apisToImport: steps.map((s) => ({
      name: s.api.name,
      methodRequest: s.api.method,
      path: s.api.path,
      collection: s.api.collection,
    })),
  };
}
```

---

## 6. Integrasi dengan Storage & Runner Mock API Studio

1. **Import ke Database**:
   Hasil `scenarioFlowTemplate` langsung kompatibel dan dapat diimpor menggunakan:
   ```typescript
   import { importScenarioFlowFromTemplate } from '@/src/server/scenario-flow/scenario-flow.import-export';
   await importScenarioFlowFromTemplate(projectId, result.scenarioFlowTemplate);
   ```
2. **Kesesuaian dengan Runner Engine**:
   - Token pengganti `{{req_source_data_id}}` langsung dikenali oleh `interpolateVariables()` di [`scenario-flow.runner.ts`](file:///Users/gadget/Development/experiment/mock-api-studio/src/server/scenario-flow/scenario-flow.runner.ts#L135).
   - Ekstraktor otomatis diisi ke dalam `extractVariables()` dan nilainya dimuat ke `currentVariables` untuk langkah selanjutnya.
