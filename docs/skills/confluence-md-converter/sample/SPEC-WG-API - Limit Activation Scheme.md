# SPEC\-WG\-API \- Limit Activation Scheme

## Spec API Management for KPM WG Limit Activation Scheme

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

Memberikan penjelasan tentang API Management untuk KPM WG Limit Activation Scheme

##  Business 

Penggunaan dan inisialisasi API Management untuk KPM WG Limit Activation Scheme

##  Feature Scope

API Scope untuk API Management KPM WG Limit Activation Scheme

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

## Limit Activation Scheme

Description: Limit Activation Scheme

POST **/v1/kpm-wg/kreditmu/limit-activation-scheme**

### Headers

| **Parameter** | **Value** |
| --- | --- |
| ApiKey | CLIENT KEY APIGEE |
| Authorization | JWT TOKEN FROM KPM |

Outbound API :

- \[POST\] <https://dev-kpm-v3-wg-api.kbfinansia.com/api/v3/kreditmu/limit-activation-scheme>

```html
curl --request POST \
  --url 'https://dev-kpm-v3-wg-api.kbfinansia.com/api/v3/kreditmu/limit-activation-scheme' \
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
        "is_registered_kreditmu": true,
        "limit_status": "ACTIVE",
        "verification_limit_status": "VERIFY",
        "verification_schema": {
            "verify_data": {
                "required": true,
                "data_verification": true
            },
            "id_forgery": {
                "required": true,
                "id_forgery_verification": true
            },
            "liveness": {
                "required": true,
                "liveness_verification": true
            },
            "face_compare": {
                "required": true,
                "face_verification": true
            },
            "human": {
                "required": true,
                "human_verification": true
            }
        }
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

- <https://kb-fmf.atlassian.net/wiki/x/FwGsRw>
