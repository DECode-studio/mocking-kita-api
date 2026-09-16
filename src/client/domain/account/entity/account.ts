export interface Account {
  id: string;
  username: string;
  name: string;
  role: string;
  googleId?: string | null;
  hasCustomPassword?: boolean;
  createdAt: string;
  updatedAt: string;
}

