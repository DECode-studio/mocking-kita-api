---
name: mock-api-studio-project-and-environment-management
description: Panduan manajemen Project, Collection/Folder API, penugasan PIC, dan konfigurasi Multi-Environment (Base URL & Environment Variables) di Mock API Studio.
---

# Skill: Project, Collection & Environment Management

Skill ini menguraikan struktur hierarki organisasi API di Mock API Studio, pengelolaan multi-environment, serta manajemen koleksi endpoint.

---

## 1. Hierarki Organisasi Data

Struktur pengelolaan API dirancang bertingkat untuk mencerminkan arsitektur sistem skala mikro maupun monolitik:

```text
Project (tblProject)
├── PICs (tblProjectPic)               # Penanggung jawab project
├── Environments (tblEnvironment)       # LOCAL, DEV, TESTING, STAGING, PROD
│   ├── Base URL                       # http://localhost:8080, https://api-dev.domain.com
│   └── Variables                      # {"AUTH_URL": "...", "API_KEY": "..."}
│
├── Collections / Folders (tblCollection) # Pengelompokan modul (Auth, Payment, User, dll)
│   └── APIs (tblApi)                  # REST Endpoints (GET, POST, PUT, DELETE, dll)
│       ├── PICs (tblApiPic)           # Penanggung jawab API
│       ├── Environment Settings       # Enabled & Path Override per environment
│       └── Request/Response Scenarios # Aturan pencocokan & respon mock
│
├── Data Sheets (tblDataSheet)         # Dataset pengujian terpusat
└── Scenario Flows (tblScenarioFlow)   # Orkestrasi alur pengujian berantai
```

---

## 2. Manajemen Project (`tblProject`)

### Atribut Utama
- `id` (UUID): Identifier unik proyek.
- `name` (String): Nama proyek (contoh: *Core Banking Gateway*, *E-Commerce Mobile API*).
- `description` (String, opsional): Gambaran fungsi dan cakupan sistem.
- `status` (Boolean): Sakelar aktif/nonaktif proyek.
- `deletedAt` (DateTime, opsional): Penanda soft-delete untuk pemulihan data aman.

### Operasi Project
- **Create**: Dibuat melalui antarmuka Projects (`/projects`) dengan modal *Create Project*. Otomatis membuat environment default (`LOCAL`).
- **Edit / Update**: Mengubah nama, deskripsi, status, dan mengalokasikan PIC tim.
- **Delete / Archive**: Soft-delete dengan proteksi integritas data relasional.

---

## 3. Konfigurasi Multi-Environment (`tblEnvironment`)

Mock API Studio mendukung 5 jenis tipe environment standar per project:

| Environment Type | Kegunaan Tipikal | Contoh Base URL |
|---|---|---|
| `LOCAL` | Pengujian localhost pengembang frontend/backend | `http://localhost:3000` / `http://127.0.0.1:8080` |
| `DEVELOPMENT` | Server integrasi tim harian | `https://dev-api.internal.net` |
| `TESTING` / `QA` | Server khusus pengujian QA & automation test | `https://qa-api.internal.net` |
| `STAGING` / `UAT` | Lingkungan pra-produksi untuk validasi bisnis | `https://staging-api.example.com` |
| `PRODUCTION` | Endpoint sistem produksi live | `https://api.example.com` |

### Komponen Konfigurasi Environment:
1. **Base URL (`values.baseUrl` / `is_base_url`)**: Prefix URL host target yang digunakan ketika Scenario Flow dijalankan dalam mode **LIVE**.
2. **Environment Variables (`variables`)**: Pasangan kunci-nilai (Key-Value) atau JSON array yang dapat disuntikkan secara dinamis ke dalam Request Headers, URL Path, Query Params, dan Body menggunakan sintaks interpolasi `{{KEY_NAME}}`.

```json
[
  { "key": "BASE_AUTH_URL", "value": "https://dev-auth.example.com" },
  { "key": "SERVICE_TOKEN", "value": "sec_live_99281a8c9b" },
  { "key": "TENANT_ID", "value": "tenant-corp-01" }
]
```

---

## 4. Manajemen Collection / Folder (`tblCollection`)

Koleksi berfungsi sebagai wadah pengelompokan logis endpoint REST API:
- **Hierarki Datar & Bersih**: Tiap API dapat ditugaskan ke satu collection tertentu atau dibiarkan di tingkat root proyek.
- **Aksi Cepat**: Pembuatan, pengubahan nama (*rename*), dan penghapusan collection dari antarmuka proyek.
- **Relasi Prisma**: Relasi `onDelete: SetNull` memastikan penghapusan collection tidak akan menghapus API di dalamnya secara tidak sengaja.

---

## 5. Alur Penggunaan pada Antarmuka (UI Workflow)

1. Buka menu **Projects** di navigasi utama (`/projects`).
2. Klik tombol **+ Create Project** dan isi nama proyek.
3. Masuk ke halaman detail project (`/projects/[projectId]`):
   - Tab **APIs & Collections**: Kelola folder dan endpoint.
   - Tab **Environments**: Atur Base URL untuk LOCAL, DEV, QA, STAGING, PROD dan daftarkan Environment Variables.
   - Tab **Team & PICs**: Tambahkan akun developer / QA yang bertanggung jawab.
   - Tab **Data Sheets**: Kelola dataset pengujian proyek.
   - Tab **Scenario Flows**: Rancang alur pengujian flow terintegrasi.
