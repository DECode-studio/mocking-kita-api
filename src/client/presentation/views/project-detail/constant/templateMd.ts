export const CONFLUENCE_MD_TEMPLATE = `# SPEC-API - Sample Endpoint

## Sample Endpoint

Description: Template import markdown Confluence untuk Mock API Studio

### **Environment**

| **Development** | **Testing** | **Staging** | **Production** |
| --- | --- | --- | --- |
| https://dev-api.example.com | https://testing-api.example.com | https://staging-api.example.com | https://api.example.com |

POST **/v1/sample/endpoint**

### Headers

| **Parameter** | **Value** |
| --- | --- |
| Authorization | Bearer {{token}} |
| Content-Type | application/json |

### Payload JSON Body

| **Field** | **Type** | **Validation** | **Description** |
| --- | --- | --- | --- |
| name | string | - required | Nama entitas |
| status | string | - optional | Status entitas |

\`\`\`json
{
  "name": "Contoh Permintaan",
  "status": "ACTIVE"
}
\`\`\`

### Response Code

| **HTTP Code** | **Message** | **Custom Code** |
| --- | --- | --- |
| 200 ( Success ) | Operasi berhasil dieksekusi | EXP-000 |
| 400 ( Bad Request ) | Permintaan tidak valid | EXP-280 |
| 404 ( Not Found ) | Data tidak ditemukan | EXP-310 |
| 500 ( Internal Server Error ) | Terjadi kesalahan pada server | EXP-999 |

### Response

\`\`\`json
{
  "code": "EXP-000",
  "message": "Operasi berhasil dieksekusi",
  "data": {
    "id": 1,
    "name": "Contoh Permintaan",
    "status": "ACTIVE"
  }
}
\`\`\`

\`\`\`json
{
  "code": "EXP-280",
  "message": "Permintaan tidak valid",
  "data": null,
  "errors": [
    {
      "field": "name",
      "message": "name wajib diisi"
    }
  ]
}
\`\`\`

\`\`\`json
{
  "code": "EXP-310",
  "message": "Data tidak ditemukan",
  "data": null
}
\`\`\`

\`\`\`json
{
  "code": "EXP-999",
  "message": "Terjadi kesalahan pada server",
  "data": null,
  "errors": null
}
\`\`\`
`;

