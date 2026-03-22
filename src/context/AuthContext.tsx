import { ensure_msal_ready, get_msal_instance, MSAL_LOGIN_SCOPES } from "@/auth/msalInstance";
import { IS_MICROSOFT_LOGIN_ENABLED, IS_SKIP_AUTH } from "@/config/env";
import { getRolesFromToken, getScopesFromToken, hasPermissionInScopes } from "@/utils/jwt";
import { createContext, ReactNode, useContext, useEffect, useReducer } from "react";
import { authService } from "../api/services/authService";
import type { AuthState, LoginCredentials, User } from "../types/auth";

// Auth action type
type AuthAction =
  | { type: "AUTH_START" }
  | { type: "AUTH_SUCCESS"; payload: { user: User; token: string } }
  | { type: "AUTH_FAILURE"; payload: string }
  | { type: "AUTH_LOGOUT" }
  | { type: "AUTH_CLEAR_ERROR" };

// Auth context type
interface AuthContextType extends AuthState {
  login: (credentials: LoginCredentials) => Promise<void>;
  loginWithMicrosoft: (remember_me: boolean) => Promise<void>;
  logout: () => Promise<void>;
  clearError: () => void;
  refreshUser: () => Promise<void>;
}

// Initial state
const initialState: AuthState = {
  isAuthenticated: false,
  user: null,
  token: null,
  isLoading: true, // Initialize as true while auth state is being resolved
  error: null,
};

// Auth reducer
function authReducer(state: AuthState, action: AuthAction): AuthState {
  switch (action.type) {
    case "AUTH_START":
      return {
        ...state,
        isLoading: true,
        error: null,
      };
    case "AUTH_SUCCESS":
      return {
        ...state,
        isAuthenticated: true,
        user: action.payload.user,
        token: action.payload.token,
        isLoading: false,
        error: null,
      };
    case "AUTH_FAILURE":
      return {
        ...state,
        isAuthenticated: false,
        user: null,
        token: null,
        isLoading: false,
        error: action.payload || null, // Use null when payload is empty string
      };
    case "AUTH_LOGOUT":
      return {
        ...state,
        isAuthenticated: false,
        user: null,
        token: null,
        isLoading: false,
        error: null,
      };
    case "AUTH_CLEAR_ERROR":
      return {
        ...state,
        error: null,
      };
    default:
      return state;
  }
}

// Create context
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Auth provider component
interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [state, dispatch] = useReducer(authReducer, initialState);

  // Initialize auth state
  useEffect(() => {
    const initializeAuth = async () => {
      // Development mode: restore local state directly for skip auth without calling /auth/me
      if (IS_SKIP_AUTH) {
        const devUser = authService.getUser();
        const devToken = authService.getToken();
        if (devUser && devToken) {
          dispatch({
            type: "AUTH_SUCCESS",
            payload: { user: devUser, token: devToken },
          });
        } else {
          dispatch({ type: "AUTH_FAILURE", payload: "" });
        }
        return;
      }

      if (authService.isAuthenticated()) {
        try {
          dispatch({ type: "AUTH_START" });
          const response = await authService.getCurrentUser();

          if (response.success && response.data) {
            const token = authService.getToken();
            dispatch({
              type: "AUTH_SUCCESS",
              payload: { user: response.data, token: token || "" },
            });
          } else {
            dispatch({ type: "AUTH_FAILURE", payload: "Unable to fetch user information" });
          }
        } catch (error) {
          // If initialization fails briefly, keep current state and allow later refresh flow
          dispatch({ type: "AUTH_FAILURE", payload: "" });
        }
      } else {
        // Unauthenticated: if neither AT nor RT exists, mark unauthenticated and skip /auth/me
        const hasAccessToken = !!authService.getToken();
        const hasRefreshToken = !!authService.getRefreshToken();
        if (!hasAccessToken && !hasRefreshToken) {
          dispatch({ type: "AUTH_FAILURE", payload: "" });
          authService.clearAuth();
          return;
        }

        // If AT or RT exists, try fetching user and let httpClient handle one 401 refresh attempt
        try {
          dispatch({ type: "AUTH_START" });
          const userResp = await authService.getCurrentUser();
          if (userResp.success && userResp.data) {
            const token = authService.getToken();
            dispatch({
              type: "AUTH_SUCCESS",
              payload: { user: userResp.data, token: token || "" },
            });
          } else {
            dispatch({ type: "AUTH_FAILURE", payload: "" });
          }
        } catch {
          dispatch({ type: "AUTH_FAILURE", payload: "" });
        }
      }
    };

    initializeAuth();
  }, []);

  // Login method
  const login = async (credentials: LoginCredentials) => {
    try {
      dispatch({ type: "AUTH_START" });
      const response = await authService.login(credentials);

      if (response.success && response.data) {
        // Re-read token from authService to ensure correct storage location
        const token = authService.getToken();
        dispatch({
          type: "AUTH_SUCCESS",
          payload: { user: response.data.user, token: token || "" },
        });
      } else {
        dispatch({ type: "AUTH_FAILURE", payload: response.message || "Login failed" });
      }
    } catch (error) {
      dispatch({
        type: "AUTH_FAILURE",
        payload: error instanceof Error ? error.message : "Login failed",
      });
    }
  };

  const loginWithMicrosoft = async (remember_me: boolean) => {
    try {
      dispatch({ type: "AUTH_START" });
      const msal = await ensure_msal_ready();
      if (!msal) {
        dispatch({ type: "AUTH_FAILURE", payload: "Microsoft sign-in is not configured" });
        return;
      }
      const auth_result = await msal.loginPopup({ scopes: MSAL_LOGIN_SCOPES });
      if (auth_result.account) {
        msal.setActiveAccount(auth_result.account);
      }
      const id_token = auth_result.idToken;
      if (!id_token) {
        dispatch({ type: "AUTH_FAILURE", payload: "No ID token from Microsoft" });
        return;
      }
      const response = await authService.loginWithMicrosoft(id_token, remember_me);
      if (response.success && response.data) {
        const token = authService.getToken();
        dispatch({
          type: "AUTH_SUCCESS",
          payload: { user: response.data.user, token: token || "" },
        });
      } else {
        dispatch({ type: "AUTH_FAILURE", payload: response.message || "Microsoft sign-in failed" });
      }
    } catch (error) {
      dispatch({
        type: "AUTH_FAILURE",
        payload: error instanceof Error ? error.message : "Microsoft sign-in failed",
      });
    }
  };

  // Logout method
  const logout = async () => {
    try {
      if (IS_MICROSOFT_LOGIN_ENABLED) {
        try {
          const msal = get_msal_instance();
          if (msal) {
            await ensure_msal_ready();
            const account = msal.getActiveAccount() ?? msal.getAllAccounts()[0];
            if (account) {
              await msal.logoutPopup({ account });
            }
          }
        } catch (msal_error) {
          console.warn("MSAL logout:", msal_error);
        }
      }
      await authService.logout();
    } catch (error) {
      console.warn("Logout error:", error);
    } finally {
      dispatch({ type: "AUTH_LOGOUT" });
    }
  };

  // Clear error
  const clearError = () => {
    dispatch({ type: "AUTH_CLEAR_ERROR" });
  };

  // Refresh user data
  const refreshUser = async () => {
    if (!state.isAuthenticated) return;

    try {
      const response = await authService.getCurrentUser();

      if (response.success && response.data) {
        const token = authService.getToken();
        dispatch({
          type: "AUTH_SUCCESS",
          payload: { user: response.data, token: token || "" },
        });
      }
    } catch (error) {
      console.warn("Failed to refresh user:", error);
    }
  };

  const value: AuthContextType = {
    ...state,
    login,
    loginWithMicrosoft,
    logout,
    clearError,
    refreshUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// Hook for auth context
export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
// Permission check hook
export function usePermissions() {
  const { token } = useAuth();

  const hasPermission = (permission: string): boolean => {
    if (!token) return false;
    // Parse directly from token; do not trust permissions stored in localStorage
    // Supports wildcard scopes: if scope contains "resource:*", all actions for that resource are allowed
    const scopes = getScopesFromToken(token);
    return hasPermissionInScopes(permission, scopes);
  };

  const hasRole = (role: string): boolean => {
    if (!token) return false;
    const roles = getRolesFromToken(token);
    return roles.includes(role);
  };

  const hasAnyPermission = (permissions: string[]): boolean => {
    return permissions.some((permission) => hasPermission(permission));
  };

  const hasAllPermissions = (permissions: string[]): boolean => {
    return permissions.every((permission) => hasPermission(permission));
  };

  const hasAnyRole = (roles: string[]): boolean => {
    return roles.some((role) => hasRole(role));
  };

  const hasAllRoles = (roles: string[]): boolean => {
    return roles.every((role) => hasRole(role));
  };

  const isSuperAdmin = () => {
    return hasRole("superadmin");
  };

  return {
    hasPermission,
    hasRole,
    hasAnyPermission,
    hasAllPermissions,
    hasAnyRole,
    hasAllRoles,
    isSuperAdmin,
  };
}
