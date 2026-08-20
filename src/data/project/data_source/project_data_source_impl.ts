import { db } from '@/src/core/db/sqlite-client';
import { Project } from '@/src/domain/project/entity/project';
import { ProjectRow, projectFromRow } from '@/src/data/project/model/project_model';
import { toDbBoolean } from '@/src/core/utils/db-converter';

export function getAllProjects(): Project[] {
  return (db.prepare('SELECT * FROM tblProject ORDER BY created_at ASC, id ASC').all() as ProjectRow[]).map(
    projectFromRow
  );
}

export function getProjectById(id: string): Project | null {
  const row = db.prepare('SELECT * FROM tblProject WHERE id = ? LIMIT 1').get(id) as ProjectRow | undefined;
  return row ? projectFromRow(row) : null;
}

export function createProject(
  input: Omit<Project, 'id' | 'createdAt' | 'updatedAt'> & { id: string; createdAt: string; updatedAt: string }
): Project {
  db.prepare(
    'INSERT INTO tblProject (id, name, description, status, created_at, updated_at, deleted_at) VALUES (?, ?, ?, ?, ?, ?, ?)'
  ).run(
    input.id,
    input.name,
    input.description ?? null,
    toDbBoolean(input.status),
    input.createdAt,
    input.updatedAt,
    input.deletedAt ?? null
  );
  return input;
}

export function updateProject(id: string, input: Partial<Project>): Project {
  const current = getProjectById(id);
  if (!current) throw new Error(`Project ${id} not found`);
  const updated: Project = {
    ...current,
    ...input,
    updatedAt: new Date().toISOString(),
  };
  db.prepare(
    'UPDATE tblProject SET name = ?, description = ?, status = ?, created_at = ?, updated_at = ?, deleted_at = ? WHERE id = ?'
  ).run(
    updated.name,
    updated.description ?? null,
    toDbBoolean(updated.status),
    updated.createdAt,
    updated.updatedAt,
    updated.deletedAt ?? null,
    id
  );
  return updated;
}

export function softDeleteProject(id: string): void {
  const current = getProjectById(id);
  if (!current) throw new Error(`Project ${id} not found`);
  updateProject(id, { deletedAt: new Date().toISOString(), status: false });
}

export function restoreProject(id: string): void {
  const current = getProjectById(id);
  if (!current) throw new Error(`Project ${id} not found`);
  updateProject(id, { deletedAt: null, status: true });
}

export function hardDeleteProject(id: string): void {
  db.exec('BEGIN TRANSACTION;');
  try {
    // Delete response scenarios associated with request scenarios of APIs of this project
    db.prepare(`
      DELETE FROM tblResponseScenario 
      WHERE request_scenario_id IN (
        SELECT id FROM tblRequestScenario WHERE api_id IN (
          SELECT id FROM tblApi WHERE project_id = ?
        )
      )
    `).run(id);

    // Delete request scenarios associated with APIs of this project
    db.prepare(`
      DELETE FROM tblRequestScenario 
      WHERE api_id IN (
        SELECT id FROM tblApi WHERE project_id = ?
      )
    `).run(id);

    // Delete api environments associated with APIs or environments of this project
    db.prepare(`
      DELETE FROM tblApiEnvironment 
      WHERE api_id IN (
        SELECT id FROM tblApi WHERE project_id = ?
      ) OR environment_id IN (
        SELECT id FROM tblEnvironment WHERE project_id = ?
      )
    `).run(id, id);

    // Delete APIs associated with this project
    db.prepare('DELETE FROM tblApi WHERE project_id = ?').run(id);

    // Delete collections associated with this project
    db.prepare('DELETE FROM tblCollection WHERE project_id = ?').run(id);

    // Delete environments associated with this project
    db.prepare('DELETE FROM tblEnvironment WHERE project_id = ?').run(id);

    // Finally, delete the project
    db.prepare('DELETE FROM tblProject WHERE id = ?').run(id);

    db.exec('COMMIT;');
  } catch (error) {
    db.exec('ROLLBACK;');
    throw error;
  }
}
