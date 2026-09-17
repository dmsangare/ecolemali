export interface AuthUser {
  id: string;
  email: string | null;
  phone: string | null;
  firstName: string;
  lastName: string;
  schoolId: string | null;
  roles: string[];
  permissions: string[];
  mustChangePassword?: boolean;
  school?: { id: string; name: string; code: string } | null;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  tokenType: string;
}

export interface LoginResponse extends AuthTokens {
  user: AuthUser;
}
