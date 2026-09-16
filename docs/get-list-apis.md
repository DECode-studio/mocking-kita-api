# API Contract: Get List API

Endpoint ini digunakan oleh platform eksternal untuk mengambil daftar API yang terdaftar dalam Mock API Studio.

---

## 📌 Endpoint Information

- **HTTP Method**: `GET`
- **URL Path**: `/api/v1/external/apis`

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

## 📥 Query Parameters

| Parameter | Type | Required | Description | Default | Example |
|---|---|---|---|---|---|
| `projectId` | `string (UUID)` | **Ya** | ID Project | - | `"a1b2c3d4-e5f6-7890-1234-56789abcdef0"` |
| `collectionId` | `string (UUID)` | Tidak | Filter berdasarkan Collection ID | - | `"b2c3d4e5-f6a7-8901-2345-6789abcdef01"` |
| `search` | `string` | Tidak | Pencarian nama atau path API | - | `"user"` |
| `page` | `integer` | Tidak | Halaman pagination | `1` | `1` |
| `limit` | `integer` | Tidak | Jumlah item per halaman | `20` | `20` |

### Sample Request URL
```http
GET /api/v1/external/apis?projectId=a1b2c3d4-e5f6-7890-1234-56789abcdef0&search=users&page=1&limit=20
```

---

## 📤 Response Schema

### 1. Response Sukses (`200 OK`)

```json
{
  "success": true,
  "data": [
    {
      "id": "c3d4e5f6-a7b8-9012-3456-789abcdef012",
      "projectId": "a1b2c3d4-e5f6-7890-1234-56789abcdef0",
      "collectionId": "b2c3d4e5-f6a7-8901-2345-6789abcdef01",
      "name": "Get User Profile",
      "description": "API untuk mengambil profil user",
      "path": "/v1/users/{id}",
      "methodRequest": "GET",
      "status": true,
      "createdAt": "2026-09-16T09:30:00.000Z",
      "updatedAt": "2026-09-16T09:30:00.000Z"
    }
  ],
  "pagination": {
    "total": 1,
    "page": 1,
    "limit": 20,
    "totalPages": 1
  }
}
```

### 2. Response Error (`400 Bad Request`)

```json
{
  "success": false,
  "error": {
    "code": "BAD_REQUEST",
    "message": "Query parameter 'projectId' is required"
  }
}
```
