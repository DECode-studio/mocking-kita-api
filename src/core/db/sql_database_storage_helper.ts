import prisma from '@/src/core/db/prisma-client';

function escapeSqlString(val: string | null | undefined): string {
  if (val === null || val === undefined) return 'NULL';
  return `'${val.replace(/'/g, "''")}'`;
}

function escapeSqlDate(val: Date | string | null | undefined): string {
  if (!val) return 'NULL';
  const iso = val instanceof Date ? val.toISOString() : new Date(val).toISOString();
  return `'${iso}'::timestamptz`;
}

function escapeSqlBoolean(val: boolean | null | undefined): string {
  if (val === null || val === undefined) return 'TRUE';
  return val ? 'TRUE' : 'FALSE';
}

function escapeSqlNumber(val: number | null | undefined, fallback = '0'): string {
  if (val === null || val === undefined || isNaN(val)) return fallback;
  return String(val);
}

function escapeSqlJson(val: unknown): string {
  if (val === null || val === undefined) return 'NULL';
  try {
    const jsonStr = JSON.stringify(val);
    return `'${jsonStr.replace(/'/g, "''")}'::jsonb`;
  } catch {
    return "'{}'::jsonb";
  }
}

/**
 * Generates a full PostgreSQL SQL dump file content.
 */
export async function generateDatabaseSqlDump(mode: 'upsert' | 'replace' = 'upsert'): Promise<string> {
  const projects = await prisma.project.findMany({ orderBy: [{ createdAt: 'asc' }, { id: 'asc' }] });
  const environments = await prisma.environment.findMany({ orderBy: [{ createdAt: 'asc' }, { id: 'asc' }] });
  const collections = await prisma.collection.findMany({ orderBy: [{ createdAt: 'asc' }, { id: 'asc' }] });
  const apis = await prisma.api.findMany({ orderBy: [{ createdAt: 'asc' }, { id: 'asc' }] });
  const apiEnvironments = await prisma.apiEnvironment.findMany({ orderBy: [{ createdAt: 'asc' }, { id: 'asc' }] });
  const requestScenarios = await prisma.requestScenario.findMany({
    orderBy: [{ priority: 'desc' }, { createdAt: 'asc' }, { id: 'asc' }],
  });
  const responseScenarios = await prisma.responseScenario.findMany({
    orderBy: [{ priority: 'desc' }, { createdAt: 'asc' }, { id: 'asc' }],
  });

  const nowIso = new Date().toISOString();
  const chunks: string[] = [
    `-- ========================================================`,
    `-- Mock API Studio - PostgreSQL SQL Database Backup`,
    `-- Generated At: ${nowIso}`,
    `-- Total Projects: ${projects.length} | Endpoints: ${apis.length} | Scenarios: ${responseScenarios.length}`,
    `-- ========================================================`,
    ``,
    `BEGIN;`,
    ``,
  ];

  if (mode === 'replace') {
    chunks.push(
      `-- Clean existing records before restoring (Replace Mode)`,
      `DELETE FROM "tblResponseScenario";`,
      `DELETE FROM "tblRequestScenario";`,
      `DELETE FROM "tblApiEnvironment";`,
      `DELETE FROM "tblApi";`,
      `DELETE FROM "tblCollection";`,
      `DELETE FROM "tblEnvironment";`,
      `DELETE FROM "tblProject";`,
      ``
    );
  }

  // 1. tblProject
  if (projects.length > 0) {
    chunks.push(`-- 1. Projects (${projects.length} rows)`);
    for (const p of projects) {
      chunks.push(
        `INSERT INTO "tblProject" ("id", "name", "description", "status", "created_at", "updated_at", "deleted_at") VALUES (${escapeSqlString(
          p.id
        )}, ${escapeSqlString(p.name)}, ${escapeSqlString(p.description)}, ${escapeSqlBoolean(
          p.status
        )}, ${escapeSqlDate(p.createdAt)}, ${escapeSqlDate(p.updatedAt)}, ${escapeSqlDate(
          p.deletedAt
        )}) ON CONFLICT ("id") DO UPDATE SET "name" = EXCLUDED."name", "description" = EXCLUDED."description", "status" = EXCLUDED."status", "updated_at" = EXCLUDED."updated_at", "deleted_at" = EXCLUDED."deleted_at";`
      );
    }
    chunks.push(``);
  }

  // 2. tblEnvironment
  if (environments.length > 0) {
    chunks.push(`-- 2. Environments (${environments.length} rows)`);
    for (const e of environments) {
      chunks.push(
        `INSERT INTO "tblEnvironment" ("id", "project_id", "name", "environment_type", "base_url", "status", "created_at", "updated_at", "deleted_at") VALUES (${escapeSqlString(
          e.id
        )}, ${escapeSqlString(e.projectId)}, ${escapeSqlString(e.name)}, ${escapeSqlString(
          e.environmentType
        )}, ${escapeSqlString(e.baseUrl)}, ${escapeSqlBoolean(
          e.status
        )}, ${escapeSqlDate(e.createdAt)}, ${escapeSqlDate(e.updatedAt)}, ${escapeSqlDate(
          e.deletedAt
        )}) ON CONFLICT ("id") DO UPDATE SET "name" = EXCLUDED."name", "environment_type" = EXCLUDED."environment_type", "base_url" = EXCLUDED."base_url", "status" = EXCLUDED."status", "updated_at" = EXCLUDED."updated_at", "deleted_at" = EXCLUDED."deleted_at";`
      );
    }
    chunks.push(``);
  }

  // 3. tblCollection
  if (collections.length > 0) {
    chunks.push(`-- 3. Collections (${collections.length} rows)`);
    for (const c of collections) {
      chunks.push(
        `INSERT INTO "tblCollection" ("id", "project_id", "name", "description", "status", "created_at", "updated_at", "deleted_at") VALUES (${escapeSqlString(
          c.id
        )}, ${escapeSqlString(c.projectId)}, ${escapeSqlString(c.name)}, ${escapeSqlString(
          c.description
        )}, ${escapeSqlBoolean(c.status)}, ${escapeSqlDate(c.createdAt)}, ${escapeSqlDate(
          c.updatedAt
        )}, ${escapeSqlDate(
          c.deletedAt
        )}) ON CONFLICT ("id") DO UPDATE SET "name" = EXCLUDED."name", "description" = EXCLUDED."description", "status" = EXCLUDED."status", "updated_at" = EXCLUDED."updated_at", "deleted_at" = EXCLUDED."deleted_at";`
      );
    }
    chunks.push(``);
  }

  // 4. tblApi
  if (apis.length > 0) {
    chunks.push(`-- 4. APIs (${apis.length} rows)`);
    for (const a of apis) {
      chunks.push(
        `INSERT INTO "tblApi" ("id", "project_id", "collection_id", "name", "description", "path", "method_request", "status", "created_at", "updated_at", "deleted_at") VALUES (${escapeSqlString(
          a.id
        )}, ${escapeSqlString(a.projectId)}, ${escapeSqlString(a.collectionId)}, ${escapeSqlString(
          a.name
        )}, ${escapeSqlString(a.description)}, ${escapeSqlString(a.path)}, ${escapeSqlString(
          a.methodRequest
        )}, ${escapeSqlBoolean(a.status)}, ${escapeSqlDate(a.createdAt)}, ${escapeSqlDate(
          a.updatedAt
        )}, ${escapeSqlDate(
          a.deletedAt
        )}) ON CONFLICT ("id") DO UPDATE SET "name" = EXCLUDED."name", "collection_id" = EXCLUDED."collection_id", "description" = EXCLUDED."description", "path" = EXCLUDED."path", "method_request" = EXCLUDED."method_request", "status" = EXCLUDED."status", "updated_at" = EXCLUDED."updated_at", "deleted_at" = EXCLUDED."deleted_at";`
      );
    }
    chunks.push(``);
  }

  // 5. tblApiEnvironment
  if (apiEnvironments.length > 0) {
    chunks.push(`-- 5. API Environments (${apiEnvironments.length} rows)`);
    for (const ae of apiEnvironments) {
      chunks.push(
        `INSERT INTO "tblApiEnvironment" ("id", "api_id", "environment_id", "enabled", "path_override", "created_at", "updated_at") VALUES (${escapeSqlString(
          ae.id
        )}, ${escapeSqlString(ae.apiId)}, ${escapeSqlString(ae.environmentId)}, ${escapeSqlBoolean(
          ae.enabled
        )}, ${escapeSqlString(ae.pathOverride)}, ${escapeSqlDate(ae.createdAt)}, ${escapeSqlDate(
          ae.updatedAt
        )}) ON CONFLICT ("id") DO UPDATE SET "enabled" = EXCLUDED."enabled", "path_override" = EXCLUDED."path_override", "updated_at" = EXCLUDED."updated_at";`
      );
    }
    chunks.push(``);
  }

  // 6. tblRequestScenario
  if (requestScenarios.length > 0) {
    chunks.push(`-- 6. Request Scenarios (${requestScenarios.length} rows)`);
    for (const r of requestScenarios) {
      chunks.push(
        `INSERT INTO "tblRequestScenario" ("id", "api_id", "name", "description", "headers", "query_params", "path_params", "body", "body_type", "match_type", "priority", "status", "created_at", "updated_at", "deleted_at") VALUES (${escapeSqlString(
          r.id
        )}, ${escapeSqlString(r.apiId)}, ${escapeSqlString(r.name)}, ${escapeSqlString(
          r.description
        )}, ${escapeSqlJson(r.headers)}, ${escapeSqlJson(r.queryParams)}, ${escapeSqlJson(
          r.pathParams
        )}, ${escapeSqlJson(r.body)}, ${escapeSqlString(r.bodyType)}, ${escapeSqlString(
          r.matchType
        )}, ${escapeSqlNumber(r.priority, '0')}, ${escapeSqlBoolean(r.status)}, ${escapeSqlDate(
          r.createdAt
        )}, ${escapeSqlDate(r.updatedAt)}, ${escapeSqlDate(
          r.deletedAt
        )}) ON CONFLICT ("id") DO UPDATE SET "name" = EXCLUDED."name", "description" = EXCLUDED."description", "headers" = EXCLUDED."headers", "query_params" = EXCLUDED."query_params", "path_params" = EXCLUDED."path_params", "body" = EXCLUDED."body", "body_type" = EXCLUDED."body_type", "match_type" = EXCLUDED."match_type", "priority" = EXCLUDED."priority", "status" = EXCLUDED."status", "updated_at" = EXCLUDED."updated_at", "deleted_at" = EXCLUDED."deleted_at";`
      );
    }
    chunks.push(``);
  }

  // 7. tblResponseScenario
  if (responseScenarios.length > 0) {
    chunks.push(`-- 7. Response Scenarios (${responseScenarios.length} rows)`);
    for (const rs of responseScenarios) {
      chunks.push(
        `INSERT INTO "tblResponseScenario" ("id", "request_scenario_id", "name", "description", "status_code", "headers", "body", "response_type", "file_path", "file_name", "delay_ms", "weight", "priority", "status", "created_at", "updated_at", "deleted_at") VALUES (${escapeSqlString(
          rs.id
        )}, ${escapeSqlString(rs.requestScenarioId)}, ${escapeSqlString(rs.name)}, ${escapeSqlString(
          rs.description
        )}, ${escapeSqlNumber(rs.statusCode, '200')}, ${escapeSqlJson(rs.headers)}, ${escapeSqlJson(
          rs.body
        )}, ${escapeSqlString(rs.responseType)}, ${escapeSqlString(rs.filePath)}, ${escapeSqlString(
          rs.fileName
        )}, ${escapeSqlNumber(rs.delayMs, '0')}, ${escapeSqlNumber(rs.weight, '100')}, ${escapeSqlNumber(
          rs.priority,
          '0'
        )}, ${escapeSqlBoolean(rs.status)}, ${escapeSqlDate(rs.createdAt)}, ${escapeSqlDate(
          rs.updatedAt
        )}, ${escapeSqlDate(
          rs.deletedAt
        )}) ON CONFLICT ("id") DO UPDATE SET "name" = EXCLUDED."name", "description" = EXCLUDED."description", "status_code" = EXCLUDED."status_code", "headers" = EXCLUDED."headers", "body" = EXCLUDED."body", "response_type" = EXCLUDED."response_type", "file_path" = EXCLUDED."file_path", "file_name" = EXCLUDED."file_name", "delay_ms" = EXCLUDED."delay_ms", "weight" = EXCLUDED."weight", "priority" = EXCLUDED."priority", "status" = EXCLUDED."status", "updated_at" = EXCLUDED."updated_at", "deleted_at" = EXCLUDED."deleted_at";`
      );
    }
    chunks.push(``);
  }

  chunks.push(`COMMIT;`, ``);
  return chunks.join('\n');
}

/**
 * Splits SQL script into executable statements while ignoring comments and keeping string literals intact.
 */
export function splitSqlStatements(sql: string): string[] {
  const statements: string[] = [];
  let current = '';
  let inSingleQuote = false;
  let inDoubleQuote = false;
  let inLineComment = false;
  let inBlockComment = false;

  for (let i = 0; i < sql.length; i++) {
    const char = sql[i];
    const nextChar = sql[i + 1];

    if (inLineComment) {
      if (char === '\n') inLineComment = false;
      continue;
    }

    if (inBlockComment) {
      if (char === '*' && nextChar === '/') {
        inBlockComment = false;
        i++;
      }
      continue;
    }

    if (!inSingleQuote && !inDoubleQuote) {
      if (char === '-' && nextChar === '-') {
        inLineComment = true;
        i++;
        continue;
      }
      if (char === '/' && nextChar === '*') {
        inBlockComment = true;
        i++;
        continue;
      }
    }

    if (char === "'" && !inDoubleQuote) {
      // Check escaped single quote ''
      if (inSingleQuote && nextChar === "'") {
        current += "''";
        i++;
        continue;
      }
      inSingleQuote = !inSingleQuote;
    } else if (char === '"' && !inSingleQuote) {
      inDoubleQuote = !inDoubleQuote;
    }

    if (char === ';' && !inSingleQuote && !inDoubleQuote) {
      const trimmed = current.trim();
      if (trimmed.length > 0) {
        statements.push(trimmed);
      }
      current = '';
    } else {
      current += char;
    }
  }

  const trailing = current.trim();
  if (trailing.length > 0) {
    statements.push(trailing);
  }

  return statements;
}

const SQL_IMPORT_MAX_STATEMENTS_PER_CHUNK = 25;
const SQL_IMPORT_MAX_CHUNK_LENGTH = 750_000;

function escapeJsonControlCharacters(jsonText: string): string {
  let result = '';
  let inJsonString = false;
  let escaped = false;

  for (const char of jsonText) {
    if (escaped) {
      result += char;
      escaped = false;
      continue;
    }

    if (inJsonString && char === '\\') {
      result += char;
      escaped = true;
      continue;
    }

    if (char === '"') {
      inJsonString = !inJsonString;
      result += char;
      continue;
    }

    if (inJsonString) {
      if (char === '\n') {
        result += '\\n';
        continue;
      }
      if (char === '\r') {
        result += '\\r';
        continue;
      }
      if (char === '\t') {
        result += '\\t';
        continue;
      }
      if (char < ' ') {
        result += `\\u${char.charCodeAt(0).toString(16).padStart(4, '0')}`;
        continue;
      }
    }

    result += char;
  }

  return result;
}

function repairUnclosedTrailingJsonString(jsonText: string): string {
  let inJsonString = false;
  let escaped = false;

  for (const char of jsonText) {
    if (escaped) {
      escaped = false;
      continue;
    }

    if (inJsonString && char === '\\') {
      escaped = true;
      continue;
    }

    if (char === '"') {
      inJsonString = !inJsonString;
    }
  }

  if (!inJsonString) return jsonText;

  const trailingClosersMatch = jsonText.match(/[\s}\]]*$/);
  const trailingStart = trailingClosersMatch ? jsonText.length - trailingClosersMatch[0].length : jsonText.length;
  return `${jsonText.slice(0, trailingStart)}"${jsonText.slice(trailingStart)}`;
}

function normalizeJsonbText(jsonText: string): string {
  const escapedJsonText = escapeJsonControlCharacters(jsonText);
  try {
    JSON.parse(escapedJsonText);
    return escapedJsonText;
  } catch {}

  const repairedJsonText = repairUnclosedTrailingJsonString(escapedJsonText);
  try {
    JSON.parse(repairedJsonText);
    return repairedJsonText;
  } catch {}

  return JSON.stringify(jsonText);
}

function sanitizeJsonbLiterals(statement: string): string {
  let result = '';

  for (let i = 0; i < statement.length; i++) {
    const char = statement[i];
    if (char !== "'") {
      result += char;
      continue;
    }

    let sqlLiteral = '';
    let j = i + 1;
    for (; j < statement.length; j++) {
      const current = statement[j];
      const next = statement[j + 1];

      if (current === "'" && next === "'") {
        sqlLiteral += "''";
        j++;
        continue;
      }

      if (current === "'") {
        break;
      }

      sqlLiteral += current;
    }

    if (j >= statement.length) {
      result += char + sqlLiteral;
      break;
    }

    const suffix = statement.slice(j + 1);
    const isJsonbLiteral = /^\s*::\s*jsonb\b/i.test(suffix);

    if (!isJsonbLiteral) {
      result += `'${sqlLiteral}'`;
      i = j;
      continue;
    }

    const jsonText = sqlLiteral.replace(/''/g, "'");
    const sanitizedJsonText = normalizeJsonbText(jsonText);
    result += `'${sanitizedJsonText.replace(/'/g, "''")}'`;
    i = j;
  }

  return result;
}

function chunkSqlStatements(statements: string[]): string[][] {
  const chunks: string[][] = [];
  let currentChunk: string[] = [];
  let currentLength = 0;

  for (const statement of statements) {
    const statementLength = statement.length + 2;
    const chunkIsFull =
      currentChunk.length >= SQL_IMPORT_MAX_STATEMENTS_PER_CHUNK ||
      (currentChunk.length > 0 && currentLength + statementLength > SQL_IMPORT_MAX_CHUNK_LENGTH);

    if (chunkIsFull) {
      chunks.push(currentChunk);
      currentChunk = [];
      currentLength = 0;
    }

    currentChunk.push(statement);
    currentLength += statementLength;
  }

  if (currentChunk.length > 0) {
    chunks.push(currentChunk);
  }

  return chunks;
}

/**
 * Imports and executes SQL database script into PostgreSQL using chunked batch execution.
 */
export async function importDatabaseSql(
  sqlContent: string,
  mode: 'replace' | 'merge' = 'merge'
): Promise<{ statementsExecuted: number; chunksExecuted: number }> {
  const rawStatements = splitSqlStatements(sqlContent);
  const statements = rawStatements.filter((stmt) => {
    const upper = stmt.toUpperCase().trim();
    // Ignore transaction wrappers from exported dumps; imports are chunked intentionally.
    return upper !== 'BEGIN' && upper !== 'COMMIT' && upper !== 'BEGIN;' && upper !== 'COMMIT;';
  });

  if (statements.length === 0) {
    throw new Error('No valid SQL statements found in file.');
  }

  if (mode === 'replace') {
    await prisma.$transaction([
      prisma.responseScenario.deleteMany({}),
      prisma.requestScenario.deleteMany({}),
      prisma.apiEnvironment.deleteMany({}),
      prisma.api.deleteMany({}),
      prisma.collection.deleteMany({}),
      prisma.environment.deleteMany({}),
      prisma.project.deleteMany({}),
    ]);
  }

  const chunks = chunkSqlStatements(statements);
  for (const chunk of chunks) {
    for (const statement of chunk) {
      await prisma.$executeRawUnsafe(sanitizeJsonbLiterals(statement));
    }
  }

  return { statementsExecuted: statements.length, chunksExecuted: chunks.length };
}
