# API Contract: Sign-In / External Authentication

Endpoint ini digunakan oleh platform eksternal untuk melakukan autentikasi menggunakan **email / username** dan **password**. Endpoint ini menghasilkan **JWT Access Token** yang harus disertakan sebagai `Authorization: Bearer <TOKEN>` pada seluruh request API eksternal lainnya.

---

## 📌 Endpoint Information

- **HTTP Method**: `POST`
- **URL Path**: `/api/v1/external/auth/signin`
- **Content-Type**: `application/json`

---

## 🔐 Autentikasi

Endpoint ini bersifat **publik** (tidak memerlukan header autentikasi awal) untuk mendapatkan token akses pertama kali.

---

## 📥 Request Schema

### Body Parameters

| Field | Type | Required | Description | Example |
|---|---|---|---|---|
| `email` | `string` | **Ya** *(atau username)* | Alamat email terdaftar | `"user@example.com"` |
| `username` | `string` | **Ya** *(atau email)* | Username alternatif (opsional jika email diisi) | `"admin"` |
| `password` | `string` | **Ya** | Kata sandi akun | `"P@ssw0rd123!"` |

### Sample Request Body

```json
{
  "email": "admin@example.com",
  "password": "P@ssw0rd123!"
}
```

---

## 📤 Response Schema

### 1. Response Sukses (`200 OK`)

```json
{
  "success": true,
  "message": "Authentication successful",
  "data": {
    "tokenType": "Bearer",
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJhZG1pbiIsImlhdCI6MTc3MzkxMjMwMCwiZXhwIjoxNzczOTk4NzAwfQ.example_signature_hash",
    "expiresIn": 86400,
    "user": {
      "id": "usr-uuid-001",
      "username": "admin",
      "email": "admin@example.com",
      "role": "ADMIN",
      "name": "Administrator"
    }
  }
}
```

### 2. Response Error Credentials Invalid (`401 Unauthorized`)

```json
{
  "success": false,
  "error": {
    "code": "INVALID_CREDENTIALS",
    "message": "Invalid email/username or password"
  }
}
```

### 3. Response Error Bad Request (`400 Bad Request`)

```json
{
  "success": false,
  "error": {
    "code": "BAD_REQUEST",
    "message": "Email/username and password are required"
  }
}
```

---

## 🔑 Cara Penggunaan JWT Token pada Endpoint Eksternal

Setelah mendapatkan `accessToken` dari respon di atas, gunakan token tersebut pada setiap request ke endpoint eksternal Mock API Studio:

```http
GET /api/v1/external/apis?projectId=a1b2c3d4-e5f6-7890-1234-56789abcdef0
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```
