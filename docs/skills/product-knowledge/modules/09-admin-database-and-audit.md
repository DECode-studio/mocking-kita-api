---
name: mock-api-studio-admin-database-and-audit
description: Panduan administrasi akun pengguna, role access control, audit trail Change Logs, manajemen snapshot database (Export, Import MERGE/REPLACE, Reset), dan FAQ Knowledge Base.
---

# Skill: Administration, Audit Logs & Database Lifecycle

Skill ini menguraikan fitur administratif, pencatatan jejak audit sistem (*Audit Logs*), pemeliharaan database, serta modul *Knowledge Base / FAQ* di Mock API Studio.

---

## 1. Manajemen Akun & Pengguna (`tblAccount`)

Dikelola melalui antarmuka **Admin Accounts** (`/admin/accounts`) khusus untuk pengguna dengan role `ADMIN`:

### A. Fitur Manajemen Pengguna
- **Pembuatan Akun**: Membuat akun operator baru dengan username/email, nama lengkap, password default, dan alokasi peran (`ADMIN` atau `MEMBER`).
- **Reset Password**: Administrator dapat mereset password akun anggota tim secara langsung.
- **Identifikasi Google SSO**: Menampilkan status keterhubungan akun dengan Single Sign-On Google (`google_id`).
- **Pengaturan Akun Mandiri (`/account-settings`)**: Setiap pengguna dapat memperbarui nama profil, mengubah password kustom, dan mengatur preferensi tema antarmuka.

---

## 2. Audit Trail & Jejak Perubahan (`tblChangeLog`)

Seluruh operasi modifikasi data pada sistem dicatat secara otomatis ke dalam tabel audit `tblChangeLog` (`/admin/change-logs`):

### A. Informasi yang Dicatat
- **Aksi (`action`)**: `CREATE`, `UPDATE`, `DELETE`, `RESTORE`, `IMPORT`, `RESET`.
- **Entitas (`entityType`)**: `project`, `collection`, `environment`, `api`, `request_scenario`, `response_scenario`, `scenario_flow`, `data_sheet`, `database`.
- **Operator & Waktu**: Nama operator pengeksekusi dan timestamp presisi milidetik.
- **Diff Komparasi State (`beforeState` & `afterState`)**: Memungkinkan administrator meninjau payload sebelum dan sesudah perubahan secara visual untuk kebutuhan forensik data.

### B. Filter & Pencarian
Antarmuka Change Logs dilengkapi filter berdasarkan:
- Rentang Tanggal (Date Range Picker).
- Tipe Entitas & Jenis Aksi.
- Nama Proyek & Nama Operator.

---

## 3. Siklus Hidup & Snapshot Database

Dikelola melalui menu **Settings / Database Management** (`/settings`):

```text
Database Actions Engine (/api/database/*)
├── Export Database Snapshot   ───> Menghasilkan Full JSON Snapshot (.json)
├── Import Database Snapshot   ───> Memuat Snapshot (Mode MERGE / REPLACE)
└── Reset Database             ───> Purge Data Relasional (Dengan Proteksi Konfirmasi)
```

### A. Export Database Snapshot
Mengunduh seluruh state database PostgreSQL ke dalam satu berkas JSON terstruktur yang mencakup:
- Semua Projects & PICs
- Environments & Variables
- Collections & APIs
- Request & Response Scenarios
- Scenario Flows, Steps & Jobs
- Data Sheets

### B. Import Database Snapshot
Mendukung dua strategi impor:
1. **Mode MERGE**: Menggabungkan data snapshot ke dalam database yang ada tanpa menghapus data lain yang tidak terkait. Jika ID entitas bertabrakan, sistem akan memperbarui atributnya.
2. **Mode REPLACE**: Mengosongkan data lama terlebih dahulu sebelum memuat seluruh snapshot baru secara utuh.

### C. Reset Database
Menghapus seluruh data mock, skenario, flow, dan dataset pengujian untuk mengembalikan sistem ke kondisi awal yang bersih (*clean slate*). Tindakan ini dilindungi dengan sistem dialog konfirmasi ganda dan verifikasi teks.

---

## 4. Modul FAQ & Knowledge Base (`/faq`)

Mock API Studio dilengkapi modul bantuan interaktif bawaan:
- **Pencarian Cepat**: Menemukan panduan fitur, format sintaks token, dan tips optimasi mock API secara instan.
- **Kategori Terstruktur**: Terbagi ke dalam kategori *Getting Started*, *Request Matching*, *Scenario Flows*, *Data Sheets*, dan *Troubleshooting*.
- **Rich Markdown Rendering**: Menyajikan contoh kode, diagram alur, dan panduan langkah demi langkah langsung di dalam aplikasi.
