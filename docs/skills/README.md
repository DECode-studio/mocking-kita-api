# Mock API Studio - Core Skills Catalog

Katalog skill ini berisi panduan komprehensif, arsitektur teknis, dan implementasi kode untuk pilar utama integrasi, parsing, dan automasi di **Mock API Studio**:

---

## 📚 Daftar Skill

| No | Skill | Lokasi File | Deskripsi Singkat |
|---|---|---|---|
| 1 | **External API Integration** | [`external-api/SKILL.md`](./external-api/SKILL.md) | Panduan integrasi endpoint eksternal (`/api/v1/external/*`), autentikasi JWT & API Key, format respon envelope, dan operasi upsert API/Scenario. |
| 2 | **OpenAPI & Swagger Parser** | [`openapi-parser/SKILL.md`](./openapi-parser/SKILL.md) | Panduan teknis parsing Swagger 2.0 / OpenAPI 3.x JSON, dereferensi `$ref` & `allOf`, sample generator, Matrix Environment, dan strategi merge database. |
| 3 | **Scenario Flow Template & Runner Parser** | [`scenario-flow-parser/SKILL.md`](./scenario-flow-parser/SKILL.md) | Panduan skema template Scenario Flow v1, auto-provisioning API, mesin interpolasi variabel runtime (`{{var}}`), token generator dinamis, Data Sheet counter proxy, dan assertions. |
| 4 | **Insomnia Collection to Scenario Flow Parser** | [`insomnia-parser/SKILL.md`](./insomnia-parser/SKILL.md) | Panduan konversi koleksi Insomnia (YAML/JSON v5) ke Scenario Flow & API catalog: dekonstruksi URL, parsing tag chaining `{% response ... %}`, decode base64 JSONPath, konversi script `afterResponse`, dan topological sort. |

---

## 🛠️ Cara Penggunaan Skill

Setiap folder skill memiliki file `SKILL.md` dengan metadata frontmatter standar. Dokumen ini dapat diakses langsung oleh AI Agent (Antigravity IDE) maupun developer untuk:
- Memahami implementasi dan aturan bisnis yang berlaku di codebase.
- Menulis endpoint baru atau mengintegrasikan platform eksternal.
- Men-debug masalah parsing dokumen OpenAPI, koleksi Insomnia, atau interpolasi template pada Scenario Flow.
