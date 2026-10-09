export type UserStatus = "ACTIVE" | "INACTIVE" | "SUSPENDED";

export interface Role {
  id: string;
  code: string;
  name: string;
  description?: string | null;
}

export interface User {
  id: string;
  email: string | null;
  phone: string | null;
  firstName: string;
  lastName: string;
  status: UserStatus;
  schoolId?: string | null;
  lastLoginAt: string | null;
  createdAt: string;
  userRoles: { role: Role }[];
}

export interface CreateUserDto {
  email?: string;
  phone?: string;
  password?: string;
  firstName: string;
  lastName: string;
  roleIds: string[];
}

export interface UpdateUserDto {
  email?: string;
  phone?: string;
  firstName?: string;
  lastName?: string;
  status?: UserStatus;
}

export interface UsersListMeta {
  page: number;
  limit: number;
  total: number;
  pages: number;
}

export interface UsersListResponse {
  data: User[];
  meta: UsersListMeta;
}
