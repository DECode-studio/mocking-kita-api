import { mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { DatabaseSync } from 'node:sqlite';

const DB_PATH = resolve(process.cwd(), '.data/mock-api-studio.sqlite');

mkdirSync(dirname(DB_PATH), { recursive: true });

const db = new DatabaseSync(DB_PATH);
db.exec('PRAGMA busy_timeout = 5000;');
db.exec('PRAGMA journal_mode = WAL;');
db.exec('PRAGMA foreign_keys = ON;');
db.exec(`
  CREATE TABLE IF NOT EXISTS tblProject (
    id TEXT PRIMARY KEY,
    name TEXT,
    description TEXT,
    status INTEGER DEFAULT 1,
    created_at TEXT,
    updated_at TEXT,
    deleted_at TEXT
  );

  CREATE TABLE IF NOT EXISTS tblEnvironment (
    id TEXT PRIMARY KEY,
    project_id TEXT,
    name TEXT,
    environment_type TEXT,
    public_base_url TEXT,
    origin_base_url TEXT,
    status INTEGER DEFAULT 1,
    created_at TEXT,
    updated_at TEXT,
    deleted_at TEXT,
    FOREIGN KEY (project_id) REFERENCES tblProject (id)
  );

  CREATE TABLE IF NOT EXISTS tblCollection (
    id TEXT PRIMARY KEY,
    project_id TEXT,
    name TEXT,
    description TEXT,
    status INTEGER DEFAULT 1,
    created_at TEXT,
    updated_at TEXT,
    deleted_at TEXT,
    FOREIGN KEY (project_id) REFERENCES tblProject (id)
  );

  CREATE TABLE IF NOT EXISTS tblApi (
    id TEXT PRIMARY KEY,
    project_id TEXT,
    collection_id TEXT,
    name TEXT,
    description TEXT,
    path TEXT,
    method_request TEXT,
    status INTEGER DEFAULT 1,
    created_at TEXT,
    updated_at TEXT,
    deleted_at TEXT,
    FOREIGN KEY (project_id) REFERENCES tblProject (id),
    FOREIGN KEY (collection_id) REFERENCES tblCollection (id) ON DELETE SET NULL
  );

  CREATE TABLE IF NOT EXISTS tblApiEnvironment (
    id TEXT PRIMARY KEY,
    api_id TEXT,
    environment_id TEXT,
    enabled INTEGER DEFAULT 1,
    path_override TEXT,
    created_at TEXT,
    updated_at TEXT,
    FOREIGN KEY (api_id) REFERENCES tblApi (id),
    FOREIGN KEY (environment_id) REFERENCES tblEnvironment (id)
  );

  CREATE TABLE IF NOT EXISTS tblRequestScenario (
    id TEXT PRIMARY KEY,
    api_id TEXT,
    name TEXT,
    description TEXT,
    headers TEXT,
    query_params TEXT,
    path_params TEXT,
    body TEXT,
    body_type TEXT DEFAULT 'JSON',
    match_type TEXT DEFAULT 'EXACT',
    priority INTEGER DEFAULT 0,
    status INTEGER DEFAULT 1,
    created_at TEXT,
    updated_at TEXT,
    deleted_at TEXT,
    FOREIGN KEY (api_id) REFERENCES tblApi (id)
  );

  CREATE TABLE IF NOT EXISTS tblResponseScenario (
    id TEXT PRIMARY KEY,
    request_scenario_id TEXT,
    name TEXT,
    description TEXT,
    status_code INTEGER,
    headers TEXT,
    body TEXT,
    response_type TEXT DEFAULT 'JSON',
    file_path TEXT,
    file_name TEXT,
    delay_ms INTEGER DEFAULT 0,
    weight INTEGER DEFAULT 100,
    priority INTEGER DEFAULT 0,
    status INTEGER DEFAULT 1,
    created_at TEXT,
    updated_at TEXT,
    deleted_at TEXT,
    FOREIGN KEY (request_scenario_id) REFERENCES tblRequestScenario (id)
  );

  CREATE UNIQUE INDEX IF NOT EXISTS tblApi_index_0 ON tblApi (project_id, path, method_request);
  CREATE UNIQUE INDEX IF NOT EXISTS tblApiEnvironment_index_1 ON tblApiEnvironment (api_id, environment_id);

  CREATE TABLE IF NOT EXISTS tblAccount (
    id TEXT PRIMARY KEY,
    username TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    role TEXT NOT NULL,
    name TEXT NOT NULL,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS tblChangeLog (
    id TEXT PRIMARY KEY,
    action TEXT NOT NULL,
    entity_type TEXT NOT NULL,
    entity_id TEXT,
    project_id TEXT,
    user_id TEXT,
    operator TEXT NOT NULL,
    description TEXT,
    before_state TEXT,
    after_state TEXT,
    metadata TEXT,
    created_at TEXT NOT NULL,
    FOREIGN KEY (user_id) REFERENCES tblAccount (id) ON DELETE SET NULL
  );

  CREATE INDEX IF NOT EXISTS tblChangeLog_project_id_idx ON tblChangeLog (project_id);
  CREATE INDEX IF NOT EXISTS tblChangeLog_created_at_idx ON tblChangeLog (created_at DESC);
`);

try {
  db.exec('ALTER TABLE tblApi ADD COLUMN collection_id TEXT REFERENCES tblCollection (id) ON DELETE SET NULL;');
} catch {
  // Ignore if column already exists
}

try {
  db.exec("ALTER TABLE tblRequestScenario ADD COLUMN body_type TEXT DEFAULT 'JSON';");
} catch {
  // Ignore if column already exists
}

try {
  db.exec("ALTER TABLE tblResponseScenario ADD COLUMN response_type TEXT DEFAULT 'JSON';");
} catch {
  // Ignore if column already exists
}

try {
  db.exec("ALTER TABLE tblResponseScenario ADD COLUMN file_path TEXT;");
} catch {
  // Ignore if column already exists
}

try {
  db.exec("ALTER TABLE tblResponseScenario ADD COLUMN file_name TEXT;");
} catch {
  // Ignore if column already exists
}

export { db };
export default db;
