// Authentication related type definitions
export interface User {
  id: string;
  username: string;
  email: string;
  firstName?: string;
  lastName?: string;
  avatar?: string;
  status: "active" | "inactive" | "suspended";
  roles: string[];
  permissions: string[];
  lastLoginAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AuthState {
  isAuthenticated: boolean;
  user: User | null;
  token: string | null;
  isLoading: boolean;
  error: string | null;
}

export interface LoginCredentials {
  email: string;
  password: string;
  rememberMe?: boolean;
}

export interface LoginResponse {
  user: User;
  token: string;
  refreshToken?: string;
  expiresAt?: string;
  rememberMe?: boolean;
}

export interface Permission {
  resource: string;
  action: string;
  description?: string;
}

export interface Role {
  id: string;
  name: string;
  description?: string;
  permissions: string[];
}

// Permission check tool type
export type PermissionCheck = (permission: string) => boolean;
export type RoleCheck = (role: string) => boolean;

// Authentication error type
export interface AuthError {
  code: string;
  message: string;
  details?: Record<string, unknown>;
}
