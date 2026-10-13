---
name: mock-api-studio-openapi-and-importers
description: Panduan menyeluruh impor dan ekspor spesifikasi API (OpenAPI 2.0/3.x, Insomnia Collection v5, dan Scenario Flow Template JSON v1) serta auto-provisioning database.
---

# Skill: OpenAPI, Insomnia & Template Import/Export

Skill ini memberikan panduan penggunaan serta kapabilitas impor dan ekspor spesifikasi API di Mock API Studio.

---

## 1. Ikhtisar Format Impor yang Didukung

| Format Dokumen | Sumber | Output Hasil Impor |
|---|---|---|
| **OpenAPI 3.0.x / 3.1.x (JSON/YAML)** | Swagger Editor, Postman, Backend Docs | Project, Environments, Collections, APIs, Request & Response Scenarios |
| **Swagger 2.0 (JSON)** | Legacy Backend API Specs | Endpoint REST standar dan skema mock respons |
| **Insomnia Collection (JSON/YAML v5)** | Export Insomnia REST Client | APIs, Collections, Environments, dan **Scenario Flows** otomatis |
| **Scenario Flow Template (`v1` JSON)** | Ekspor Mock API Studio | Scenario Flow, Steps, dan auto-provisioning dependensi API terkait |

---

## 2. Impor Spesifikasi OpenAPI / Swagger

### A. Fitur Utama Parser OpenAPI
- **Dereferensi Rekursif**: Menangani `$ref` internal, komponen schemas, dan komposisi `allOf` / `anyOf`.
- **Sample Payload Generator**: Secara cerdas membuat contoh payload JSON request & response realistis berdasarkan tipe data schema (string, integer, boolean, array, object, date-time format).
- **Matrix Environment Mapping (`x-environments`)**: Mendukung anotasi kustom `x-environments` pada berkas OpenAPI untuk memetakan Base URL per environment secara otomatis ke `tblEnvironment`.

### B. Strategi Merge Database
Saat mengimpor dokumen OpenAPI ke dalam proyek yang sudah ada:
1. **Mode MERGE (Default)**: Memperbarui endpoint yang sudah ada (berdasarkan kecocokan `path` & `method`) dan menambahkan endpoint baru tanpa menghapus data kustom yang telah dibuat sebelumnya.
2. **Mode REPLACE**: Membersihkan skenario lama dan menggantinya sepenuhnya sesuai spesifikasi berkas terbaru.

> 📖 **Panduan Teknis Mendalam**: Lihat [`docs/skills/openapi-parser/SKILL.md`](file:///Users/gadget/Development/experiment/mock-api-studio/docs/skills/openapi-parser/SKILL.md) untuk arsitektur parser dan spesifikasi dereferensi skema.

---

## 3. Impor Koleksi Insomnia (v5)

Parser Insomnia mengonversi koleksi pengujian Insomnia menjadi rangkaian API dan Scenario Flow:
- **Environment & Sub-Environment**: Variabel base URL dan auth token Insomnia dikonversi menjadi `tblEnvironment`.
- **Chaining Tag Translation**: Mengonversi ekspresi chaining template Insomnia `{% response 'body', 'req_xxx', 'b64::$.token' %}` menjadi sintaks runtime Mock API Studio `${step_1.response.body.token}`.
- **Folder to Scenario Flow**: Folder request di dalam Insomnia otomatis dikonversi menjadi skenario pengujian berantai (*Scenario Flow*).

> 📖 **Panduan Teknis Mendalam**: Lihat [`docs/skills/insomnia-parser/SKILL.md`](file:///Users/gadget/Development/experiment/mock-api-studio/docs/skills/insomnia-parser/SKILL.md) untuk detail mapping data model dan batasan script.

---

## 4. Scenario Flow Portable Template (`v1`)

Memungkinkan berbagi dan mencadangkan alur Scenario Flow antar-workspace atau antar-pengembang:
- **Skema Standar**: `$schema: "mock-api-studio/scenario-flow/v1"`.
- **Auto-Provisioning**: Saat template diimpor ke proyek baru, parser otomatis mendeteksi apakah API dan Collection yang dibutuhkan sudah ada di database. Jika belum ada, sistem akan langsung membuatkan entitas API dan Request Scenario baru secara otomatis.

> 📖 **Panduan Teknis Mendalam**: Lihat [`docs/skills/scenario-flow-parser/SKILL.md`](file:///Users/gadget/Development/experiment/mock-api-studio/docs/skills/scenario-flow-parser/SKILL.md) untuk struktur template JSON lengkap.

---

## 5. Ekspor Dokumen

Mock API Studio menyediakan opsi ekspor satu klik:
1. **Export to OpenAPI 3.0**: Menghasilkan dokumen `openapi.json` standar yang mencakup semua endpoint, parameter, dan skenario respon proyek.
2. **Export Scenario Flow Template**: Menghasilkan berkas `.json` portabel untuk diimpor ke workspace lain.
3. **Export Execution Report**: Menghasilkan berkas laporan `.md` (Markdown) dan `.csv` dari riwayat eksekusi flow.
