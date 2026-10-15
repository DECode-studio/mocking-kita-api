export const SAMPLE_OPENAPI_PAYLOAD = `{
  "openapi": "3.0.3",
  "info": {
    "title": "Payment & Order Gateway",
    "version": "1.0.0"
  },
  "servers": [
    { "url": "https://api.mockingkita.com/v1" }
  ],
  "paths": {
    "/orders": {
      "post": {
        "tags": ["Orders"],
        "summary": "Create new order transaction",
        "requestBody": {
          "required": true,
          "content": {
            "application/json": {
              "schema": {
                "type": "object",
                "properties": {
                  "amount": { "type": "integer", "example": 150000 },
                  "customerEmail": { "type": "string", "format": "email" }
                }
              }
            }
          }
        },
        "responses": {
          "201": {
            "description": "Order created successfully",
            "content": {
              "application/json": {
                "schema": {
                  "type": "object",
                  "properties": {
                    "orderId": { "type": "string", "format": "uuid" },
                    "status": { "type": "string", "enum": ["PENDING", "PAID"] },
                    "createdAt": { "type": "string", "format": "date-time" }
                  }
                }
              }
            }
          }
        }
      },
      "get": {
        "tags": ["Orders"],
        "summary": "List customer orders",
        "responses": {
          "200": {
            "description": "List of orders",
            "content": {
              "application/json": {
                "schema": {
                  "type": "array",
                  "items": {
                    "type": "object",
                    "properties": {
                      "orderId": { "type": "string", "format": "uuid" },
                      "amount": { "type": "integer" }
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
}`;

export const SAMPLE_INSOMNIA_PAYLOAD = `{
  "_type": "export",
  "__export_format": 4,
  "__export_date": "2026-10-08T00:00:00.000Z",
  "resources": [
    {
      "_id": "wrk_1",
      "_type": "workspace",
      "name": "Auth & Profile Service"
    },
    {
      "_id": "env_base",
      "_type": "environment",
      "name": "Base Environment",
      "data": {
        "baseUrl": "https://api-dev.mockingkita.com"
      }
    },
    {
      "_id": "req_login",
      "_type": "request",
      "name": "User Login",
      "method": "POST",
      "url": "{{baseUrl}}/v1/auth/login",
      "headers": [
        { "name": "Content-Type", "value": "application/json" }
      ],
      "body": {
        "mimeType": "application/json",
        "text": "{\\"username\\": \\"admin@mockingkita.com\\", \\"password\\": \\"secret123\\"}"
      }
    },
    {
      "_id": "req_profile",
      "_type": "request",
      "name": "Get User Profile",
      "method": "GET",
      "url": "{{baseUrl}}/v1/users/me",
      "headers": [
        { "name": "Authorization", "value": "Bearer {% response 'body', 'req_login', 'b64::JC5kYXRhLnRva2Vu::46bf', 'never', 60 %}" }
      ]
    }
  ]
}`;

export const SAMPLE_PAYLOAD_TO_INTERPOLATE = `{
  "transactionId": "{{$uuid}}",
  "timestamp": "{{$timestamp}}",
  "createdAt": "{{$isoDate}}",
  "user": {
    "name": "{{defaultUserName}}",
    "phone": "{{datasheet.customers.next.phoneNumber}}",
    "role": "{{userRole}}"
  },
  "authToken": "Bearer {{authToken}}"
}`;

export const SAMPLE_VARIABLES = `{
  "defaultUserName": "Budi Pratama",
  "userRole": "SUPER_ADMIN",
  "authToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}`;

export const SAMPLE_DATASHEET = `{
  "phoneNumber": "081298765432",
  "email": "budi.pratama@example.com"
}`;

export const SAMPLE_ACTUAL_RESPONSE_BODY = `{
  "code": "SUCCESS",
  "message": "User verified successfully",
  "data": {
    "userId": "usr_99812",
    "status": "ACTIVE"
  }
}`;

export const DEFAULT_SIMULATION_ASSERTIONS = [
  {
    type: 'STATUS_CODE' as const,
    operator: 'EQUALS' as const,
    expectedValue: '200',
    message: 'Status code harus sama dengan 200 (OK)',
  },
  {
    type: 'RESPONSE_TIME' as const,
    operator: 'LESS_THAN' as const,
    expectedValue: '500',
    message: 'Response time harus di bawah 500ms',
  },
  {
    type: 'JSON_PATH' as const,
    property: '$.code',
    operator: 'EQUALS' as const,
    expectedValue: 'SUCCESS',
    message: 'Field $.code harus bernilai "SUCCESS"',
  },
  {
    type: 'JSON_PATH' as const,
    property: '$.data.status',
    operator: 'EQUALS' as const,
    expectedValue: 'ACTIVE',
    message: 'Status user harus bernilai "ACTIVE"',
  },
];

