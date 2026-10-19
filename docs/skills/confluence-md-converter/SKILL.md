---
name: confluence-md-converter
description: Panduan teknis parsing, validasi, dan konversi dokumen spesifikasi API Confluence berbasis Markdown (.md) menjadi entitas database Mock API Studio JSON (ExtractedProjectData) atau OpenAPI 3.0.3 Specification JSON.
---

# Skill: Confluence API Markdown Converter

Skill ini memberikan panduan komprehensif dan alat konversi otomatis bagi AI Agent maupun developer untuk mem-parsing dokumen spesifikasi teknis API yang diekspor dari Confluence (Markdown format `.md`) ke dalam:
1. **Mock API Studio JSON**: Format entitas internal (`ExtractedProjectData`: Collections, APIs, RequestScenarios, ResponseScenarios, Environments) yang siap disimpan ke database.
2. **OpenAPI 3.0.3 Specification JSON**: Standar dokumen OpenAPI / Swagger JSON yang siap diekspor ke Postman, Swagger UI, atau OpenAPI importer lainnya.

---

## 1. Lokasi Berkas & Utilitas Kunci

- **Core Converter (TypeScript)**: [`src/core/parsers/confluence/confluence_md_parser.ts`](file:///Users/gadget/Development/experiment/mock-api-studio/src/core/parsers/confluence/confluence_md_parser.ts)
  - `parseConfluenceMarkdownToProjectData()`: Engine konversi utama di aplikasi Mock API Studio.
- **Database Importer Helper**: [`src/core/db/openapi_storage_helper.ts`](file:///Users/gadget/Development/experiment/mock-api-studio/src/core/db/openapi_storage_helper.ts)
  - `importProjectMarkdown()`: Menyimpan hasil parsing dokumen `.md` ke target project dengan mode `upsert`, `merge`, atau `replace`.
- **Standalone CLI Converter (Python)**: [`docs/skills/confluence-md-converter/convert_confluence.py`](file:///Users/gadget/Development/experiment/mock-api-studio/docs/skills/confluence-md-converter/convert_confluence.py)
  - Script mandiri tanpa dependensi pihak ketiga untuk konversi batch berkas markdown ke JSON Mock Studio atau OpenAPI 3.0.3.
- **Validator Mandiri (Python)**: [`docs/skills/confluence-md-converter/quick_validate.py`](file:///Users/gadget/Development/experiment/mock-api-studio/docs/skills/confluence-md-converter/quick_validate.py)
  - Memverifikasi apakah berkas `.md` memenuhi kriteria validitas minimum sebelum dikonversi.

---

## 2. Minimum Requirement Dokumen Markdown

Agar sebuah dokumen Confluence Markdown dapat diparsing secara valid, dokumen wajib memiliki:

1. **HTTP Method & Path**:
   - Format: `(GET|POST|PUT|PATCH|DELETE)\s+\*{0,2}([^\s\*]+)\*{0,2}`
   - Contoh: `POST **/v1/kpm-wg/submission/change-asset-modal**` atau `GET /v1/products`
2. **Tabel Response Code**:
   - Bagian `### Response Code` yang memuat tabel dengan kolom minimal: `HTTP Code`, `Message`, dan `Custom Code`.
3. **Blok Respons JSON**:
   - Bagian `### Response` yang memuat satu atau lebih blok kode JSON (````json ... ````). Setiap JSON harus valid (`JSON.parse`able).
4. **Payload Request (Kondisional)**:
   - Untuk method `POST`, `PUT`, `PATCH`, blok kode JSON di bawah `### Payload JSON Body` akan dijadikan request body default scenario.

---

## 3. Aturan Ekstraksi & Algoritma Pemetaan

```
Confluence Markdown (.md)
   │
   ├── 1. Unescape Format Confluence:
   │      └── Bersihkan karakter escaping (\-, \_, \*, \[, \]) dan entitas HTML (&nbsp;)
   │
   ├── 2. Ekstraksi Environments:
   │      └── Tabel ### **Environment** (Development, Testing, Staging, Production URL)
   │
   ├── 3. Penentuan Nama Collection (Segment Path Heuristic):
   │      └── Berdasarkan segmen path sebelum segmen action terakhir:
   │          /v1/kpm-wg/submission/change-asset-modal -> 'Submission'
   │          /v1/kpm-wg/kreditmu/detail-perks        -> 'Kreditmu'
   │
   ├── 4. Request Parameters & Body:
   │      ├── ### Headers           -> requestScenario.headers
   │      └── ### Payload JSON Body -> requestScenario.body
   │
   └── 5. Response Scenarios Matching:
          ├── Cocokkan properti 'code' atau 'error_helper.code' dengan tabel Response Code
          │   ├── KPM-WG-000 -> HTTP 200 (Success)
          │   ├── KPM-WG-280 -> HTTP 400 (Validation Error)
          │   ├── KPM-WG-181 -> HTTP 401 (Unauthorized)
          │   ├── KPM-WG-310 -> HTTP 404 (Data Not Found)
          │   └── KPM-WG-999 -> HTTP 500 (Internal Server Error)
          └── Jika terdapat respons ganda untuk status code yang sama, tambahkan penomoran varian:
              '200 - Operasi berhasil dieksekusi (Variant 2)'
```

---

## 4. Panduan bagi AI Agent saat Melakukan Konversi

Ketika pengguna meminta AI mengonversi teks Confluence Markdown menjadi JSON:

### Langkah A: Konversi ke Mock API Studio Format (Internal)
Gunakan struktur objek berikut:
```json
{
  "collections": [
    {
      "id": "uuid",
      "projectId": "target-project-id",
      "name": "Submission",
      "description": "Collection for Submission endpoints",
      "status": true
    }
  ],
  "environments": [
    {
      "id": "uuid",
      "projectId": "target-project-id",
      "name": "Development",
      "isBaseUrl": true,
      "values": { "DEVELOPMENT": "https://dev-api-gateway.kbfinansia.com" },
      "variables": [{ "id": "uuid", "key": "baseUrl", "value": "https://dev-api-gateway.kbfinansia.com", "type": "plain", "enabled": true }],
      "status": true
    }
  ],
  "apis": [
    {
      "id": "uuid",
      "projectId": "target-project-id",
      "collectionId": "collection-uuid",
      "name": "Change Asset Modal",
      "description": "Change Asset Modal",
      "path": "/v1/kpm-wg/submission/change-asset-modal",
      "methodRequest": "POST",
      "status": true
    }
  ],
  "requestScenarios": [
    {
      "id": "uuid",
      "apiId": "api-uuid",
      "name": "Default Scenario",
      "description": "Request scenario for Change Asset Modal",
      "headers": { "ApiKey": "CLIENT KEY APIGEE", "Authorization": "JWT TOKEN FROM KPM" },
      "body": { "order_id": "NWG-1042623072600025", "device_code": "aaaa" },
      "bodyType": "JSON",
      "matchType": "EXACT",
      "priority": 0,
      "status": true
    }
  ],
  "responseScenarios": [
    {
      "id": "uuid",
      "requestScenarioId": "request-scenario-uuid",
      "name": "200 - Operasi berhasil dieksekusi (KPM-WG-000)",
      "statusCode": 200,
      "headers": { "Content-Type": "application/json" },
      "body": { "code": "KPM-WG-000", "message": "operasi berhasil dieksekusi", "data": {} },
      "responseType": "JSON",
      "priority": 0,
      "status": true
    }
  ]
}
```

### Langkah B: Konversi ke OpenAPI 3.0.3 Specification
Petakan dokumen ke struktur OpenAPI 3.0.3 standar:
```json
{
  "openapi": "3.0.3",
  "info": {
    "title": "API Specification Name",
    "version": "1.0.0"
  },
  "servers": [
    { "url": "https://dev-api-gateway.kbfinansia.com", "description": "Development" }
  ],
  "paths": {
    "/v1/kpm-wg/submission/change-asset-modal": {
      "post": {
        "tags": ["Submission"],
        "summary": "Change Asset Modal",
        "parameters": [
          { "name": "Authorization", "in": "header", "required": true, "schema": { "type": "string" } }
        ],
        "requestBody": {
          "required": true,
          "content": {
            "application/json": {
              "example": { "order_id": "NWG-1042623072600025", "device_code": "aaaa" }
            }
          }
        },
        "responses": {
          "200": {
            "description": "200 - Operasi berhasil dieksekusi (KPM-WG-000)",
            "content": {
              "application/json": {
                "examples": {
                  "example_1": { "value": { "code": "KPM-WG-000", "message": "operasi berhasil dieksekusi" } }
                }
              }
            }
          }
        }
      }
    }
  }
}
```

---

## 5. Menjalankan CLI Tools

### Validasi Berkas:
```bash
python3 docs/skills/confluence-md-converter/quick_validate.py .extra/confluence
```

### Konversi ke Format Mock API Studio JSON:
```bash
python3 docs/skills/confluence-md-converter/convert_confluence.py .extra/confluence -f studio -o output-studio.json
```

### Konversi ke Standar OpenAPI 3.0.3 JSON:
```bash
python3 docs/skills/confluence-md-converter/convert_confluence.py .extra/confluence -f openapi -o output-openapi.json
```

