import type { ApiResponse } from "@/types/api";
import { ENV_CONFIG } from "@/config/env";
import type { LoginCredentials, LoginResponse, User } from "@/types/auth";
import { getRolesFromToken, getScopesFromToken } from "@/utils/jwt";

const MOCK_SCOPES = [
  "system:user:list",
  "system:user:create",
  "system:user:update",
  "system:role:list",
  "system:permission:list",
  "system:resource:list",
  "demo:data:list",
];
const MOCK_ROLES = ["superadmin"];

const base64UrlEncode = (value: string): string => btoa(value).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");

export const createMockJwt = (email: string): string => {
  const header = base64UrlEncode(JSON.stringify({ alg: "HS256", typ: "JWT" }));
  const payload = base64UrlEncode(
    JSON.stringify({
      sub: "mock-admin-user",
      email,
      display_name: "Template Admin",
      roles: MOCK_ROLES,
      scope: MOCK_SCOPES.join(" "),
      exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24,
      iat: Math.floor(Date.now() / 1000),
    })
  );
  return `${header}.${payload}.mock-signature`;
};

export const createMockUser = (email: string, token: string): User => {
  const nowIso = new Date().toISOString();
  return {
    id: "mock-admin-user",
    username: "Template Admin",
    email,
    avatar: "/images/user/default-avatar.jpg",
    status: "active",
    roles: getRolesFromToken(token),
    permissions: getScopesFromToken(token),
    createdAt: nowIso,
    updatedAt: nowIso,
    lastLoginAt: nowIso,
  };
};

export const loginWithMockCredentials = (credentials: LoginCredentials): ApiResponse<LoginResponse> => {
  const email = credentials.email?.trim() || "";
  if (email !== ENV_CONFIG.MOCK_AUTH_EMAIL || credentials.password !== ENV_CONFIG.MOCK_AUTH_PASSWORD) {
    return {
      success: false,
      code: 401,
      message: "Invalid mock account or password",
      data: undefined as unknown as LoginResponse,
    };
  }
  const token = createMockJwt(email);
  const refreshToken = credentials.rememberMe ? `mock_refresh_${Date.now()}` : undefined;
  const user = createMockUser(email, token);
  return {
    success: true,
    code: 200,
    data: {
      user,
      token,
      refreshToken,
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      rememberMe: credentials.rememberMe,
    },
  };
};

export const mockPasswordResetRequest = (email: string): ApiResponse<{ message: string }> => ({
  success: true,
  code: 200,
  data: { message: `Password reset link sent to ${email}` },
});

export const mockPasswordResetConfirm = (
  token: string,
  newPassword: string,
  newPasswordConfirm: string
): ApiResponse<{ message: string }> => {
  if (!(token && newPassword && newPasswordConfirm && newPassword === newPasswordConfirm)) {
    return {
      success: false,
      code: 400,
      message: "Invalid reset password payload",
      data: undefined as unknown as { message: string },
    };
  }
  return {
    success: true,
    code: 200,
    data: { message: "Password reset successfully (mock)" },
  };
};
