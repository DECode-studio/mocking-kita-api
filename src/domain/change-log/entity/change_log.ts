export interface ChangeLog {
  id: string;
  action: 'CREATE' | 'UPDATE' | 'DELETE' | 'RESTORE' | 'IMPORT' | 'RESET';
  entity_type: 'project' | 'collection' | 'api' | 'request_scenario' | 'response_scenario' | 'database' | 'environment';
  entity_id: string | null;
  project_id: string | null;
  user_id: string | null;
  operator: string;
  description: string | null;
  before_state: string | null;
  after_state: string | null;
  metadata: string | null;
  created_at: string;
}
