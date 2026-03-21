// Authentication service
import { API_ENDPOINTS, HTTP_STATUS } from "@/api/config";
import { loginWithMockCredentials, mockPasswordResetConfirm, mockPasswordResetRequest } from "@/api/mock/auth-mock";
import i18n from "@/i18n";
import type { ApiError, ApiResponse, TokenResponse } from "@/types/api";
import { IS_DEV, IS_MOCK_API, IS_MOCK_AUTH, IS_SKIP_AUTH } from "@/config/env";
import type { AuthError, LoginCredentials, LoginResponse, User } from "@/types/auth";
import { notificationManager } from "@/utils/notificationManager";
import { getScopesFromToken, getRolesFromToken, parseJWT, hasPermissionInScopes } from "@/utils/jwt";
import { httpClient } from "./httpClient";

// Backend response types (admin auth API)
interface AdminInfoResponse {
  id: string;
  email: string;
  display_name: string;
  roles: string[];
  // Removed permissions field; permission data is parsed from JWT scope
  last_login_at?: string;
}

interface AdminLoginResponse {
  admin: AdminInfoResponse;
  token: TokenResponse;
}

// Map AdminInfo to local User type
function mapAdminToUser(admin: AdminInfoResponse, token?: string | null): User {
  const nowIso = new Date().toISOString();
  
  // Parse permissions and roles from token (if provided)
  const scopes = token ? getScopesFromToken(token) : [];
  const roles = token ? getRolesFromToken(token) : (admin.roles || []);
  
  return {
    id: admin.id,
    username: admin.display_name || admin.email,
    email: admin.email,
    firstName: undefined,
    lastName: undefined,
    avatar: "/images/user/default-avatar.jpg",
    status: "active",
    roles: roles,
    permissions: scopes, // Parsed from JWT token
    lastLoginAt: admin.last_login_at,
    createdAt: nowIso,
    updatedAt: nowIso,
  };
}

// Authentication service class
class AuthService {
  private readonly TOKEN_KEY = "auth_token";
  private readonly REFRESH_TOKEN_KEY = "refresh_token";
  private readonly USER_KEY = "user_data";
  private readonly REMEMBER_ME_KEY = "remember_me";
  private readonly REMEMBER_ME_EXPIRY = 30 * 24 * 60 * 60 * 1000; // 30 days in milliseconds

  // Deduplicate concurrent requests: ensure only one getCurrentUser() calls API at a time
  private inFlightCurrentUserPromise: Promise<ApiResponse<User>> | null = null;

  // Login
  async login(credentials: LoginCredentials): Promise<ApiResponse<LoginResponse>> {
    // API implementation: delegate mock credential validation and token/user generation to api/mock module.
    if (IS_MOCK_AUTH) {
      const mockResponse = loginWithMockCredentials(credentials);
      if (!mockResponse.success || !mockResponse.data) {
        return mockResponse;
      }

      this.setRememberMe(credentials.rememberMe || false);
      this.setToken(mockResponse.data.token);

      if (credentials.rememberMe) {
        sessionStorage.removeItem(this.TOKEN_KEY);
        sessionStorage.removeItem(this.USER_KEY);
        sessionStorage.removeItem(this.REFRESH_TOKEN_KEY);
      } else {
        localStorage.removeItem(this.TOKEN_KEY);
        localStorage.removeItem(this.USER_KEY);
        localStorage.removeItem(this.REFRESH_TOKEN_KEY);
        localStorage.removeItem(`${this.REFRESH_TOKEN_KEY}_expiry`);
      }

      if (mockResponse.data.refreshToken) {
        this.setRefreshToken(mockResponse.data.refreshToken);
      }
      this.setUser(mockResponse.data.user);
      return mockResponse;
    }

    try {
      // API implementation: call backend login endpoint in non-mock mode.
      const response = await httpClient.post<AdminLoginResponse>(API_ENDPOINTS.AUTH.LOGIN, {
        email: credentials.email,
        password: credentials.password,
      });

      if (response.success && response.data) {
        // Map response to local structure and pass token for permission parsing
        const accessToken = response.data.token.accessToken;
        const user = mapAdminToUser(response.data.admin, accessToken);
        const refreshToken = response.data.token.refreshToken;
        const expiresAt = new Date(Date.now() + response.data.token.expiresIn * 1000).toISOString();

        // Save rememberMe state first
        this.setRememberMe(credentials.rememberMe || false);

        // Save auth data
        this.setToken(accessToken);

        // Clear stale token/user in opposite storage to avoid reading outdated token later
        if (credentials.rememberMe) {
          // Use localStorage; clear sessionStorage leftovers
          sessionStorage.removeItem(this.TOKEN_KEY);
          sessionStorage.removeItem(this.USER_KEY);
          sessionStorage.removeItem(this.REFRESH_TOKEN_KEY);
        } else {
          // Use sessionStorage; clear localStorage leftovers
          localStorage.removeItem(this.TOKEN_KEY);
          localStorage.removeItem(this.USER_KEY);
          // refresh_token is used only in rememberMe mode; ensure no leftovers
          localStorage.removeItem(this.REFRESH_TOKEN_KEY);
          localStorage.removeItem(`${this.REFRESH_TOKEN_KEY}_expiry`);
        }

        // Store refresh token only when "Keep me logged in" is enabled
        if (refreshToken && credentials.rememberMe) {
          this.setRefreshToken(refreshToken);
        }

        this.setUser(user);

        return {
          success: true,
          data: {
            user,
            token: accessToken,
            refreshToken,
            expiresAt,
            rememberMe: credentials.rememberMe,
          },
          code: response.code,
        };
      }

      return {
        success: false,
        data: undefined as unknown as LoginResponse,
        code: response.code,
        error: response.error,
        message: response.message,
      };
    } catch (error) {
      // Handle ApiError and show notification
      if (error && typeof error === "object" && "code" in error && typeof (error as ApiError).code === "number") {
        const apiError = error as ApiError;
        this.showAuthErrorNotification(apiError, "login");
      }
      throw this.handleAuthError(error);
    }
  }

  // Logout
  async logout(): Promise<ApiResponse<void>> {
    // API implementation: clear local auth state only in mock mode.
    if (IS_MOCK_AUTH) {
      this.clearAuth();
      return { success: true, data: undefined, code: HTTP_STATUS.OK };
    }

    try {
      // API implementation: call backend logout endpoint in non-mock mode.
      const token = this.getToken();
      const refreshToken = this.getRefreshToken();
      if (token) {
        // Call backend logout API (pass access_token and refresh_token)
        await httpClient.post(API_ENDPOINTS.AUTH.LOGOUT, {
          access_token: token,
          refresh_token: refreshToken,
        });
      }
    } catch (error) {
      // Even if backend logout fails, local state should still be cleared
      console.warn("Logout API call failed, but clearing local state:", error);
    } finally {
      // Clear local auth state
      this.clearAuth();
    }

    return { success: true, data: undefined, code: 200 };
  }

  // Get current user info
  async getCurrentUser(): Promise<ApiResponse<User>> {
    // API implementation: read current user from local storage in mock mode.
    if (IS_MOCK_AUTH) {
      const user = this.getUser();
      if (!user) {
        return {
          success: false,
          data: undefined as unknown as User,
          code: HTTP_STATUS.UNAUTHORIZED,
          message: "Mock user not found",
        };
      }
      return { success: true, data: user, code: HTTP_STATUS.OK };
    }

    if (this.inFlightCurrentUserPromise) {
      return this.inFlightCurrentUserPromise;
    }

    this.inFlightCurrentUserPromise = (async () => {
      try {
        const response = await httpClient.get<AdminInfoResponse>(API_ENDPOINTS.AUTH.PROFILE);

        if (response.success && response.data) {
          // Get current token for permission parsing
          const token = this.getToken();
          // Update local user info
          const user = mapAdminToUser(response.data, token);
          this.setUser(user);
          return { success: true, data: user, code: response.code };
        }

        return {
          success: false,
          data: undefined as unknown as User,
          code: response.code,
          error: response.error,
          message: response.message,
        };
      } catch (error) {
        // Handle ApiError; during initialization, notification may be unnecessary
        // Let caller decide whether to display notifications
        throw this.handleAuthError(error);
      } finally {
        // Clear in-flight state
        this.inFlightCurrentUserPromise = null;
      }
    })();

    return this.inFlightCurrentUserPromise;
  }

  // Refresh token
  async refreshToken(): Promise<ApiResponse<{ token: string; refreshToken?: string }>> {
    // API implementation: reuse local token without network refresh in mock mode.
    if (IS_MOCK_AUTH) {
      const token = this.getToken();
      if (!token) {
        throw new Error("No mock token available");
      }
      return {
        success: true,
        data: { token, refreshToken: this.getRefreshToken() || undefined },
        code: HTTP_STATUS.OK,
      };
    }

    try {
      const refreshToken = this.getRefreshToken();
      if (!refreshToken) {
        throw new Error("No refresh token available");
      }

      const response = await httpClient.post<TokenResponse>(API_ENDPOINTS.AUTH.REFRESH, { refresh_token: refreshToken });

      if (response.success && response.data) {
        const newAccessToken = response.data.accessToken;
        const newRefreshToken = response.data.refreshToken;

        this.setToken(newAccessToken);
        if (newRefreshToken) {
          this.setRefreshToken(newRefreshToken);
        }

        return { success: true, data: { token: newAccessToken, refreshToken: newRefreshToken }, code: response.code };
      }

      return {
        success: false,
        data: undefined as unknown as { token: string; refreshToken?: string },
        code: response.code,
        error: response.error,
        message: response.message,
      };
    } catch (error) {
      // Refresh failed: clear auth state and show notification
      if (error && typeof error === "object" && "code" in error && typeof (error as ApiError).code === "number") {
        const apiError = error as ApiError;
        this.showAuthErrorNotification(apiError, "refresh");
      }
      this.clearAuth();
      throw this.handleAuthError(error);
    }
  }

  // Check authentication state
  isAuthenticated(): boolean {
    // Development mode: return true when auth skip env var is enabled
    if (IS_SKIP_AUTH) {
      return true;
    }

    const token = this.getToken();
    const user = this.getUser();
    return !!(token && user);
  }

  // Get token (with source priority: session -> local)
  getToken(): string | null {
    // Development mode: return developer token when auth skip env var is enabled
    if (IS_SKIP_AUTH && !IS_MOCK_AUTH) {
      return "dev_token_skip_auth_mode";
    }

    // Check sessionStorage first (normal login mode has priority)
    const sessionToken = sessionStorage.getItem(this.TOKEN_KEY);
    if (sessionToken) return sessionToken;

    // Then check localStorage (rememberMe mode)
    const localToken = localStorage.getItem(this.TOKEN_KEY);
    if (!localToken) return null;

    // Optional: return token directly when exp is not stored (refresh logic is in httpClient)
    return localToken;
  }

  // Set token
  setToken(token: string): void {
    const rememberMe = this.getRememberMe();
    if (rememberMe) {
      // rememberMe: use localStorage
      localStorage.setItem(this.TOKEN_KEY, token);
    } else {
      // normal login: use sessionStorage
      sessionStorage.setItem(this.TOKEN_KEY, token);
    }
  }

  // Get refresh token
  getRefreshToken(): string | null {
    // Refresh token exists only in rememberMe mode
    const rememberMe = this.getRememberMe();
    if (!rememberMe) return null;

    // Check expiration
    const expiryTime = localStorage.getItem(`${this.REFRESH_TOKEN_KEY}_expiry`);
    if (expiryTime && Date.now() > parseInt(expiryTime)) {
      // Expired, clear storage
      this.clearAuth();
      return null;
    }

    return localStorage.getItem(this.REFRESH_TOKEN_KEY);
  }

  // Set refresh token
  setRefreshToken(token: string): void {
    // Store refresh token only in rememberMe mode
    const rememberMe = this.getRememberMe();
    if (!rememberMe) return;

    // Use localStorage and set expiry time
    const expiryTime = Date.now() + this.REMEMBER_ME_EXPIRY;
    localStorage.setItem(this.REFRESH_TOKEN_KEY, token);
    localStorage.setItem(`${this.REFRESH_TOKEN_KEY}_expiry`, expiryTime.toString());
  }

  // Get user info
  getUser(): User | null {
    // Check localStorage first (rememberMe mode)
    let userData = localStorage.getItem(this.USER_KEY);

    // Then check sessionStorage (normal login mode)
    if (!userData) {
      userData = sessionStorage.getItem(this.USER_KEY);
    }

    if (!userData) return null;

    const user = JSON.parse(userData) as User;

    // Parse permissions from token for security, overriding localStorage permissions
    const token = this.getToken();
    if (token) {
      const scopes = getScopesFromToken(token);
      const roles = getRolesFromToken(token);
      const payload = parseJWT(token);

      // Override permission data to ensure it comes from JWT
      user.permissions = scopes;
      user.roles = roles;

      // Optional: update other fields (email, display_name, etc.)
      if (payload) {
        user.email = payload.email;
        user.username = payload.display_name || payload.email;
      }
    }

    return user;
  }

  // Set user info
  setUser(user: User): void {
    const rememberMe = this.getRememberMe();
    if (rememberMe) {
      // rememberMe: use localStorage
      localStorage.setItem(this.USER_KEY, JSON.stringify(user));
    } else {
      // normal login: use sessionStorage
      sessionStorage.setItem(this.USER_KEY, JSON.stringify(user));
    }
  }

  // Get rememberMe state
  getRememberMe(): boolean {
    const stored = localStorage.getItem(this.REMEMBER_ME_KEY);
    return stored === "true";
  }

  // Set rememberMe state
  setRememberMe(rememberMe: boolean): void {
    if (rememberMe) {
      localStorage.setItem(this.REMEMBER_ME_KEY, "true");
    } else {
      localStorage.removeItem(this.REMEMBER_ME_KEY);
    }
  }

  // Clear auth state
  clearAuth(): void {
    // Clear localStorage
    localStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem(this.REFRESH_TOKEN_KEY);
    localStorage.removeItem(`${this.REFRESH_TOKEN_KEY}_expiry`);
    localStorage.removeItem(this.USER_KEY);
    localStorage.removeItem(this.REMEMBER_ME_KEY);

    // Clear sessionStorage
    sessionStorage.removeItem(this.TOKEN_KEY);
    sessionStorage.removeItem(this.REFRESH_TOKEN_KEY);
    sessionStorage.removeItem(this.USER_KEY);
  }

  // Show auth error notification
  private showAuthErrorNotification(error: ApiError, context: "login" | "profile" | "refresh" | "password" | "general" = "general"): void {
    const { code, message, details } = error;

    // Development mode: show debug_detail in console (if available)
    if (IS_DEV && details?.debug_detail) {
      console.error("[AuthService] Debug Detail:", details.debug_detail);
      if (details.url) {
        console.error("[AuthService] Request URL:", details.url);
      }
    }

    let variant: "error" | "warning" = "error";
    let title = i18n.t("errors.unknown");
    let description = message;
    let hideDuration = 4000;

    switch (code) {
      case HTTP_STATUS.UNAUTHORIZED:
        title = context === "login" ? i18n.t("auth.signIn") : i18n.t("errors.unauthorized");
        description = context === "login" ? message : i18n.t("errors.unauthorized");
        variant = "warning";
        hideDuration = 5000;

        // For 401 errors, redirect to sign-in page when not in login context
        if (context !== "login") {
          // Delay redirect so notification appears first
          setTimeout(() => {
            if (window.location.pathname !== "/signin") {
              window.location.href = "/signin";
            }
          }, 1500);
        }
        break;

      case HTTP_STATUS.FORBIDDEN:
        title = i18n.t("errors.forbidden");
        description = i18n.t("errors.forbidden");
        variant = "warning";
        break;

      case HTTP_STATUS.UNPROCESSABLE_ENTITY:
        // 422 is typically a validation error (e.g. invalid login credentials)
        title = context === "login" ? i18n.t("auth.signIn") : i18n.t("errors.validation");
        description = message;
        variant = "error";
        break;

      case HTTP_STATUS.BAD_REQUEST:
        title = i18n.t("errors.validation");
        description = message;
        variant = "error";
        break;

      case HTTP_STATUS.NOT_FOUND:
        title = i18n.t("errors.notFound");
        description = message;
        variant = "warning";
        break;

      case HTTP_STATUS.INTERNAL_SERVER_ERROR:
      case HTTP_STATUS.BAD_GATEWAY:
      case HTTP_STATUS.SERVICE_UNAVAILABLE:
        title = i18n.t("errors.server");
        description = i18n.t("errors.server");
        variant = "error";
        break;

      default:
        if (code === 0) {
          // Network errors are already notified in httpClient
          return;
        }
        title = i18n.t("errors.unknown");
        description = message || i18n.t("errors.unknown");
        variant = "error";
    }

    notificationManager.show({
      variant,
      title,
      description,
      position: "top-center",
      hideDuration,
    });
  }

  // Handle auth errors (convert ApiError to AuthError for backward compatibility)
  private handleAuthError(error: unknown): AuthError {
    // Check whether error is an ApiError (thrown by httpClient)
    if (error && typeof error === "object" && "code" in error && typeof (error as ApiError).code === "number") {
      const apiError = error as ApiError;

      if (apiError.code === HTTP_STATUS.UNAUTHORIZED) {
        this.clearAuth();
        return {
          code: "UNAUTHORIZED",
          message: i18n.t("errors.unauthorized"),
          details: apiError.details,
        };
      }

      return {
        code: apiError.code.toString(),
        message: apiError.message || i18n.t("errors.unknown"),
        details: apiError.details,
      };
    }

    // Handle other error types
    return {
      code: "UNKNOWN_ERROR",
      message: error instanceof Error ? error.message : i18n.t("errors.unknown"),
    };
  }

  // Check permissions (parse directly from token for security)
  // Supports wildcard matching: if scope contains "resource:*", all actions for that resource are allowed
  hasPermission(permission: string): boolean {
    const token = this.getToken();
    if (!token) return false;

    const scopes = getScopesFromToken(token);
    return hasPermissionInScopes(permission, scopes);
  }

  // Check roles (parse directly from token for security)
  hasRole(role: string): boolean {
    const token = this.getToken();
    if (!token) return false;

    const roles = getRolesFromToken(token);
    return roles.includes(role);
  }

  // Check multiple permissions (any match)
  hasAnyPermission(permissions: string[]): boolean {
    return permissions.some((permission) => this.hasPermission(permission));
  }

  // Check multiple permissions (all must match)
  hasAllPermissions(permissions: string[]): boolean {
    return permissions.every((permission) => this.hasPermission(permission));
  }

  // Check multiple roles (any match)
  hasAnyRole(roles: string[]): boolean {
    return roles.some((role) => this.hasRole(role));
  }

  // Check multiple roles (all must match)
  hasAllRoles(roles: string[]): boolean {
    return roles.every((role) => this.hasRole(role));
  }

  // Request password reset
  async requestPasswordReset(email: string): Promise<ApiResponse<{ message: string }>> {
    // API implementation: delegate mock password reset request to api/mock module.
    if (IS_MOCK_API) {
      return mockPasswordResetRequest(email);
    }

    try {
      const response = await httpClient.post<{ message: string }>(API_ENDPOINTS.AUTH.REQUEST_PASSWORD_RESET, { email });
      return response;
    } catch (error) {
      // Handle error and show notification
      if (error && typeof error === "object" && "code" in error && typeof (error as ApiError).code === "number") {
        const apiError = error as ApiError;
        this.showAuthErrorNotification(apiError, "password");
      }
      throw this.handleAuthError(error);
    }
  }

  // Reset password with token
  async resetPasswordWithToken(token: string, newPassword: string, newPasswordConfirm: string): Promise<ApiResponse<{ message: string }>> {
    // API implementation: delegate mock password reset confirmation to api/mock module.
    if (IS_MOCK_API) {
      return mockPasswordResetConfirm(token, newPassword, newPasswordConfirm);
    }

    try {
      const response = await httpClient.post<{ message: string }>(API_ENDPOINTS.AUTH.RESET_PASSWORD_CONFIRM, {
        token,
        new_password: newPassword,
        new_password_confirm: newPasswordConfirm,
      });
      return response;
    } catch (error) {
      // Handle error and show notification
      if (error && typeof error === "object" && "code" in error && typeof (error as ApiError).code === "number") {
        const apiError = error as ApiError;
        this.showAuthErrorNotification(apiError, "password");
      }
      throw this.handleAuthError(error);
    }
  }
}

// Create global authentication service instance
export const authService = new AuthService();

export default authService;
