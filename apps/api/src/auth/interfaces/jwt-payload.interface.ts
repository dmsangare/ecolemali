export interface JwtPayload {
  sub: string;
  email: string | null;
  schoolId: string | null;
  roles: string[];
  permissions: string[];
  iat?: number;
  exp?: number;
}

export interface JwtRefreshPayload {
  sub: string;
  tokenId: string;
  iat?: number;
  exp?: number;
}