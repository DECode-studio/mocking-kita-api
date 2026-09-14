export interface Account {
  id: string;
  username: string;
  name: string;
  role: string;
  googleId?: string | null;
  createdAt: string;
  updatedAt: string;
}

