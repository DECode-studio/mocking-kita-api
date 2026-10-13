---
name: mock-api-studio-external-api-and-ci-cd
description: Panduan integrasi External API (/api/v1/external/*) untuk automasi CI/CD, pengelolaan mock API secara terprogram, dan orkestrasi pipeline testing.
---

# Skill: External API & Headless CI/CD Automation

Skill ini menjelaskan cara memanfaatkan **External API** di Mock API Studio untuk integrasi *headless*, pipeline CI/CD (GitHub Actions, GitLab CI, Jenkins), serta framework automasi pengujian (Playwright, Cypress, Newman).

---

## 1. Tujuan & Skenario Penggunaan

External API memungkinkan sistem luar berinteraksi langsung dengan Mock API Studio tanpa antarmuka grafis (UI):
- **Otomatisasi CI/CD**: Memperbarui skema mock secara otomatis setiap kali ada commit/PR baru yang mengubah berkas OpenAPI.
- **Dynamic Test Fixtures**: Mengubah perilaku respons mock (*misal: mengubah skenario menjadi Error 500 atau Latency 5000ms*) di tengah jalannya pengujian integrasi E2E.
- **Sinkronisasi Koleksi API**: Memasukkan daftar endpoint baru secara massal dari generator kode backend.

---

## 2. Skema Autentikasi External API

Setiap panggilan ke `/api/v1/external/*` wajib menyertakan autentikasi:

### Metode 1: JWT Bearer Token (Direkomendasikan)
1. Kirim request sign-in:
   ```http
   POST /api/v1/external/auth/signin
   Content-Type: application/json

   {
     "email": "ci-service-account@example.com",
     "password": "SecurePassword123!"
   }
   ```
2. Gunakan `accessToken` pada header request berikutnya:
   ```http
   Authorization: Bearer <accessToken>
   ```

### Metode 2: Header Static API Key
Sertakan API Key yang telah dikonfigurasi:
```http
x-api-key: your-project-api-key
```

---

## 3. Ringkasan Endpoint External API

| Method | Endpoint | Fungsi |
|---|---|---|
| `POST` | `/api/v1/external/auth/signin` | Autentikasi dan penerbitan token JWT. |
| `GET` | `/api/v1/external/apis` | Mengambil daftar API pada proyek tertentu. |
| `PUT` | `/api/v1/external/apis/upsert` | Membuat atau memperbarui endpoint API. |
| `GET` | `/api/v1/external/request-scenarios` | Mengambil daftar Request Matching Scenario. |
| `PUT` | `/api/v1/external/request-scenarios/upsert` | Membuat atau memperbarui Request Matching Scenario. |
| `GET` | `/api/v1/external/response-scenarios` | Mengambil daftar Response Scenario. |
| `PUT` | `/api/v1/external/response-scenarios/upsert` | Membuat atau memperbarui Response Scenario (Status, Body, Latency). |
| `POST` | `/api/v1/external/openapi/upsert` | Impor/sinkronisasi massal dokumen OpenAPI 3.x / Swagger 2.0. |
| `GET` | `/api/v1/external/openapi.json` | Mengunduh spesifikasi OpenAPI live dari proyek. |

---

## 4. Contoh Integrasi Pipeline CI/CD (GitHub Actions)

Contoh workflow untuk menyinkronkan mock API secara otomatis setelah build backend sukses:

```yaml
name: Sync Mock API Studio
on:
  push:
    branches: [main]
    paths:
      - 'contracts/openapi.json'

jobs:
  sync-mock:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Sync OpenAPI Contract to Mock API Studio
        run: |
          curl -X POST https://mock-studio.internal.net/api/v1/external/openapi/upsert \
            -H "x-api-key: ${{ secrets.MOCK_STUDIO_API_KEY }}" \
            -H "Content-Type: application/json" \
            -d @contracts/openapi.json
```

---

## 5. Referensi Lanjutan

- 📖 **Kontrak Lengkap External API**: [`docs/EXTERNAL_API_CONTRACT.md`](file:///Users/gadget/Development/experiment/mock-api-studio/docs/EXTERNAL_API_CONTRACT.md)
- 📖 **Panduan Teknis Implementasi**: [`docs/skills/external-api/SKILL.md`](file:///Users/gadget/Development/experiment/mock-api-studio/docs/skills/external-api/SKILL.md)
