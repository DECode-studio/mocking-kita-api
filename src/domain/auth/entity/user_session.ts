export interface UserSession {
  username: string;
  name: string;
  avatarUrl?: string;
  role: string;
  token: string;
  rememberMe: boolean;
  loginAt: string;
}
