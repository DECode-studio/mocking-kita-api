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

export interface AccountProfile {
  id: string;
  username: string;
  name: string;
  role: string;
  googleId: string | null;
  hasCustomPassword?: boolean;
  requiresCurrentPassword?: boolean;
}

export interface UpdateProfileInput {
  name?: string;
  currentPassword?: string;
  newPassword?: string;
}


