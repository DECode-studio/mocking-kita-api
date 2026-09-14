import { listChangeLogs, type ChangeLogListQuery } from './change-log.repository';

export async function getChangeLogs(query: ChangeLogListQuery) {
  return listChangeLogs(query);
}
