---
name: mock-api-studio-scenario-flows
description: Panduan orkestrasi pengujian berantai E2E (Scenario Flows / Request Flow), Dual View (Classic List & Visual Canvas), Chaining Variabel, Run Step Terisolasi, Assertions, Timeline Inspector, dan Ekspor Laporan.
---

# Skill: Scenario Flows (E2E API Orchestration)

Skill ini menguraikan fitur **Scenario Flows** (juga dikenal sebagai *Request Flow Orchestrator*), yaitu mesin pengujian alur API berantai tanpa memerlukan alat eksternal seperti Postman Collection Runner atau Newman.

---

## 1. Konsep Utama Scenario Flow (`tblScenarioFlow`)

Scenario Flow memungkinkan pengembang dan QA merangkai serangkaian request HTTP secara berurutan:
- **Contoh Skenario**: `1. User Login -> 2. Extract Auth Token -> 3. Get User Profile -> 4. Create Order -> 5. Pay Order`.
- **Eksekusi Multi-Mode**:
  - **MOCK Mode**: Request diarahkan ke internal Mock Proxy Engine (`/api/[...path]`).
  - **LIVE Mode**: Request diarahkan ke Base URL environment sesungguhnya (misal server staging atau development backend).

---

## 2. Dual View Modes (Tampilan Ganda)

Mock API Studio menyediakan dua mode visualisasi untuk membangun dan mengelola langkah-langkah skenario:

### A. Classic List View (Default)
- **Sistem Paginasi**: Membagi langkah-langkah ke dalam 10 langkah per halaman untuk performa render cepat dan navigasi terstruktur pada flow yang panjang (puluhan/ratusan step).
- **Proteksi Overflow & Ringkasan Kompak**: Teks URL panjang atau payload besar diringkas rapi dengan proteksi pemotongan teks (*text overflow protection*).
- **Kontrol Urutan**: Tombol re-order instan (Pindah Atas / Pindah Bawah) dan duplikasi langkah.
- **Aksi Cepat**: Tombol *Run Step*, edit cepat, dan toggle aktif/nonaktif per langkah.

### B. Visual Canvas View (Graph Diagram)
- **Diagram Node Interaktif**: Setiap langkah direpresentasikan sebagai kartu node yang terhubung dengan garis alur (*connection lines*).
- **Status Eksekusi Real-time**: Indikator warna dinamis pada node (Abu-abu: Belum jalan, Biru: Berjalan, Hijau: Sukses, Merah: Gagal).
- **Quick Node Trigger**: Eksekusi single-step langsung dari canvas.

---

## 3. Konfigurasi Langkah Flow (`tblScenarioFlowStep`)

Setiap langkah dalam flow memiliki parameter konfigurasi komprehensif:

| Parameter | Tipe | Deskripsi |
|---|---|---|
| `stepOrder` | Integer | Urutan sekuensial langkah dalam flow (1, 2, 3, ...). |
| `name` & `description` | String | Nama identifikasi langkah (misal: *Otentikasi Akun Pembeli*). |
| `enabled` | Boolean | Mengaktifkan atau melewati (*skip*) langkah saat eksekusi. |
| `delayMs` | Integer | Waktu jeda (milidetik) sebelum langkah ini dieksekusi. |
| `continueOnError` | Boolean | Jika `true`, kegagalan pada langkah ini tidak akan menghentikan sisa alur pengujian. |
| `targetEnvironmentType` | String | `DEFAULT`, `LOCAL`, `DEVELOPMENT`, `TESTING`, `STAGING`, atau `PRODUCTION`. |
| `apiId` & `requestScenarioId` | UUID | Referensi ke API dan skenario terdaftar (opsional jika menggunakan override penuh). |
| `methodOverride` | String | Menimpa metode HTTP (`GET`, `POST`, `PUT`, `DELETE`, dll). |
| `pathOverride` | String | Menimpa rute URL (mendukung interpolasi variabel). |
| `headersOverride` | JSON | Header HTTP kustom yang dikirimkan pada langkah ini. |
| `bodyOverride` & `bodyType` | JSON/String | Payload request (`JSON`, `FORM_DATA`, `URL_ENCODED`, `NO_BODY`). |
| `extractors` | JSON | Aturan ekstraksi nilai respon untuk disuntikkan ke langkah berikutnya. |
| `assertions` | JSON | Kriteria validasi status respon, header, dan body. |

---

## 4. Ekstraksi Variabel & Dynamic Variable Chaining

Sistem mendukung ekstraksi nilai dari respon suatu langkah untuk digunakan pada langkah-langkah berikutnya:

### A. Format Ekstraksi (`extractors`)
```json
[
  {
    "variableName": "authToken",
    "source": "BODY",
    "path": "data.accessToken"
  },
  {
    "variableName": "orderId",
    "source": "BODY",
    "path": "data.order.id"
  },
  {
    "variableName": "sessionHeader",
    "source": "HEADER",
    "path": "x-session-id"
  }
]
```

### B. Sintaks Interpolasi Variabel
Nilai yang terekstraksi dapat dipanggil pada Headers, Query, Path, atau Body langkah berikutnya dengan format:
- Variabel Ekstraksi Kustom: `{{authToken}}` atau `{{orderId}}`
- Variabel Step Langsung: `${step_1.response.body.data.accessToken}` atau `${step_2.response.headers.x-request-id}`
- Environment Variables: `{{BASE_AUTH_URL}}`
- Dynamic Generator: `{{$uuid}}`, `{{$timestamp}}`, `{{$randomInt(100, 999)}}`
- Data Sheet Counters: `{{datasheet.users.next.email}}`

---

## 5. Mesin Asersi (Assertions Engine)

Setiap langkah dapat memiliki aturan validasi otomatis:

```json
[
  {
    "target": "STATUS_CODE",
    "operator": "EQUALS",
    "expectedValue": "200"
  },
  {
    "target": "BODY_JSON_PATH",
    "property": "status",
    "operator": "EQUALS",
    "expectedValue": "SUCCESS"
  },
  {
    "target": "BODY_JSON_PATH",
    "property": "data.items",
    "operator": "EXISTS"
  },
  {
    "target": "HEADER",
    "property": "content-type",
    "operator": "CONTAINS",
    "expectedValue": "application/json"
  }
]
```

**Operator Asersi**: `EQUALS`, `NOT_EQUALS`, `CONTAINS`, `NOT_CONTAINS`, `REGEX`, `EXISTS`, `GREATER_THAN`, `LESS_THAN`.

---

## 6. Fitur Eksekusi & Analisis

### A. Isolated Step Execution (`Run Step`)
Pengembang dapat menguji satu langkah secara mandiri tanpa harus menjalankan seluruh flow dari awal. Sistem akan menggunakan nilai variabel yang tersimpan di memori atau nilai mock default.

### B. Batch Multi-Runs (Stress & Endurance Testing)
Memungkinkan eksekusi flow berulang kali (misal 10x, 50x, 100x) dengan interval jeda tertentu untuk menguji ketahanan API atau menghabiskan dataset Data Sheet.

### C. Paginated Execution Timeline & Inspector (`tblScenarioFlowExecutionStep`)
Setiap eksekusi mencatat riwayat terperinci:
- Snapshot request lengkap (URL, method, headers terinterpolasi, payload body).
- Snapshot response lengkap (HTTP status code, durasi dalam ms, headers respon, body respon).
- Variabel yang berhasil diekstrak beserta nilainya.
- Status kelulusan tiap asersi (Passed / Failed) dan pesan error jika ada.

### D. Export Laporan Eksekusi (Markdown & CSV)
Hasil eksekusi dapat diekspor langsung dalam format:
- **Markdown (.md)**: Ringkasan laporan profesional yang siap ditempel ke PR/Ticket issue atau dokumentasi.
- **CSV (.csv)**: Data tabulasi matriks durasi, status code, dan asersi untuk analisis spreadsheet kuantitatif.
