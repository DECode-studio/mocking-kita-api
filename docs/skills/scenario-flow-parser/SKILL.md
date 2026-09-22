---
name: scenario-flow-template-parser
description: Panduan teknis penguraian (parsing) dan eksekusi Template JSON Scenario Flow di Mock API Studio, mencakup skema template v1, auto-provisioning API/Environment, mesin interpolasi variabel runtime, generator dinamis, counter Data Sheet, normalisasi header, dan assertions.
---

# Skill: Scenario Flow Template & Runtime Parser

Skill ini menguraikan arsitektur lengkap pengolahan **Template JSON Scenario Flow** di Mock API Studio, yang terbagi dalam dua domain utama:
1. **Template Import & Export Parser**: Mengurai file JSON template portabel dan secara otomatis mem-provision API, Collection, Environment, dan skenario.
2. **Runtime Execution & Interpolation Engine**: Mesin eksekusi flow yang menginterpolasi variabel dinamis, Data Sheet counters, auto-inject header, ekstraksi variabel antar-langkah, dan evaluasi asersi (*assertions*).

---

## 1. Lokasi Kode Kunci

- **Template I/O (Import & Export)**: [`src/server/scenario-flow/scenario-flow.import-export.ts`](file:///Users/gadget/Development/experiment/mock-api-studio/src/server/scenario-flow/scenario-flow.import-export.ts)
  - `importScenarioFlowFromTemplate()`: Parser template JSON dengan kapabilitas *auto-provisioning*.
  - `exportScenarioFlowToTemplate()`: Serializer skenario flow ke file JSON portabel.
- **Runtime Execution Engine**: [`src/server/scenario-flow/scenario-flow.runner.ts`](file:///Users/gadget/Development/experiment/mock-api-studio/src/server/scenario-flow/scenario-flow.runner.ts)
  - `executeScenarioFlow()`: Orkestrator utama siklus hidup eksekusi skenario.
  - `interpolateVariables()`: Mesin penelusuran rekursif dan penggantian token variabel.
  - `resolveDynamicGenerator()`: Resolver generator acak (`{{$uuid}}`, dsb).
  - `resolveDataSheetToken()` & `createStepDataSheetCounters()`: Proxy counter data sheet per-step.
  - `buildNormalizedHeaders()`: Normalisasi header jaringan standar client.
  - `extractVariables()` & `evaluateAssertion()`: Ekstraksi state & verifikasi respon.
- **Tipe & Interface**: [`src/server/scenario-flow/scenario-flow.types.ts`](file:///Users/gadget/Development/experiment/mock-api-studio/src/server/scenario-flow/scenario-flow.types.ts)

---

## 2. Struktur Spesifikasi Template JSON (`v1`)

File template portabel menggunakan skema `$schema: "mock-api-studio/scenario-flow/v1"`:

```json
{
  "$schema": "mock-api-studio/scenario-flow/v1",
  "version": "1.0",
  "exportedAt": "2026-09-22T00:00:00.000Z",
  "environments": [
    {
      "id": "gateway-dev",
      "name": "API Gateway DEV",
      "environmentType": "DEVELOPMENT",
      "baseUrl": "https://dev-gateway.example.com",
      "isDefault": true
    }
  ],
  "flow": {
    "name": "E2E User Registration Flow",
    "description": "Register, OTP validation, and profile completion",
    "stopOnFailure": true,
    "variables": {
      "defaultRole": "CUSTOMER",
      "deviceCode": "DEV-ANDROID-001"
    }
  },
  "steps": [
    {
      "order": 1,
      "name": "Request OTP",
      "enabled": true,
      "delayMs": 0,
      "continueOnError": false,
      "api": {
        "method": "POST",
        "path": "/v1/auth/request-otp",
        "name": "Request OTP Service",
        "collection": "Auth",
        "targetEnvironment": "gateway-dev"
      },
      "requestScenario": {
        "name": "Standard OTP Request",
        "headers": { "Content-Type": "application/json" },
        "body": {
          "phone": "{{datasheet.users.next.phone}}",
          "requestId": "{{$uuid}}"
        },
        "bodyType": "JSON"
      },
      "expectedResponseScenario": {
        "statusCode": 200,
        "body": { "code": "OK", "otpToken": "mock-token-123" }
      },
      "extractors": [
        {
          "variable": "otpSessionToken",
          "from": "body",
          "path": "otpToken"
        }
      ],
      "assertions": [
        {
          "type": "statusCode",
          "operator": "equals",
          "expected": 200
        }
      ]
    }
  ]
}
```

---

## 3. Alur Kerja Import Template & Auto-Provisioning

Saat template diimpor via `importScenarioFlowFromTemplate(projectId, template)`:

1. **Sinkronisasi Environment**:
   - Mendaftarkan entitas Environment jika belum ada.
   - Mengonversi `baseUrl` ke Matrix Model sesuai stage (`DEVELOPMENT`, `STAGING`, `PRODUCTION`).
2. **Auto-Provisioning API & Collection**:
   - Jika suatu step mereferensikan endpoint API yang belum terdaftar di project, parser **langsung membuatkan API dan Collection baru** secara otomatis.
   - Menghubungkan API dengan Environment melalui tabel relasi `tblApiEnvironment`.
3. **Provisioning Skenario Request & Response**:
   - `requestScenario` dan `expectedResponseScenario` otomatis disimpan dan ditautkan ke API terkait.
4. **Penyusunan Step Eksekusi (`tblScenarioFlowStep`)**:
   - Menyimpan urutan (`stepOrder`), override (`path`, `headers`, `body`), `extractors`, dan `assertions`.

---

## 4. Mesin Runtime Interpolasi Template (`scenario-flow.runner.ts`)

Saat Scenario Flow dijalankan, engine runner melakukan evaluasi template dinamis pada URL, query string, header, body request, hingga assertions:

### A. Algoritma Interpolasi (`interpolateVariables`)
- **Single Variable Exact Match (`/^{{\s*([^\}]+?)\s*}}$/`)**:
  Menjaga tipe data asli. Jika variabel bernilai integer `100`, array `[1, 2]`, atau objek `{ "id": 1 }`, hasil interpolasi **bukan berupa string**, melainkan tipe data asli tersebut:
  ```typescript
  "{{totalAmount}}" -> 100 (number)
  "{{userPayload}}" -> { id: 1, name: "Budi" } (object)
  ```
- **Embedded String Replacement (`/\{\{\s*([^\}]+?)\s*\}\}/g`)**:
  Jika token berada di dalam kalimat (misal `"Bearer {{token}}"`), nilai akan otomatis diubah menjadi string.

---

### B. Generator Nilai Dinamis Bawaan

| Token Generator | Deskripsi Hasil | Contoh Nilai |
|---|---|---|
| `{{$uuid}}` | UUID v4 baru | `"c10a2fc8-de78-4662-8317-7e90403bbdaf"` |
| `{{$timestamp}}` | Epoch timestamp saat ini | `"1774224000000"` |
| `{{$isoDate}}` | Format tanggal ISO 8601 | `"2026-09-22T07:00:00.000Z"` |
| `{{$randomInt}}` | Angka acak 0 s.d. 999.999 | `482910` |
| `{{$randomEmail}}` | Format email dummy acak | `"test_4829@example.com"` |

---

### C. Data Sheet Pool & Step-Scoped Counter Proxy

Data Sheet adalah kumpulan dataset baris (tabel mock data). Token Data Sheet diakses dengan format:
```
{{datasheet.<sheetCode>.<modifier>.<nestedProperty>}}
```

#### Modifiers:
- `random` / `$random`: Memilih satu baris secara acak.
- `next` / `asc` / `inc`: Mengambil baris berurutan dari atas ke bawah (berputar jika habis).
- `prev` / `desc` / `dec`: Mengambil baris berurutan terbalik dari bawah ke atas.
- Index numerik (misal `[0]` atau `.0`): Mengakses baris spesifik.

#### Step-Scoped Counter Proxy (`createStepDataSheetCounters`)
Masalah umum dalam pengujian adalah jika sebuah step membutuhkan beberapa atribut dari baris yang sama, misalnya:
```json
{
  "userId": "{{datasheet.users.next.id}}",
  "userName": "{{datasheet.users.next.name}}",
  "userEmail": "{{datasheet.users.next.email}}"
}
```
Jika counter langsung bertambah pada setiap token, ketiga atribut tersebut akan mengambil 3 baris data yang berbeda.

**Solusi Engine**:
Engine menggunakan JavaScript `Proxy`:
1. Selama 1 step dieksekusi, pemanggilan `next` mengunci indeks baris yang sama untuk step tersebut.
2. Ketika step selesai dijalankan, fungsi `commitStep()` dipanggil satu kali untuk menaikkan counter master ke baris berikutnya.

---

### D. Normalisasi Header Jaringan (`buildNormalizedHeaders`)

Mengadopsi standar client *flutter-package-core / Dio*:
- Standarisasi header secara *case-insensitive* (menghilangkan duplikasi `content-type` vs `Content-Type`).
- Default `Content-Type` dan `Accept`: `application/json`.
- **Injeksi Otomatis**:
  - `x-request-id`: Dibuat otomatis menggunakan UUID v4 jika belum didefinisikan.
  - `x-device-id`: Diambil dari variabel `device_code`, `deviceCode`, atau `deviceId`.
  - `apikey`: Diambil dari variabel `apikey`, `apigeeApiKey`, atau `apiKey`.

---

### E. Ekstraksi Variabel & Evaluasi Assertions

1. **Ekstraksi Variabel (`extractVariables`)**:
   Mengambil data dari respon HTTP (`status`, `headers`, atau JSON path `body`) dan menyimpannya ke `currentVariables` agar langsung dapat digunakan oleh step-step berikutnya:
   ```typescript
   // Contoh: Mengambil access_token dari body respon: data.token
   val = getNestedValue(response.body, "data.token");
   currentVariables["accessToken"] = val;
   ```

2. **Evaluasi Assertions (`evaluateAssertion`)**:
   Mendukung operator: `equals`, `notEquals`, `contains`, `notContains`, `exists`, `notExists`, `greaterThan`, `lessThan`, dan `in_datasheet` (memverifikasi apakah nilai respon terdaftar di dalam Data Sheet).
