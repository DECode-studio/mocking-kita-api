export type DataSheetFormat = 'LIST' | 'TABLE';

export interface DataSheetInput {
  id?: string;
  projectId?: string | null;
  name: string;
  code: string;
  category?: string | null;
  description?: string | null;
  format?: DataSheetFormat;
  data: any[];
  status?: boolean;
}

export interface DataSheetUpdateInput {
  name?: string;
  code?: string;
  category?: string | null;
  description?: string | null;
  format?: DataSheetFormat;
  data?: any[];
  status?: boolean;
}

export interface DataSheetFilter {
  projectId?: string | null;
  search?: string;
  category?: string;
  status?: boolean;
}
