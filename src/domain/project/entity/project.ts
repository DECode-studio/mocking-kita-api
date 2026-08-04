export interface Project {
  id: string;
  name: string;
  description?: string;
  status: boolean;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string | null;
}
