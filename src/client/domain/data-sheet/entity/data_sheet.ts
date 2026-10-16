export type DataSheetFormat = 'LIST' | 'TABLE';
export type DataSheetRow = Record<string, unknown> | string | number | boolean;

export interface DataSheet {
  id: string;
  projectId?: string | null;
  name: string;
  code: string;
  category?: string | null;
  description?: string | null;
  format: DataSheetFormat;
  data: unknown[];
  status: boolean;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string | null;
  project?: {
    id: string;
    name: string;
  } | null;
}
