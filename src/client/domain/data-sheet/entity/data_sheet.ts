export type DataSheetFormat = 'LIST' | 'TABLE';

export interface DataSheet {
  id: string;
  projectId?: string | null;
  name: string;
  code: string;
  category?: string | null;
  description?: string | null;
  format: DataSheetFormat;
  data: any[];
  status: boolean;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string | null;
  project?: {
    id: string;
    name: string;
  } | null;
}
