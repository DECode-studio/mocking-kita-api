---
name: openapi-json-parser
description: Panduan teknis parsing, validasi, konversi, dereferensi schema ($ref/allOf), dan sinkronisasi spesifikasi Swagger 2.0 / OpenAPI 3.x JSON ke entitas database Mock API Studio.
---

# Skill: OpenAPI & Swagger JSON Parser

Skill ini menguraikan arsitektur dan algoritma internal yang digunakan Mock API Studio untuk melakukan **parsing, konversi, dereferencing skema, dan ingesti data dari dokumen spesifikasi Swagger 2.0 dan OpenAPI 3.x JSON**.

---

## 1. Lokasi Kode Kunci

- **Core Converter**: [`src/core/openapi/openapi_converter.ts`](file:///Users/gadget/Development/experiment/mock-api-studio/src/core/openapi/openapi_converter.ts)
  - `parseOpenApiSpecToProjectData()`: Mengonversi OpenAPI JSON menjadi entitas project internal.
  - `exportProjectToOpenApiSpec()`: Mengekspor entitas internal menjadi OpenAPI 3.0.3 JSON.
  - `sanitizeImportedPath()`: Membersihkan format URL host dan path token.
  - `resolveRef()` & `resolveSchema()`: Dereferensi skema `$ref` dan penggabungan `allOf`.
  - `generateSampleFromSchema()`: Generator contoh data otomatis dari JSON Schema.
- **DB Storage & Ingestion Helper**: [`src/core/db/openapi_storage_helper.ts`](file:///Users/gadget/Development/experiment/mock-api-studio/src/core/db/openapi_storage_helper.ts)
  - `importProjectOpenApi()`: Menangani transaksi database berdasarkan mode import (`upsert`, `merge`, `replace`).
  - `buildMergePlan()`: Menghitung rencana sinkronisasi (create vs update) untuk menghindari duplikasi record.
- **Controller & API Route**:
  - [`src/server/openapi/import-openapi.controller.ts`](file:///Users/gadget/Development/experiment/mock-api-studio/src/server/openapi/import-openapi.controller.ts)
  - [`src/app/api/projects/[id]/import-openapi/route.ts`](file:///Users/gadget/Development/experiment/mock-api-studio/src/app/api/projects/[id]/import-openapi/route.ts)
  - [`src/app/api/v1/external/openapi/upsert/route.ts`](file:///Users/gadget/Development/experiment/mock-api-studio/src/app/api/v1/external/openapi/upsert/route.ts)

---

## 2. Alur Ekstraksi & Algoritma Parsing

```
Raw OpenAPI / Swagger Object
  │
  ├── 1. Sanitasi Root & Validasi
  │      └── Memastikan tipe data objek dan memiliki field `paths`
  │
  ├── 2. Ekstraksi Environment (Matrix Model)
  │      ├── OpenAPI 3.x: rawSpec.servers[]
  │      └── Swagger 2.0: rawSpec.host, rawSpec.basePath, rawSpec.schemes
  │      └── Heuristik: inferEnvType() -> DEV, TEST, STAGING, PROD
  │
  ├── 3. Ekstraksi Collection (Tags)
  │      └── rawSpec.tags[] dipetakan ke Collection (Nama & Deskripsi)
  │
  └── 4. Iterasi paths & HTTP Methods
         ├── Sanitasi Path: Hapus Host & Token {{baseUrl}}, ubah {id} -> :id
         ├── Tag Assignment: Kaitkan API dengan Collection sesuai operation.tags
         ├── Parameter Resolving:
         │     ├── 'query'    -> queryParams
         │     ├── 'path'     -> pathParams
         │     ├── 'header'   -> headers
         │     ├── 'body'     -> body JSON
         │     └── 'formData' -> FORM_DATA / URL_ENCODED
         ├── Schema Resolving ($ref, allOf, enum, default, example)
         └── Ekstraksi Responses (2xx, 4xx, 5xx) -> ResponseScenario
```

---

## 3. Detail Algoritma Parser

### A. Sanitasi Path (`sanitizeImportedPath`)
Mencegah URL absolut atau token variabel Postman/Swagger masuk ke dalam path API:
- Menghapus skema (`http://`, `https://`).
- Menghapus format host / token variabel:
  - `<baseUrl>`, `{{baseUrl}}`, `${api_url}`, dsb.
- Mengonversi path parameter OpenAPI standard `{param}` menjadi express-style `:param`:
  ```typescript
  const normalizedPath = sanitizeImportedPath(pathStr).replace(/\{([^}]+)\}/g, ':$1');
  // Contoh: "/api/v1/users/{userId}/orders" -> "/api/v1/users/:userId/orders"
  ```

### B. Resolusi `$ref` dan Komposisi Schema `allOf`
1. **Pencegahan Siklus Rekursi (`resolveRef`)**:
   Menggunakan `visitedRefs: Set<string>` untuk mencegah infinite loop jika ada circular reference dalam schema.
   ```typescript
   function resolveRef(refStr: string, rootSpec: any, visitedRefs: Set<string> = new Set()): any
   ```
   Pointer JSON seperti `#/components/schemas/UserProfile` diurai dengan memecah path `/` (dan decode escape `~1` $\rightarrow$ `/`, `~0` $\rightarrow$ `~`).

2. **Merge `allOf` (`resolveSchema`)**:
   Saat model menggunakan inheritance atau komposisi schema:
   ```json
   {
     "allOf": [
       { "$ref": "#/components/schemas/BaseEntity" },
       { "type": "object", "properties": { "role": { "type": "string" } } }
     ]
   }
   ```
   Parser menggabungkan seluruh `properties`, `type`, dan `example` dari sub-skema menjadi satu objek skema gabungan.

### C. Generator Data Contoh (`generateSampleFromSchema`)
Jika sebuah field tidak memiliki `example` atau `default`, parser menggenerasi representasi sampel berdasarkan tipe dan format:
- `string` (format: `binary` / `byte`): `{ filename: '(binary_file_data)' }`
- `string` (format: `date-time`): `'2026-09-02T00:00:00Z'`
- `string` (format: `email`): `'user@example.com'`
- `string` (format: `uri` / `url`): `'https://example.com'`
- `string` biasa: `'string'` atau hint dari deskripsi (misal deskripsi `User ID => "USR-001"`)
- `integer` / `number`: `0`
- `boolean`: `true`
- `array`: `[ generateSampleFromSchema(items) ]`
- `enum`: Mengambil nilai elemen pertama (`enum[0]`)

### D. Mapping Environment ke Matrix Stage (`inferEnvType`)
Parser secara otomatis mendeteksi target stage lingkungan dari URL atau deskripsi server:
- Mengandung `local`, `127.0.0.1`, `localhost` $\rightarrow$ `LOCAL`
- Mengandung `dev`, `development` $\rightarrow$ `DEVELOPMENT`
- Mengandung `test`, `testing` $\rightarrow$ `TESTING`
- Mengandung `stag`, `staging` $\rightarrow$ `STAGING`
- Mengandung `prod`, `production` $\rightarrow$ `PRODUCTION`

Nilai disimpan ke dalam struktur **Matrix Environment**:
```json
{
  "name": "User Management Service",
  "isBaseUrl": true,
  "values": {
    "DEVELOPMENT": "https://dev-api.example.com",
    "STAGING": "https://staging-api.example.com",
    "PRODUCTION": "https://api.example.com"
  }
}
```

---

## 4. Strategi Ingesti Database & Sinkronisasi

File [`openapi_storage_helper.ts`](file:///Users/gadget/Development/experiment/mock-api-studio/src/core/db/openapi_storage_helper.ts) mendukung 3 mode:

| Mode | Perilaku | Rekomendasi Penggunaan |
|---|---|---|
| **`upsert`** *(Default)* | Mencocokkan API berdasarkan `METHOD::PATH`. Jika sudah ada, memperbarui name/description & scenarios yang ada; jika belum ada, membuat record baru. ID lama tetap terjaga. | Pembaruan rutin API yang sedang aktif tanpa merusak relasi flow. |
| **`merge`** | Serupa dengan `upsert`, memperkaya data yang ada tanpa menimpa konfigurasi kustom yang telah dibuat pengguna. | Penggabungan parsial endpoint tambahan. |
| **`replace`** | Menghapus seluruh Collection, API, Request Scenario, dan Response Scenario lama milik project dalam satu transaksi atomik, kemudian mengisi ulang dari nol. | Reset total atau inisialisasi ulang project dari dokumen spesifikasi resmi. |

### Chunking untuk Efisiensi & Menghindari Limit Query
Untuk menangani dokumen OpenAPI berukuran besar (ratusan hingga ribuan endpoint), operasi database dilakukan secara *chunked*:
- **Create Chunks**: 100 record per batch (`createManyInChunks`).
- **Update Chunks**: 20 record per transaksi batch (`updateInTransactionChunks`).

---

## 5. Panduan Pengujian & Debugging

Saat melakukan import OpenAPI JSON yang bermasalah:
1. Periksa apakah JSON root valid dan memiliki field `paths`.
2. Jika tipe respon berupa objek kosong `{}`, periksa apakah schema menggunakan `$ref` eksternal yang tidak didefinisikan di dokumen lokal (`#/components/schemas/...`).
3. Jika URL path terpotong, periksa fungsi `sanitizeImportedPath` untuk memastikan pola regex tidak memotong segmen path yang valid.
