---
name: mock-api-studio-external-api
description: Panduan arsitektur, spesifikasi endpoint, autentikasi, dan tata cara integrasi External API di Mock API Studio (/api/v1/external/*) untuk otomatisasi CI/CD dan platform eksternal.
---

# Skill: External API Integration (Mock API Studio)

Skill ini menyediakan panduan lengkap untuk berinteraksi, memelihara, dan mengintegrasikan **External API** di Mock API Studio. External API dirancang agar platform luar (misal CI/CD pipeline, automation tester, Postman/Newman, atau service backend lain) dapat mengelola endpoint mock, skenario request/response, dan import OpenAPI secara terprogram.

---

## 1. Lokasi Kode & Arsitektur

```
src/
├── app/api/v1/external/
│   ├── auth/signin/route.ts                # Sign-in & issue JWT
│   ├── apis/route.ts                       # GET list APIs
│   ├── apis/upsert/route.ts                # PUT upsert API
│   ├── request-scenarios/route.ts          # GET list request scenarios
│   ├── request-scenarios/upsert/route.ts   # PUT upsert request scenario
│   ├── response-scenarios/route.ts         # GET list response scenarios
│   ├── response-scenarios/upsert/route.ts  # PUT upsert response scenario
│   ├── openapi/upsert/route.ts             # POST upsert massal dari OpenAPI/Swagger
│   └── openapi.json/route.ts               # GET OpenAPI spec documentation
├── server/
│   ├── external/external-openapi.service.ts
│   ├── database/database-openapi-actions.service.ts
│   └── mock-proxy/mock-proxy.cache.ts      # Cache invalidation (clearInternalProxyCache)
docs/
├── EXTERNAL_API_CONTRACT.md                # Spesifikasi kontrak API lengkap
└── external-api-postman-openapi.json       # Koleksi Postman / OpenAPI spec
```

---

## 2. Skema Autentikasi

Semua request ke `/api/v1/external/*` (kecuali `/auth/signin` dan `/openapi.json`) wajib menyertakan autentikasi melalui salah satu metode berikut:

### Metode A: JWT Bearer Token (Direkomendasikan)
1. Panggil `POST /api/v1/external/auth/signin` dengan kredensial user:
   ```json
   {
     "email": "admin@example.com",
     "password": "Password123!"
   }
   ```
2. Dapatkan `accessToken` dari respon.
3. Sertakan token pada header request berikutnya:
   ```http
   Authorization: Bearer <accessToken>
   ```

### Metode B: Static API Key
Sertakan header `x-api-key` yang valid sesuai konfigurasi project/environment:
```http
x-api-key: your-external-api-key
```

---

## 3. Format Respon Standar (Envelope)

### Respon Sukses
```json
{
  "success": true,
  "message": "API upserted successfully",
  "action": "CREATED", // "CREATED" atau "UPDATED" (khusus operasi upsert)
  "data": { ... }
}
```

### Respon Error
```json
{
  "success": false,
  "error": {
    "code": "BAD_REQUEST", // NOT_FOUND | UNAUTHORIZED | INTERNAL_SERVER_ERROR
    "message": "Field 'projectId' and 'path' are required",
    "details": null
  }
}
```

---

## 4. Rincian Endpoint Eksternal

### 1. Auth Sign-In
- **Method & URL**: `POST /api/v1/external/auth/signin`
- **Body**:
  ```json
  {
    "email": "admin@example.com",
    "password": "Password123!"
  }
  ```
- **Response `200 OK`**:
  ```json
  {
    "success": true,
    "message": "Authentication successful",
    "data": {
      "tokenType": "Bearer",
      "accessToken": "eyJhbGciOiJIUzI1Ni...",
      "expiresIn": 86400,
      "user": {
        "id": "usr-123",
        "username": "admin",
        "email": "admin@example.com",
        "role": "ADMIN"
      }
    }
  }
  ```

---

### 2. Upsert API
Menyimpan endpoint API baru atau memperbarui jika kombinasi `projectId` + `path` + `methodRequest` sudah ada.

- **Method & URL**: `PUT /api/v1/external/apis/upsert`
- **Body**:
  ```json
  {
    "projectId": "proj-uuid-001",
    "collectionId": "col-uuid-001", // Opsional, bisa null
    "name": "Get User Profile",
    "description": "Mengambil profil pengguna berdasarkan ID",
    "path": "/users/:id",
    "methodRequest": "GET", // GET | POST | PUT | PATCH | DELETE | OPTIONS | HEAD
    "status": true
  }
  ```
- **Response `200 OK`**:
  ```json
  {
    "success": true,
    "message": "API upserted successfully",
    "action": "CREATED",
    "data": {
      "id": "api-uuid-101",
      "projectId": "proj-uuid-001",
      "path": "/users/:id",
      "methodRequest": "GET",
      "status": true
    }
  }
  ```

---

### 3. Get List APIs
- **Method & URL**: `GET /api/v1/external/apis?projectId=proj-uuid-001&search=profile&page=1&limit=20`
- **Query Params**:
  - `projectId` (Wajib)
  - `collectionId` (Opsional)
  - `search` (Opsional): Filter berdasarkan nama atau path
  - `page` (Default: 1), `limit` (Default: 20, Max: 100)

---

### 4. Upsert Request Scenario
Menentukan kondisi pencocokan (*matching criteria*) untuk suatu API.

- **Method & URL**: `PUT /api/v1/external/request-scenarios/upsert`
- **Body**:
  ```json
  {
    "id": "req-uuid-001", // Opsional. Jika kosong/null akan di-generate UUID baru
    "apiId": "api-uuid-101",
    "name": "Valid User Token Scenario",
    "description": "Kondisi request dengan Authorization header valid",
    "headers": {
      "Authorization": "Bearer valid-token"
    },
    "queryParams": {
      "include": "address"
    },
    "pathParams": {
      "id": "12345"
    },
    "body": {},
    "bodyType": "JSON", // NONE | JSON | FORM_DATA | URL_ENCODED | RAW
    "matchType": "PARTIAL", // EXACT | PARTIAL
    "priority": 10, // Nilai integer lebih tinggi diprioritaskan terlebih dahulu
    "status": true
  }
  ```

---

### 5. Upsert Response Scenario
Menentukan respon HTTP yang akan dikembalikan saat Request Scenario terpenuhi.

- **Method & URL**: `PUT /api/v1/external/response-scenarios/upsert`
- **Body**:
  ```json
  {
    "id": "resp-uuid-001", // Opsional. Jika null akan dibuat baru
    "requestScenarioId": "req-uuid-001",
    "name": "200 Success Response",
    "statusCode": 200,
    "headers": {
      "Content-Type": "application/json"
    },
    "body": {
      "code": "OK",
      "data": {
        "id": 12345,
        "name": "Budi Santoso",
        "email": "budi@example.com"
      }
    },
    "responseType": "JSON", // JSON | XML | TEXT | HTML | FILE
    "delayMs": 150, // Simulasi latensi jaringan dalam milidetik
    "weight": 100,
    "priority": 10,
    "status": true
  }
  ```

---

### 6. Upsert OpenAPI / Swagger Massal
Menerima payload spesifikasi OpenAPI 3.x atau Swagger 2.0 (JSON) dan secara otomatis membuat/memperbarui Collection, API, Request Scenario, dan Response Scenario.

- **Method & URL**: `POST /api/v1/external/openapi/upsert`
- **Body**:
  ```json
  {
    "projectId": "proj-uuid-001",
    "mode": "upsert", // "upsert" | "merge" | "replace"
    "spec": {
      "openapi": "3.0.3",
      "info": { "title": "Customer Service", "version": "1.0.0" },
      "paths": {
        "/customers": {
          "get": {
            "summary": "List customers",
            "responses": {
              "200": {
                "description": "Success",
                "content": {
                  "application/json": {
                    "example": [{ "id": 1, "name": "Customer A" }]
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
- **Response**:
  ```json
  {
    "success": true,
    "message": "OpenAPI specification imported successfully",
    "data": {
      "importedApiCount": 1,
      "updatedApiCount": 0,
      "importedCollectionCount": 1
    }
  }
  ```

---

## 5. Invalidation Cache

Setiap operasi modifikasi (Upsert API, Scenario, atau OpenAPI) **wajib memicu pembersihan cache internal mock proxy**:
```typescript
import { clearInternalProxyCache } from '@/src/server/mock-proxy/mock-proxy.cache';

// Panggil setelah commit ke database
clearInternalProxyCache();
```
Hal ini memastikan router mock API langsung menyajikan data skenario terbaru tanpa perlu me-restart server.
