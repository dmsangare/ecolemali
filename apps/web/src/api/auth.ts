import { api, tokenStorage } from "@/lib/axios";
import type { AuthUser, LoginResponse } from "@/types/auth";

export interface LoginInput {
  identifier: string;
  password: string;
}

export interface ChangePasswordInput {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

export const authApi = {
  async login(input: LoginInput): Promise<LoginResponse> {
    const response = await api.post("/auth/login", input);
    const data = response.data.data || response.data;
    tokenStorage.setTokens(data.accessToken, data.refreshToken);
    tokenStorage.setUser(data.user);
    return data;
  },

  async me(): Promise<AuthUser> {
    const response = await api.get("/auth/me");
    return response.data.data || response.data;
  },

  async logout(): Promise<void> {
    try {
      await api.post("/auth/logout");
    } finally {
      tokenStorage.clear();
    }
  },

  async changePassword(input: ChangePasswordInput): Promise<{ message: string }> {
    const response = await api.post("/auth/password/change", input);
    return response.data.data || response.data;
  },
};
