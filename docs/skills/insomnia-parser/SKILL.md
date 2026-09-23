---
name: insomnia-to-scenario-flow-parser
description: Panduan konversi ekspor Insomnia YAML/JSON v5 menjadi Scenario Flow Template JSON Mock API Studio, termasuk mapping folder/API, request/response scenario, environment/subEnvironment, response chaining, dan batasan import saat ini.
---

# Skill: Insomnia Collection to Scenario Flow Template

Skill ini digunakan saat mengubah ekspor **Insomnia Collection** seperti `.extra/reff/Insomnia_LOS_CMS_simplified.yaml` menjadi **Scenario Flow Template JSON** yang bisa di-import oleh Mock API Studio.

## Status Implementasi Saat Ini

Import Scenario Flow di aplikasi **belum menerima YAML Insomnia langsung**. UI import hanya membaca dan memvalidasi JSON template. Karena itu pipeline yang benar adalah:

```text
Insomnia YAML/JSON
  -> pre-converter Insomnia
  -> mock-api-studio/scenario-flow/v1 JSON template
  -> importScenarioFlowFromTemplate(projectId, template)
```

Jangan menganggap file `.yaml` Insomnia dapat langsung dikirim ke endpoint import flow. Converter Insomnia harus menghasilkan template JSON dengan kontrak `FlowExportTemplate`.

Kode utama yang harus dijadikan acuan:

- `src/client/presentation/views/scenario-flows/components/ImportScenarioFlowModal.tsx`: import UI menerima JSON.
- `src/server/scenario-flow/scenario-flow.types.ts`: kontrak `FlowExportTemplate`, `VariableExtractor`, dan `AssertionRule`.
- `src/server/scenario-flow/scenario-flow.import-export.ts`: smart upsert environment, collection, API, request scenario, response scenario, dan step.
- `src/server/scenario-flow/scenario-flow.runner.ts`: runtime interpolation, extractor, assertion, dynamic token, dan data sheet token.
- `docs/skills/insomnia-parser/convert_insomnia.py`: helper converter Python untuk menjalankan konversi.
- `docs/skills/insomnia-parser/requirements.txt`: dependency converter (`PyYAML`).

Untuk menjalankan converter:

```bash
python3 -m pip install -r docs/skills/insomnia-parser/requirements.txt
python3 docs/skills/insomnia-parser/convert_insomnia.py \
  .extra/reff/Insomnia_LOS_CMS_simplified.yaml \
  --output .extra/reff/insomnia_los_cms_scenario_flow.json
```

## Target Output Template

Converter Insomnia harus menghasilkan JSON seperti:

```json
{
  "$schema": "mock-api-studio/scenario-flow/v1",
  "version": "1.0",
  "exportedAt": "2026-09-22T00:00:00.000Z",
  "environments": [],
  "flow": {
    "name": "LOS",
    "description": "Converted from Insomnia collection",
    "stopOnFailure": true,
    "variables": {}
  },
  "steps": []
}
```

Setiap step minimal memiliki:

```json
{
  "order": 1,
  "name": "Province",
  "enabled": true,
  "api": {
    "method": "GET",
    "path": "/api/v2/master-data/area/province",
    "name": "Province",
    "collection": "LOS CMS / Master Data (MDM) / Common / Area",
    "targetEnvironment": "MDM_API_AREA_URL"
  },
  "requestScenario": {
    "name": "Province Scenario",
    "headers": {},
    "queryParams": {},
    "pathParams": {},
    "body": {},
    "bodyType": "NONE"
  },
  "expectedResponseScenario": {
    "statusCode": 200,
    "headers": {},
    "body": {}
  },
  "overrides": {},
  "extractors": [],
  "assertions": [
    { "type": "statusCode", "operator": "equals", "expected": 200 }
  ]
}
```

## Insomnia Reference Shape

Reference `Insomnia_LOS_CMS_simplified.yaml` memakai format:

- Root: `type: collection.insomnia.rest/5.0`, `schema_version: '5.1'`, `collection`.
- Folder: object dengan `name`, `meta`, dan `children`.
- Request: object dengan `url`, `name`, `meta.id`, `method`, `parameters`, `headers`, optional `body`, `scripts`, dan `settings`.
- Environment: `environments.name`, `environments.data`, dan `environments.subEnvironments[]`.

Pada file LOS CMS, `environments.data` bisa kosong dan nilai penting berada di `subEnvironments`, misalnya `Dev.data.MDM_API_AREA_URL`, `LOS_AUTH_API_BASE_URL`, `LOS_HEADER_PRIVATE_KEY`, dan service base URL lain. Converter wajib membaca `subEnvironments`, bukan hanya `environments.data`.

## Mapping Environment

Insomnia environment harus dikonversi menjadi `template.environments`.

Aturan yang direkomendasikan:

- Setiap base URL variable Insomnia, misalnya `MDM_API_AREA_URL`, `LOS_KMB_API_BASE_URL`, atau `LOS_AUTH_API_BASE_URL`, menjadi satu environment item dengan `id` sama dengan key variable.
- Isi `values.DEVELOPMENT`, `values.TESTING`, `values.STAGING`, atau `values.PRODUCTION` dari `subEnvironments` jika nama sub-environment dapat dipetakan ke stage.
- Jika stage tidak jelas, pakai `DEVELOPMENT` sebagai fallback.
- Untuk variable non-base-url seperti API key, token placeholder, private key, atau branch id, masukkan ke `variables` environment atau `flow.variables`, sesuai kebutuhan runtime.
- Script `preRequest` dan `afterResponse` juga termasuk sumber environment yang harus diparse:
  - `insomnia.environment.get("KEY")` menandai `KEY` sebagai required runtime variable dan harus masuk `flow.variables` jika bukan base URL.
  - `insomnia.environment.set("KEY", value)` menandai `KEY` sebagai produced runtime variable dan harus masuk `flow.variables` jika bukan base URL.
  - Jika `set()` mengambil nilai dari `response...`, tambahkan juga `VariableExtractor` pada step tersebut.
- Untuk environment base URL, gunakan `isBaseUrl: true`.

Contoh:

```json
{
  "id": "MDM_API_AREA_URL",
  "name": "MDM_API_AREA_URL",
  "isBaseUrl": true,
  "environmentType": "DEVELOPMENT",
  "values": {
    "LOCAL": null,
    "DEVELOPMENT": "https://dev-masterdata-area.kbfinansia.com",
    "TESTING": null,
    "STAGING": null,
    "PRODUCTION": null
  },
  "variables": [],
  "isDefault": false
}
```

Import engine akan mencoba mencocokkan `api.environmentIds`, `api.environments`, `api.targetEnvironment`, `api.environmentName`, atau `api.service` dengan environment yang ada. Untuk hasil Insomnia, isi `api.targetEnvironment` dengan variable base URL dari URL Insomnia, misalnya `MDM_API_AREA_URL`.

## Mapping URL, API, dan Collection

URL Insomnia biasanya berbentuk:

```text
{{ _.MDM_API_AREA_URL }}/api/v2/master-data/area/province
```

Parsing:

- `MDM_API_AREA_URL` menjadi `api.targetEnvironment`.
- `/api/v2/master-data/area/province` menjadi `api.path`.
- `method` menjadi `api.method`.
- Request `name` menjadi `api.name` dan default step name.
- Folder parent digabung menjadi `api.collection`, misalnya `LOS CMS / Master Data (MDM) / Common / Area`.

Gunakan regex:

```ts
/^\{\{\s*(?:_\.)?([a-zA-Z0-9_-]+)\s*\}\}(.*)$/
```

Jika URL absolut langsung, parse dengan `new URL(rawUrl)`: `origin` dapat menjadi environment base URL baru, dan `pathname + search` menjadi path/query sumber.

URL dapat mengandung `{% response %}` di path. Converter harus mengganti tag itu menjadi `{{variableName}}` dan menambahkan extractor pada source request.

## Mapping Request Scenario

Insomnia arrays harus dinormalisasi menjadi object map:

- `headers[]` -> `requestScenario.headers`.
- `parameters[]` -> `requestScenario.queryParams`.
- Path token hasil parsing URL atau `{% response %}` di path -> `requestScenario.pathParams` atau langsung `api.path`/`overrides.path` dengan `{{variableName}}`, sesuai bentuk URL internal yang diinginkan.
- `body.text` JSON valid -> parse menjadi object.
- `body.text` JSON invalid atau mengandung nilai raw yang tetap valid setelah replacement -> simpan string jika parse gagal.
- Tidak ada body -> `bodyType: "NONE"`.

Field disabled di Insomnia harus diabaikan.

## Response Chaining `{% response %}`

Insomnia menyisipkan dependency antar-request dengan tag:

```text
{% response 'body', 'req_source_id', 'b64::JC5kYXRhWzBdLmlk::46b', 'when-expired', 300 %}
```

Aturan:

- `body` -> extractor `from: "body"`.
- `header` -> extractor `from: "headers"`.
- Decode filter `b64::<base64>::46b` menjadi JSONPath.
- Normalisasi JSONPath dari `$.data[0].id` menjadi `data.0.id` atau `data[0].id`; runner mendukung bracket dan dot notation.
- Buat nama variable stabil dan unik, misalnya `req_7ee4d29c910541c0b12b595ba9781edf_data_0_province_id`.
- Tambahkan extractor ke step source request.
- Ganti tag di target request dengan `{{variableName}}`.
- Catat dependency `source -> target`.

Regex dasar:

```ts
/\{%\s*response\s*['"]?(body|header)['"]?\s*,\s*['"]([^'"]+)['"]\s*,\s*['"]([^'"]+)['"][^%]*%\}/g
```

Gunakan regex yang toleran terhadap quote ganda YAML (`''`) setelah YAML di-load, karena YAML parser biasanya mengembalikan string normal dengan single quote.

## Step Ordering

Jangan hanya memakai traversal order. Converter harus melakukan ordering dengan dependency graph:

1. Traverse semua request dan simpan `meta.id`.
2. Scan body, header, parameter, dan URL untuk `{% response %}`.
3. Bentuk edge `sourceReqId -> targetReqId`.
4. Jalankan topological sort.
5. Jika ada cycle atau missing source, pertahankan request terkait di posisi sortKey/folder order dan beri warning metadata/log.
6. Fallback tie-breaker: `meta.sortKey`, lalu urutan traversal asli.

Nilai `step.order` harus mengikuti hasil sort.

## Script Insomnia

Mock API Studio tidak menjalankan `scripts.preRequest` atau `scripts.afterResponse` JavaScript Insomnia.

Mapping yang aman:

- `insomnia.environment.get("name")` di `preRequest` atau `afterResponse` harus dicatat sebagai environment read dan dimasukkan ke `flow.variables` jika bukan base URL.
- `insomnia.environment.set("name", value)` di `preRequest` atau `afterResponse` harus dicatat sebagai environment write dan dimasukkan ke `flow.variables` sebagai runtime-produced variable jika bukan base URL.
- `afterResponse` dengan pola `insomnia.environment.set("name", response.data.token)` dapat dikonversi menjadi `extractors` sekaligus dicatat sebagai environment write.
- `insomnia.test(...)` dapat dikonversi ke assertion sederhana jika pola jelas, terutama status code.
- `preRequest` yang membuat header dinamis seperti HMAC `x-request-id` tidak otomatis bisa dieksekusi. Pilihan aman adalah:
  - abaikan dan catat warning,
  - map ke dynamic token bawaan jika setara (`{{$uuid}}`, `{{$timestamp}}`, `{{$isoDate}}`, `{{$randomInt}}`, `{{$randomEmail}}`),
  - atau tambahkan dukungan runner/generator khusus sebelum mengklaim konversi penuh.

Untuk file LOS CMS, banyak request memakai `preRequest` HMAC `x-request-id` dengan `LOS_HEADER_PRIVATE_KEY`; skill/converter harus menandai ini sebagai unsupported atau membutuhkan generator khusus.

## Data Sheet

Scenario Flow runner mendukung token:

```text
{{datasheet.<sheetCode>.random.<property>}}
{{datasheet.<sheetCode>.next.<property>}}
{{datasheet.<sheetCode>.asc.<property>}}
{{datasheet.<sheetCode>.desc.<property>}}
{{datasheet.<sheetCode>.<index>.<property>}}
```

Namun import Scenario Flow tidak otomatis membuat entity Data Sheet. Jika converter ingin menggunakan data sheet, masukkan data ke `flow.variables.datasheet` untuk runtime template, atau buat Data Sheet lewat fitur/repository Data Sheet terpisah. Jangan klaim Insomnia import otomatis memprovision Data Sheet kecuali implementasinya sudah ditambahkan.

## Import Behavior Mock API Studio

`importScenarioFlowFromTemplate(projectId, template)` melakukan:

- Validasi minimal `template.flow.name`.
- Upsert environment dari `template.environments`.
- Jika environment tidak ada, infer dari `flow.variables.apigeeBaseUrl`, `flow.variables.baseUrl`, dan `flow.variables.kpmBaseUrl`.
- Upsert collection berdasarkan `api.collection`.
- Upsert API berdasarkan key `METHOD::PATH`.
- Membuat request scenario dari `step.requestScenario` atau legacy `step.requestPayload`.
- Membuat response scenario dari `step.expectedResponseScenario` atau legacy `step.responsePayload`.
- Mengganti step flow lama saat nama flow sama dalam project yang sama.
- Menyimpan `extractors`, `assertions`, `targetEnvironment`, dan `targetEnvironmentType`.

Karena import API key API berdasarkan `METHOD::PATH`, pastikan hasil converter menormalisasi path secara konsisten agar tidak membuat duplikat.

## Minimal Converter Checklist

Sebelum hasil JSON dianggap siap import:

- File YAML/JSON Insomnia berhasil di-load.
- Semua request memiliki `meta.id` atau generated id stabil.
- Folder hierarchy sudah menjadi `api.collection`.
- URL base variable sudah menjadi environment dan `api.targetEnvironment`.
- `subEnvironments` sudah diproses.
- Headers, query params, path params, body, dan body type sudah terisi.
- Semua `{% response %}` di URL/header/query/body sudah diganti menjadi `{{variable}}`.
- Extractor source request sudah dibuat.
- Step order sudah topological, bukan sekadar traversal.
- Unsupported `preRequest` menghasilkan warning.
- Output adalah JSON valid dengan `$schema: "mock-api-studio/scenario-flow/v1"`.
