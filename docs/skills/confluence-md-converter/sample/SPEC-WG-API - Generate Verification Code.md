# SPEC\-WG\-API \- Generate Verification Code

## Spec API Management for KPM WG Generate Verification Code

| **Document Status** | RELEASED |
| --- | --- |
| **Document Owner** | @Jeffri Alfred@Ery Siregar |


---

**Document Changes History**

| **Author** | **Version** | **Revision Date** | **Summary** |
| --- | --- | --- | --- |
| @Jeffri Alfred | 1.0 |  | API Doc |

---

##  Document Objective

Memberikan penjelasan tentang API Management untuk KPM WG Generate Verification Code

##  Business 

Penggunaan dan inisialisasi API Management untuk KPM WG Generate Verification Code

##  Feature Scope

API Scope untuk API Management KPM WG Generate Verification Code

##  Requirement Specification

- Apigee

### **Environment**

| **Development** | **Testing** | **Staging** | **Production** |
| --- | --- | --- | --- |
| <https://dev-api-gateway.kbfinansia.com> | <https://testing-api-gateway.kbfinansia.com> | <https://staging-api-gateway.kbfinansia.com> | <https://api-gateway.kreditplus.com> |

### **Portal**

| **Development** | **Testing** | **Staging** | **Production** |
| --- | --- | --- | --- |
| <https://dev-portal-gateway.kbfinansia.com> | <https://testing-portal-gateway.kbfinansia.com> | <https://staging-portal-gateway.kbfinansia.com> | <https://portal-gateway.kreditplus.com> |

## Generate Verification Code

Description: Generate Verification Code

POST **/v1/kpm-wg/kreditmu/generate-verification-code**

### Headers

| **Parameter** | **Value** |
| --- | --- |
| ApiKey | CLIENT KEY APIGEE |
| Authorization | JWT TOKEN FROM KPM |

Outbound API :

- \[POST\] <https://dev-kpm-v3-wg-api.kbfinansia.com/api/v3/kreditmu/face-compare>

```html
curl --request POST \
  --url 'https://dev-kpm-v3-wg-api.kbfinansia.com/api/v3/kreditmu/generate-verification-code' \
  --header 'Authorization: {{token}}' \
  --header 'content-type: application/json' \
  --data '{
  "device_code": "TnPDlzcfvVOYYjgRvX6IAMnX1q10y7Dxk9mqyA=="
  }'
```

### Payload JSON Body

| **Field** | **Type** | **Validation** | **Description** |
| --- | --- | --- | --- |
| device\_code | string | - required - max=36 | Device Code |

```json
{
  "device_code": "TnPDlzcfvVOYYjgRvX6IAMnX1q10y7Dxk9mqyA=="
}
```

### Response Code

| **HTTP Code** | **Message** | **Custom Code** |
| --- | --- | --- |
| 200 ( Success ) | Operasi berhasil dieksekusi | KPM-WG-000 |
| 400 ( Error Validation ) | permintaan tidak valid, kesalahan muncul ketika permintaan Anda memiliki parameter yang tidak valid. | KPM-WG-280 |
| 401 ( Unauthorized | token tidak valid. | KPM-WG-181 |
| 404 ( Data Not Found ) | Data tidak ditemukan. | KPM-WG-310 |
| 500 ( Internal Server Error ) | terjadi kesalahan, silakan hubungi administrator. | KPM-WG-999 |

### Response

```json
{
  "code": "KPM-WG-000",
  "message": "operasi berhasil dieksekusi",
  "data": {
    "expired_at": "2025-04-17T12:06:50+07:00",
    "session_id": "9bd9607d19fc417c8c9fec597d76272e08233d0ff4f24cf2b561d6808b76faa6",
    "verification_code": "955433"
  },
  "errors": null
}
```

```json
{
  "code": "KPM-WG-280",
  "message": "permintaan tidak valid, kesalahan muncul ketika permintaan Anda memiliki parameter yang tidak valid",
  "data": null,
  "errors": [
    {
      "field": "device_code",
      "message": "device_code wajib diisi"
    }
  ]
}
```

```json
{
    "code": "KPM-WG-280",
    "message": "permintaan tidak valid, kesalahan muncul ketika permintaan Anda memiliki parameter yang tidak valid",
    "data": null,
    "errors": [
        {
            "field": "device_code",
            "message": "device_code maksimal 36 karakter."
        }
    ]
}
```

```json
{
  "code": "KPM-WG-310",
  "message": "data tidak ditemukan",
  "data": null,
  "errors": null,
  "error_helper": {
    "code": "KPM-WG-310",
    "created_at": "2025-04-07T14:50:18Z",
    "description": "Data tidak ditemukan",
    "id": "67f383ba6ba9e529950e0145",
    "service_name": "kpm-v3-wg-api",
    "source_application_name": "KPM",
    "status": "active",
    "title": "kpm",
    "type": "SNACKBAR",
    "updated_at": "2025-04-07T14:50:18Z"
  }
}
```

```json
{
    "code": "KPM-WG-323",
    "message": "Mohon maaf, akun kamu tidak memenuhi syarat untuk lanjut ke proses berikutnya",
    "data": null,
    "errors": null,
    "error_helper": {
        "code": "KPM-WG-323",
        "created_at": "2025-04-07T14:50:21Z",
        "description": "Customer belum terverifikasi",
        "id": "67f383bd6ba9e529950e014a",
        "service_name": "kpm-v3-wg-api",
        "source_application_name": "KPM",
        "status": "active",
        "title": "kpm",
        "type": "SNACKBAR",
        "updated_at": "2025-04-07T14:50:21Z"
    }
}
```

```json
{
  "code": "KPM-WG-181",
  "message": "Token tidak valid",
  "data": null,
  "errors": null
}
```

```json
{
  "code": "KPM-WG-999",
  "message": "Terjadi kesalahan pada sistem, silahkan hubungi administrator",
  "data": null,
  "errors": null,
  "error_helper": {
    "code": "KPM-WG-999",
    "created_at": "2025-03-28T09:19:50Z",
    "description": "Server Error",
    "id": "67e607466ba9e529950e00fe",
    "service_name": "kpm-v3-wg-api",
    "source_application_name": "KPM",
    "status": "active",
    "title": "kpm",
    "type": "SNACKBAR",
    "updated_at": "2025-03-28T09:19:50Z"
  }
}
```

## **Related Document**

- <https://kb-fmf.atlassian.net/wiki/x/HIC4Rw>
