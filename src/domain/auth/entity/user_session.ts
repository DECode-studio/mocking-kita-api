export interface UserSession {
  username: string;
  name: string;
  avatarUrl?: string;
  role: string;
  googleId?: string | null;
  token: string;
  rememberMe: boolean;
  loginAt: string;
}

