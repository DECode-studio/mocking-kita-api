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

export type AuthLoginResponse =
  | { success: true; session: UserSession }
  | { success: false; error: string };


