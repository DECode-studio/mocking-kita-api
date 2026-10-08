export const ASSISTANT_TEXT = {
  TITLE: 'AI Assistant & Skill Studio',
  SUBTITLE: 'Tanya jawab cerdas seputar Mocking Kita, konversi tools/skill, dan simulasi flow otomatis.',
  BADGE: 'NVIDIA NIM Powered',
  TABS: {
    CHAT: 'Chat Assistant',
    INSOMNIA: 'Insomnia Converter',
    OPENAPI: 'OpenAPI Generator',
    SIMULATOR: 'Simulator Variabel',
    KNOWLEDGE: 'Knowledge Base',
  },
  PLACEHOLDER: 'Tanyakan apa saja tentang Mocking Kita Studio atau minta buatkan template flow...',
  SESSIONS_TITLE: 'Riwayat Sesi Chat',
  NEW_SESSION: 'Baru',
  MODEL_SELECT_LABEL: 'Pilih Model AI:',
  CLEAR_SESSION: 'Bersihkan Percakapan',
  SEND_BUTTON: 'Kirim',
  STOP_BUTTON: 'Berhenti',
  EMPTY_SESSIONS_HINT: 'Belum ada riwayat sesi.',
  KEY_HINT_ENTER: 'Enter kirim, Shift + Enter baris baru',
  
  CONVERTERS: {
    INSOMNIA_TITLE: 'Insomnia Collection → Scenario Flow Template Converter',
    INSOMNIA_DESC: 'Konversi export koleksi Insomnia (YAML/JSON v4/v5) menjadi Scenario Flow Template JSON v1 standar dengan auto-mapping environment, request scenarios, topological sort, dan ekstraksi variabel tag chaining.',
    INSOMNIA_UPLOAD_BTN: 'Upload File Insomnia',
    INSOMNIA_PASTE_LABEL: 'Paste Insomnia Export (YAML / JSON):',
    INSOMNIA_LOAD_SAMPLE: 'Muat Contoh',
    INSOMNIA_CONVERT_BTN: 'Konversi Sekarang',
    INSOMNIA_RESULT_LABEL: 'Hasil Template JSON (v1):',
    COPY_JSON_BTN: 'Salin JSON',
    COPIED_LABEL: 'Tersalin',
    DOWNLOAD_JSON_BTN: 'Download .json',

    OPENAPI_TITLE: 'OpenAPI / Swagger → Mock API & Scenario Generator',
    OPENAPI_DESC: 'Parse dokumen Swagger 2.0 / OpenAPI 3.x (JSON atau YAML) menjadi daftar endpoint terstruktur, sample mock response payload otomatis, dan pengelompokan koleksi.',
    OPENAPI_UPLOAD_BTN: 'Upload File OpenAPI',
    OPENAPI_PASTE_LABEL: 'Paste OpenAPI / Swagger Document (JSON / YAML):',
    OPENAPI_GENERATE_BTN: 'Generate Mock APIs',
    OPENAPI_RESULT_LABEL: 'Daftar Endpoint & Sample Mock Payload:',

    SIMULATOR_VAR_TITLE: 'Runtime Variable & Token Interpolation Simulator',
    SIMULATOR_VAR_DESC: 'Uji coba penggantian token dinamis {{var}}, generator {{$uuid}}, timestamp, dan Data Sheet iterator.',
    SIMULATOR_VAR_BTN: 'Simulasikan Variabel',

    SIMULATOR_AST_TITLE: 'Assertion Rules & JSONPath Validator Simulator',
    SIMULATOR_AST_DESC: 'Simulasi evaluasi asersi respon API (HTTP Status, response time, dan JSONPath match).',
    SIMULATOR_AST_BTN: 'Uji Asersi',

    KNOWLEDGE_TITLE: 'Mocking Kita Product Knowledge & Skills Catalog',
    KNOWLEDGE_DESC: 'Dokumentasi komprehensif 9 modul produk dan 5 technical skills bawaan Mocking Kita.',
    KNOWLEDGE_SEARCH_PLACEHOLDER: 'Cari dokumentasi & skill...',
    KNOWLEDGE_ASK_AI_BTN: 'Tanyakan ke AI',
  },
};

export const ASSISTANT_SUGGESTIONS = [
  { label: '🚀 Cara buat Scenario Flow', prompt: 'Bagaimana langkah-langkah membuat Scenario Flow berseri dengan ekstraksi token?' },
  { label: '🔄 Format Template v1', prompt: 'Berikan contoh struktur lengkap JSON Scenario Flow Template v1 dengan 2 step API.' },
  { label: '⚡ Variabel {{var}} & Generator', prompt: 'Jelaskan semua sintaksis generator dinamis seperti {{$uuid}}, {{$timestamp}}, dan counter Data Sheet.' },
  { label: '🔑 JWT External API', prompt: 'Bagaimana cara integrasi endpoint External API /api/v1/external/ dengan JWT Bearer Token?' },
  { label: '📦 Impor Koleksi Insomnia', prompt: 'Bagaimana cara konversi koleksi Insomnia YAML/JSON menjadi Scenario Flow di Mocking Kita?' },
];
