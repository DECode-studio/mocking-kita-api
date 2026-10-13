---
name: mock-api-studio-mock-api-engine
description: Panduan mendalam tentang REST API endpoints, Request Scenario Matching Engine, Response Scenarios (Weighted, Delays, Files), dan Dynamic Mock Proxying Engine (/api/[...path]).
---

# Skill: REST API & Mock Proxy Engine

Skill ini menjelaskan arsitektur dan cara kerja **Mock API Engine** serta internal proxying router di Mock API Studio.

---

## 1. Definisi REST API (`tblApi`)

Setiap endpoint mock REST memiliki parameter utama:
- `path`: URL pattern (misal `/v1/users`, `/api/orders/:orderId`, `/products/{id}`). Mendukung path parameter dengan sintaks `:param` atau `{param}`.
- `methodRequest`: Metode HTTP (`GET`, `POST`, `PUT`, `DELETE`, `PATCH`, `OPTIONS`, `HEAD`).
- `collectionId`: Referensi ke folder modul / collection (opsional).
- **Multi-Environment Overrides (`tblApiEnvironment`)**:
  - `enabled`: Mengaktifkan atau menonaktifkan endpoint pada environment tertentu (misal aktif di `LOCAL` & `DEV`, tetapi nonaktif di `PRODUCTION`).
  - `pathOverride`: Menimpa path endpoint khusus pada environment tertentu.

---

## 2. Request Scenario Matching Engine (`tblRequestScenario`)

Ketika sebuah request masuk ke proxy engine, sistem mengevaluasi kecocokan payload request terhadap daftar Request Scenario yang terdaftar berdasarkan **Priority** tertinggi.

### Parameter Matching
1. **Headers**: Pengecekan header tertentu (misal `Authorization`, `X-App-Version`).
2. **Query Parameters**: Pengecekan parameter query string (`?page=1&status=ACTIVE`).
3. **Path Parameters**: Ekstraksi dan evaluasi parameter rute (`/orders/:orderId`).
4. **Body Type**:
   - `JSON`: Payload JSON terstruktur.
   - `FORM_DATA`: Payload multipart/form-data.
   - `URL_ENCODED`: Payload form `application/x-www-form-urlencoded`.
   - `NO_BODY`: Khusus request tanpa body (seperti `GET`, `DELETE`).

### Match Types & Aturan Evaluasi
- **`EXACT`**: Nilai aktual harus persis sama 100% dengan nilai skenario.
- **`PARTIAL`**: Nilai aktual harus memuat subset key/value dari skenario (toleran terhadap atribut tambahan).
- **`REGEX`**: Nilai dievaluasi menggunakan ekspresi reguler (misal `^ORD-[0-9]{5}$`).
- **`JSON_SCHEMA`**: Struktur body divalidasi terhadap JSON Schema standar.

### Match Strategies & Aturan Tambahan
- **`ALL` (AND)**: Semua kondisi (Headers, Query, Path, Body) wajib terpenuhi.
- **`ANY` (OR)**: Minimal satu kondisi yang terdefinisi terpenuhi.
- **`strictBodyStructure`**: Jika aktif (`true`), kunci (*keys*) yang tidak didefinisikan dalam aturan body akan menyebabkan evaluasi gagal.
- **`bodyRules`**: Aturan pencocokan per-field dengan operator lanjutan (`equals`, `contains`, `regex`, `type_of`, `greater_than`, `less_than`).

---

## 3. Response Scenario Engine (`tblResponseScenario`)

Setiap Request Scenario dapat memiliki satu atau lebih Response Scenario dengan konfigurasi respons:

### Parameter Respon
- **`statusCode`**: Kode status HTTP yang dikembalikan (misal `200`, `201`, `400`, `401`, `404`, `422`, `500`).
- **`headers`**: Header kustom yang akan disertakan pada HTTP response (misal `Content-Type`, `X-Custom-Header`).
- **`responseType`**:
  - `JSON`: Mengembalikan body JSON terformat.
  - `FILE`: Mengembalikan berkas biner (gambar PNG/JPG, dokumen PDF, berkas CSV) yang diunggah ke server. Mendukung streaming biner otomatis dengan *Content-Type* yang sesuai.
- **`delayMs` (Latency Simulation)**: Simulasi keterlambatan jaringan sesungguhnya (0 hingga 30.000 ms). Sangat efektif untuk menguji *loading state*, *skeleton UI*, dan *timeout handling* pada aplikasi frontend.
- **`weight` (Weighted Random Lottery / A/B Testing)**:
  - Nilai bobot probabilitas (1 - 100).
  - Jika satu Request Scenario memiliki beberapa Response Scenario aktif (misal *Skenario Sukses* bobot 80, *Skenario Flaky Error 500* bobot 20), engine akan melakukan undian berbobot (*weighted probability lottery*) pada setiap request masuk.
- **`priority`**: Urutan prioritas respon jika tidak menggunakan pembobotan probabilitas.

### Dynamic Token Replacement pada Body Respon
Mock response mendukung injeksi variabel dinamis otomatis:
- `{{$uuid}}`: Menghasilkan UUID v4 acak.
- `{{$timestamp}}`: Menghasilkan timestamp ISO-8601 saat ini.
- `{{$randomInt(min, max)}}`: Menghasilkan integer acak dalam rentang tertentu.
- `{{datasheet.users.next.email}}`: Mengambil data baris berikutnya dari Data Sheet secara sekuensial.

---

## 4. Alur Kerja Internal Mock Proxy (`/api/[...path]`)

```text
Client Request (e.g. GET /api/v1/orders/123)
               │
               ▼
   [ Next.js API Dynamic Route: src/app/api/[...path]/route.ts ]
               │
               ▼
   [ Server Mock Proxy Service: src/server/mock-proxy/mock-proxy.service.ts ]
               │
   ┌───────────┴──────────────────────────────────────────┐
   │ 1. Periksa In-Memory Cache & Throttling Rate Limiter  │
   │ 2. Resolusi Project & Environment aktif              │
   │ 3. Match Endpoint Path & HTTP Method                 │
   │ 4. Evaluasi Request Scenarios (Priority & Matching)  │
   │ 5. Pilih Response Scenario (Weighted Lottery)        │
   │ 6. Interpolasi Token Dinamis & Resolusi File         │
   │ 7. Terapkan Delay Latency (delayMs)                  │
   └───────────┬──────────────────────────────────────────┘
               │
               ▼
     NextResponse (Status Code, Headers, JSON/File Stream Body)
```

### In-Memory Caching & Cache Invalidation
- Untuk performa tinggi dengan throughput ribuan request/detik, engine menggunakan in-memory LRU cache (`mock-proxy.cache.ts`).
- **Cache Invalidation**: Setiap kali ada penambahan, pembaruan, atau penghapusan API/Scenario di database, fungsi `clearInternalProxyCache()` dipanggil secara otomatis agar perubahan langsung berlaku seketika tanpa perlu restart server.
