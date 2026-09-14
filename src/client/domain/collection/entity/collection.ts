export interface Collection {
  id: string;
  projectId: string;
  name: string;
  description?: string;
  status: boolean;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string | null;
}
