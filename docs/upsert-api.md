# API Contract: Upsert API by Endpoint

Endpoint ini digunakan oleh platform eksternal untuk menambah API baru atau memperbarui API yang sudah ada berdasarkan kombinasi kunci unik `projectId` + `path` + `methodRequest`.

---

## 📌 Endpoint Information

- **HTTP Method**: `PUT`
- **URL Path**: `/api/v1/external/apis/upsert`
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

## 🔄 Logika Upsert

1. Sistem akan mencari data API di database menggunakan kombinasi `(projectId, path, methodRequest)`.
2. **Jika Ditemukan**: Lakukan `UPDATE` pada field `name`, `description`, `collectionId`, dan `status`. Field `updatedAt` akan diperbarui otomatis.
3. **Jika Tidak Ditemukan**: Lakukan `CREATE` API baru.

---

## 📥 Request Schema

### Body Parameters

| Field | Type | Required | Description | Example |
|---|---|---|---|---|
| `projectId` | `string (UUID)` | **Ya** | ID Project tempat API berada | `"a1b2c3d4-e5f6-7890-1234-56789abcdef0"` |
| `collectionId` | `string (UUID)` | Tidak | ID Collection (opsional) | `"b2c3d4e5-f6a7-8901-2345-6789abcdef01"` |
| `name` | `string` | **Ya** | Nama endpoint/API | `"Get User Profile"` |
| `description` | `string` | Tidak | Deskripsi lengkap mengenai API | `"API untuk mengambil profil user"` |
| `path` | `string` | **Ya** | Path endpoint URI (cth: `/v1/users/{id}`) | `"/v1/users/{id}"` |
| `methodRequest` | `string` | **Ya** | HTTP Method (`GET`, `POST`, `PUT`, `DELETE`, `PATCH`, `OPTIONS`, `HEAD`) | `"GET"` |
| `status` | `boolean` | Tidak | Status aktif/non-aktif API (default: `true`) | `true` |

### Sample Request Body
```json
{
  "projectId": "a1b2c3d4-e5f6-7890-1234-56789abcdef0",
  "collectionId": "b2c3d4e5-f6a7-8901-2345-6789abcdef01",
  "name": "Get User Profile",
  "description": "API untuk mengambil profil user",
  "path": "/v1/users/{id}",
  "methodRequest": "GET",
  "status": true
}
```

---

## 📤 Response Schema

### 1. Response Sukses (`200 OK` / `201 Created`)

```json
{
  "success": true,
  "message": "API upserted successfully",
  "action": "CREATED",
  "data": {
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
}
```

### 2. Response Error Bad Request (`400 Bad Request`)

```json
{
  "success": false,
  "error": {
    "code": "BAD_REQUEST",
    "message": "Field 'projectId', 'path', and 'methodRequest' are required"
  }
}
```

### 3. Response Error Unauthorized (`401 Unauthorized`)

```json
{
  "success": false,
  "error": {
    "code": "UNAUTHORIZED",
    "message": "Invalid or missing API key"
  }
}
```
