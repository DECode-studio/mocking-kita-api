/**
 * Mocking Kita Knowledge Base
 * Client-safe compiled knowledge definitions
 */

export interface KnowledgeSection {
  id: string;
  title: string;
  category: 'product' | 'skill' | 'syntax' | 'troubleshooting';
  summary: string;
  content: string;
}

export const MOCKING_KITA_KNOWLEDGE: KnowledgeSection[] = [
  {
    id: 'system-overview',
    title: '01. System Overview & Core Architecture',
    category: 'product',
    summary: 'Arsitektur Next.js App Router, Prisma ORM PostgreSQL, Mock Proxy Engine, Scenario Flow Runner, dan JWT/SSO Auth.',
    content: `
# 1. Ringkasan Sistem Mocking Kita Studio (Mock API Studio)
Mock API Studio adalah platform enterprise internal untuk API Mocking, Scenario Flow Automation, Data Sheets, dan Testing Lifecycle.

## Pilar Utama:
1. **Multi-Project & Matrix Environment**:
   - Struktur hirarki: Project -> Collections -> APIs -> Environments (LOCAL, DEVELOPMENT, TESTING, STAGING, PRODUCTION).
   - Setiap API memiliki path unik per method per project (\`@@unique([projectId, path, methodRequest])\`).
2. **Mock & Proxy Engine**:
   - Mode Mock (Forward Request OFF): Mengembalikan mock response dari RequestScenario yang cocok (berdasarkan status aktif, HTTP method, matching rule, atau header target).
   - Mode Proxy (Forward Request ON): Meneruskan request jaringan ke URL target environment (misal backend service nyata) dengan rewrite header otomatis.
3. **Scenario Flow Engine**:
   - Eksekusi alur tes API berurutan (Steps 1..N) dengan ekstraksi variabel dinamis, assertion rules, auto-delay, stopOnFailure flag, dan matrix environment resolution.
4. **Data Sheets**:
   - Spreadsheet internal (Dataset tabular) untuk data-driven testing. Didukung iterator counter dinamis \`{{datasheet.sheetName.next.columnName}}\` dan \`{{datasheet.sheetName.current.columnName}}\`.
5. **Scenario Flow Jobs**:
   - Background cron scheduler untuk automasi Scenario Flow dengan ekspresi cron standar (\`0 * * * *\`, \`*/5 * * * *\`), limit iterasi, dan alert via Google Chat Webhook.
6. **External API & CI/CD**:
   - Endpoint terproteksi \`/api/v1/external/*\` menggunakan JWT Bearer Token atau API Key (SHA-256 hash).
   - Respon standar format Envelope: \`{ "error": boolean, "code": number, "message": string, "data": any }\`.
7. **Role-Based Access Control (RBAC)**:
   - Superadmin (\`SUPERADMIN\` / role value 1), Admin (\`ADMIN\` / role value 2), User (\`USER\` / role value 3).
`,
  },
  {
    id: 'projects-and-environments',
    title: '02. Project & Environment Management',
    category: 'product',
    summary: 'Hierarki Project, Collection, PIC, dan Matrix Environment (LOCAL, DEVELOPMENT, TESTING, STAGING, PRODUCTION).',
    content: `
# 2. Manajemen Project & Environment
- **Project**: Kontainer utama untuk semua aset API, collections, scenario flows, data sheets, dan matrix environment.
- **PIC (Person In Charge)**: Pengguna yang ditugaskan bertanggung jawab atas project atau API spesifik.
- **Environment Matrix**:
  - Tipe enum: \`LOCAL\`, \`DEVELOPMENT\`, \`TESTING\`, \`STAGING\`, \`PRODUCTION\`.
  - \`values\` JSON menyimpan mapping base URL tiap tipe: \`{ "LOCAL": "http://localhost:3000", "DEVELOPMENT": "https://api-dev.example.com", ... }\`.
  - \`variables\` JSON menyimpan key-value variabel environment per project.
  - Setiap API Environment dapat mengoverride base URL spesifik atau mewarisi default dari project environment.
`,
  },
  {
    id: 'mock-engine-and-proxy',
    title: '03. Mock API & Proxy Engine',
    category: 'product',
    summary: 'Logika matching request scenario, priority order, delay simulasi, forward proxy, dan response generator.',
    content: `
# 3. Mock API Engine & Proxy Forwarding
- **URL Endpoint Mock**: \`/api/mock/:projectId/:path*\`
- **Request Scenario Matching Rules**:
  1. API dicocokkan berdasarkan \`projectId\`, HTTP \`methodRequest\`, dan \`path\` (termasuk path params seperti \`/users/:id\`).
  2. Skenario respons dicocokkan berdasarkan:
     - Header target (misal \`X-Mock-Scenario-Id\` atau \`X-Scenario-Name\`).
     - Matching rule pada Body/Query Params (Equal, Contains, Regex).
     - Jika tidak ada aturan khusus, skenario default yang aktif (\`isDefault: true\`) akan dieksekusi.
- **Delay Simulation**: Skenario dapat menentukan \`delayMs\` untuk mensimulasikan latensi jaringan (misal 500ms, 2000ms).
- **Dynamic Response Body**: Mock response mendukung variabel interpolasi dan dynamic generator seperti \`{{$uuid}}\`, \`{{$timestamp}}\`, \`{{$randomInt}}\`, dsb.
`,
  },
  {
    id: 'scenario-flows',
    title: '04. Scenario Flows & Template Schema',
    category: 'product',
    summary: 'Format Scenario Flow Template v1, dynamic generators, assertions, dan chaining variabel antar step.',
    content: `
# 4. Scenario Flows & Template Schema v1
## Template JSON Header:
\`\`\`json
{
  "$schema": "mock-api-studio/scenario-flow/v1",
  "version": "1.0",
  "exportedAt": "2026-10-08T00:00:00.000Z",
  "environments": [...],
  "flow": {
    "name": "Flow Name",
    "description": "Flow Description",
    "stopOnFailure": true,
    "variables": { "globalVar": "value" }
  },
  "steps": [...]
}
\`\`\`

## Variable Interpolation Syntax:
- **Global / Runtime Flow Variables**: \`{{variableName}}\`
- **Dynamic Built-in Generators**:
  - \`{{$uuid}}\` -> Generate UUID v4 acak (misal \`a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11\`)
  - \`{{$timestamp}}\` -> Unix timestamp detik (misal \`1728370000\`)
  - \`{{$timestampMs}}\` -> Unix timestamp milidetik
  - \`{{$isoDate}}\` -> ISO-8601 string (\`2026-10-08T08:00:00.000Z\`)
  - \`{{$randomInt(min, max)}}\` -> Integer acak antara min dan max
  - \`{{$randomEmail}}\` -> Format email acak
  - \`{{$randomPhone}}\` -> Format nomor telepon acak
- **Data Sheet Iterator**:
  - \`{{datasheet.SheetName.next.ColumnName}}\` -> Mengambil baris berikutnya dari Data Sheet lalu memajukan counter per-step.
  - \`{{datasheet.SheetName.current.ColumnName}}\` -> Mengambil nilai kolom pada baris counter saat ini tanpa memajukannya.
- **Step Variable Extraction & Chaining**:
  - \`extractVariables\` di Step N: \`{ "token": "$.data.token", "userId": "$.data.user.id" }\`.
  - Di Step N+1: Diakses langsung dengan \`{{token}}\` atau \`{{userId}}\`.

## Assertion Rules:
- \`status\`: Status code match (misal 200, 201, 400).
- \`responseTime\`: Batas maksimal waktu respons (misal < 1000ms).
- \`jsonPath\`: Validasi nilai JSON (Equal, NotEqual, Contains, GreaterThan, LessThan, RegexMatch).
`,
  },
  {
    id: 'external-api',
    title: '05. External API & CI/CD Integration',
    category: 'skill',
    summary: 'Endpoint /api/v1/external/*, autentikasi JWT Bearer / API Key, envelope response, dan integrasi pipeline automasi.',
    content: `
# 5. External API & CI/CD Integration
- **Prefix URL**: \`/api/v1/external/...\`
- **Autentikasi**:
  1. Header \`Authorization: Bearer <JWT_TOKEN>\`
  2. Header \`X-API-Key: <MOCK_API_KEY>\`
- **Standard Envelope Response**:
  \`\`\`json
  {
    "error": false,
    "code": 200,
    "message": "Operation successful",
    "data": { ... }
  }
  \`\`\`
- **Operasi Tersedia**:
  - \`GET /api/v1/external/projects\` -> List project & status
  - \`POST /api/v1/external/projects/:id/scenario-flows/:flowId/execute\` -> Memicu eksekusi scenario flow dari CI/CD (GitHub Actions / GitLab CI)
  - \`POST /api/v1/external/apis/upsert\` -> Auto-sync endpoint dari pipeline build
  - \`GET /api/v1/external/executions/:execId/report\` -> Mengambil ringkasan hasil uji flow
`,
  },
  {
    id: 'insomnia-converter',
    title: '06. Insomnia Collection to Scenario Flow Converter',
    category: 'skill',
    summary: 'Aturan parsing Insomnia YAML/JSON v5 ke Scenario Flow Template v1, topological sort, tag {% response ... %}, dan chaining.',
    content: `
# 6. Insomnia Collection to Scenario Flow Converter
- **Input yang didukung**: File Export Insomnia v4 / v5 (YAML atau JSON).
- **Proses Konversi**:
  1. Identifikasi \`_type: "workspace"\`, \`_type: "environment"\`, \`_type: "request_group"\` (Folder), dan \`_type: "request"\`.
  2. Ekstrak base environment dan sub-environments menjadi blok \`environments\` di template.
  3. Konversi Tag Insomnia Chaining:
     - Tag \`{% response 'body', 'req_xxx', 'b64::JC5kYXRhLnRva2Vu::46bf', 'never', 60 %}\`
     - Otomatis diurai menjadi:
       a. Dependency antar request (Step dependency).
       b. Ekstraksi JSONPath (\`$.data.token\`).
       c. Variabel interpolasi di request tujuan (\`{{var_token}}\`).
  4. Lakukan **Topological Sort** pada urutan step agar request produser (misal Login/Auth) dieksekusi sebelum request konsumen (misal GetProfile).
  5. Bentuk output JSON Scenario Flow Template v1 standar yang valid.
`,
  },
  {
    id: 'openapi-parser',
    title: '07. OpenAPI & Swagger Parser',
    category: 'skill',
    summary: 'Spesifikasi Swagger 2.0 dan OpenAPI 3.x, dereferensi $ref & allOf, sample generation, dan matrix environment sync.',
    content: `
# 7. OpenAPI & Swagger Importer
- **Format yang didukung**: Swagger 2.0 JSON/YAML, OpenAPI 3.0.x / 3.1.x JSON/YAML.
- **Fitur Otomasi**:
  1. Dereferensi komponen skema \`$ref\` (misal \`#/components/schemas/UserResponse\`) dan resolusi \`allOf\` (inheritance skema).
  2. Generator contoh payload respons (*Sample JSON Mock Generator*) berdasarkan tipe data (\`string\`, \`integer\`, \`boolean\`, \`array\`, \`format: date-time\`, \`format: email\`, \`format: uuid\`).
  3. Auto-grouping endpoint ke dalam Collection berdasarkan \`tags\` di OpenAPI.
  4. Penggabungan Matrix Environment dari \`servers\` URL di dokumen OpenAPI.
`,
  },
  {
    id: 'data-sheets',
    title: '08. Data Sheets & Tabular Testing',
    category: 'product',
    summary: 'Dataset tabular, import/export CSV & Excel, proxy counter dinamis per-eksekusi, dan integrasi dengan Scenario Flow.',
    content: `
# 8. Data Sheets Engine
- **Fungsi**: Menyediakan dataset tabular (berisi kolom-kolom seperti \`phone\`, \`email\`, \`username\`, \`nik\`, \`amount\`) untuk pengujian berulang (*data-driven testing*).
- **Fitur**:
  - Impor / Ekspor via CSV dan Excel (.xlsx).
  - Skema data kolom fleksibel dengan validasi tipe.
  - Proxy iterator terisolasi per sesi eksekusi scenario flow sehingga tidak terjadi race condition saat multi-eksekusi paralel.
  - Token \`{{datasheet.SheetName.next.columnName}}\` otomatis mengambil baris record selanjutnya untuk setiap iterasi loop.
`,
  },
];

/**
 * Get all combined knowledge as a single formatted context string.
 */
export function getFullKnowledgeContext(): string {
  return MOCKING_KITA_KNOWLEDGE.map((section) => {
    return `=== KNOWLEDGE SECTION: ${section.title} (${section.id}) ===\nSummary: ${section.summary}\n\n${section.content}\n`;
  }).join('\n---\n\n');
}

/**
 * Search relevant knowledge sections by keywords.
 */
export function searchKnowledge(query: string): KnowledgeSection[] {
  const q = query.toLowerCase();
  return MOCKING_KITA_KNOWLEDGE.filter((sec) => {
    return (
      sec.title.toLowerCase().includes(q) ||
      sec.summary.toLowerCase().includes(q) ||
      sec.content.toLowerCase().includes(q)
    );
  });
}
