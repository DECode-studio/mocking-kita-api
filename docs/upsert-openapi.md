# API Contract: Upsert Swagger / OpenAPI JSON

Endpoint ini digunakan oleh platform eksternal untuk meng-import atau melakukan **upsert massal** daftar API, Request Scenarios, dan Response Scenarios langsung dari dokumen spesifikasi **Swagger (OpenAPI 2.0)** atau **OpenAPI 3.x (JSON/YAML)**.

---

## 📌 Endpoint Information

- **HTTP Method**: `POST`
- **URL Path**: `/api/v1/external/openapi/upsert`
- **Content-Type**: `application/json`

---

## 🔐 Autentikasi

Header wajib:
```http
x-api-key: <YOUR_EXTERNAL_API_KEY>
```
atau
```http
Authorization: Bearer <YOUR_EXTERNAL_API_TOKEN>
```

---

## 🔄 Logika Mode Upsert / Import

| Mode | Deskripsi |
|---|---|
| `upsert` *(default)* | Memperbarui API & Scenario yang sudah ada (berdasarkan path + method) dan menambahkan yang baru tanpa menghapus data lain. |
| `merge` | Hanya menambahkan API & Scenario baru. Data yang sudah ada tidak akan diubah/ditimpa. |
| `replace` | Menghapus semua API & Scenario lama dalam project tersebut, lalu menggantikannya dengan isi dokumen OpenAPI baru. |

---

## 📥 Request Schema

### Body Parameters

| Field | Type | Required | Description | Example |
|---|---|---|---|---|
| `projectId` | `string (UUID)` | **Ya** | ID Project target | `"a1b2c3d4-e5f6-7890-1234-56789abcdef0"` |
| `mode` | `string` | Tidak | Mode import (`upsert`, `merge`, `replace`, default: `upsert`) | `"upsert"` |
| `openApiJson` | `object` / `string` | **Ya** | Dokumen Swagger/OpenAPI spec dalam bentuk JSON Object atau JSON String | `{ "openapi": "3.0.0", ... }` |

### Sample Request Body

```json
{
  "projectId": "a1b2c3d4-e5f6-7890-1234-56789abcdef0",
  "mode": "upsert",
  "openApiJson": {
    "openapi": "3.0.0",
    "info": {
      "title": "Payment Service Mock",
      "version": "1.0.0"
    },
    "paths": {
      "/v1/payments/charge": {
        "post": {
          "summary": "Process Payment Charge",
          "requestBody": {
            "content": {
              "application/json": {
                "schema": {
                  "type": "object",
                  "properties": {
                    "amount": { "type": "number", "example": 150000 },
                    "currency": { "type": "string", "example": "IDR" }
                  }
                }
              }
            }
          },
          "responses": {
            "200": {
              "description": "Payment Successful",
              "content": {
                "application/json": {
                  "example": {
                    "transactionId": "TRX-998811",
                    "status": "SUCCESS"
                  }
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

## 📤 Response Schema

### 1. Response Sukses (`200 OK` / `201 Created`)

```json
{
  "success": true,
  "message": "OpenAPI specification imported/upserted successfully",
  "data": {
    "projectId": "a1b2c3d4-e5f6-7890-1234-56789abcdef0",
    "mode": "upsert",
    "importedApis": 1,
    "importedRequestScenarios": 1,
    "importedResponseScenarios": 1,
    "details": [
      {
        "apiId": "c3d4e5f6-a7b8-9012-3456-789abcdef012",
        "path": "/v1/payments/charge",
        "methodRequest": "POST",
        "action": "CREATED"
      }
    ]
  }
}
```

### 2. Response Error (`400 Bad Request`)

```json
{
  "success": false,
  "error": {
    "code": "BAD_REQUEST",
    "message": "Invalid OpenAPI JSON format or missing required field 'projectId'"
  }
}
```

### 3. Response Error (`404 Not Found`)

```json
{
  "success": false,
  "error": {
    "code": "NOT_FOUND",
    "message": "Project with ID 'a1b2c3d4-e5f6-7890-1234-56789abcdef0' not found"
  }
}
```
