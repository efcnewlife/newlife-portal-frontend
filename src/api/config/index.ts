// API config file
import { ENV_CONFIG } from "@/config/env";

// Environment variables
const API_BASE_URL = ENV_CONFIG.API_BASE_URL;
const API_TIMEOUT = ENV_CONFIG.API_TIMEOUT; // 90 seconds

// API prefix
const ADMIN_API_PREFIX = "/admin/api/v1";

// API endpoint configuration
export const API_ENDPOINTS = {
  // Authentication (admin)
  AUTH: {
    LOGIN: `${ADMIN_API_PREFIX}/auth/login`,
    MICROSOFT: `${ADMIN_API_PREFIX}/auth/microsoft`,
    LOGOUT: `${ADMIN_API_PREFIX}/auth/logout`,
    REFRESH: `${ADMIN_API_PREFIX}/auth/refresh`,
    PROFILE: `${ADMIN_API_PREFIX}/auth/me`,
    CHANGE_PASSWORD: `${ADMIN_API_PREFIX}/auth/change-password`,
    REQUEST_PASSWORD_RESET: `${ADMIN_API_PREFIX}/auth/password_reset/request`,
    RESET_PASSWORD_CONFIRM: `${ADMIN_API_PREFIX}/auth/password_reset/confirm`,
  },

  // Role management (admin)
  ROLES: {
    PAGES: `${ADMIN_API_PREFIX}/role/pages`,
    LIST: `${ADMIN_API_PREFIX}/role/list`,
    CREATE: `${ADMIN_API_PREFIX}/role`,
    DETAIL: (id: string) => `${ADMIN_API_PREFIX}/role/${id}`,
    UPDATE: (id: string) => `${ADMIN_API_PREFIX}/role/${id}`,
    DELETE: (id: string) => `${ADMIN_API_PREFIX}/role/${id}`,
    RESTORE: (id: string) => `${ADMIN_API_PREFIX}/role/restore/${id}`,
    ASSIGN_PERMISSIONS: (id: string) => `${ADMIN_API_PREFIX}/role/${id}/permissions`,
  },

  // Permission management
  PERMISSIONS: {
    PAGES: `${ADMIN_API_PREFIX}/permission/pages`,
    LIST: `${ADMIN_API_PREFIX}/permission/list`,
    CREATE: `${ADMIN_API_PREFIX}/permission`,
    DETAIL: (id: string) => `${ADMIN_API_PREFIX}/permission/${id}`,
    UPDATE: (id: string) => `${ADMIN_API_PREFIX}/permission/${id}`,
    DELETE: (id: string) => `${ADMIN_API_PREFIX}/permission/${id}`,
    RESTORE: `${ADMIN_API_PREFIX}/permission/restore`,
    CHECK: "/permissions/check",
    CHECK_MULTIPLE: "/permissions/check-multiple",
  },

  // Verb management
  VERBS: {
    LIST: `${ADMIN_API_PREFIX}/verb/list`,
  },

  // Resource management (admin)
  RESOURCES: {
    LIST: `${ADMIN_API_PREFIX}/resource/list`,
    CREATE: `${ADMIN_API_PREFIX}/resource`,
    DETAIL: (id: string) => `${ADMIN_API_PREFIX}/resource/${id}`,
    UPDATE: (id: string) => `${ADMIN_API_PREFIX}/resource/${id}`,
    DELETE: (id: string) => `${ADMIN_API_PREFIX}/resource/${id}`,
    RESTORE: (id: string) => `${ADMIN_API_PREFIX}/resource/restore/${id}`,
    CHANGE_SEQUENCE: `${ADMIN_API_PREFIX}/resource/change_sequence`,
    CHANGE_PARENT: (id: string) => `${ADMIN_API_PREFIX}/resource/change_parent/${id}`,
    TREE: "/resources/tree",
    GROUPS: "/resources/groups",
    MENUS: `${ADMIN_API_PREFIX}/resource/menus`,
  },


  // User management (admin)
  USER: {
    PAGES: `${ADMIN_API_PREFIX}/user/pages`,
    LIST: `${ADMIN_API_PREFIX}/user/list`,
    LIST_WITH_DEVICE_TOKEN: `${ADMIN_API_PREFIX}/user/list-with-device-token`,
    CREATE: `${ADMIN_API_PREFIX}/user`,
    DETAIL: (id: string) => `${ADMIN_API_PREFIX}/user/${id}`,
    UPDATE: (id: string) => `${ADMIN_API_PREFIX}/user/${id}`,
    DELETE: (id: string) => `${ADMIN_API_PREFIX}/user/${id}`,
    RESTORE: `${ADMIN_API_PREFIX}/user/restore`,
    ME: `${ADMIN_API_PREFIX}/user/me`,
    UPDATE_ME: `${ADMIN_API_PREFIX}/user/me`,
    BIND_ROLE: (id: string) => `${ADMIN_API_PREFIX}/user/${id}/bind_role`,
    ROLES: (id: string) => `${ADMIN_API_PREFIX}/user/${id}/roles`,
  },

  // Demo management
  DEMOS: {
    PAGES: `${ADMIN_API_PREFIX}/demo/pages`,
    CREATE: `${ADMIN_API_PREFIX}/demo`,
    UPDATE: (id: string) => `${ADMIN_API_PREFIX}/demo/${id}`,
    DELETE: (id: string) => `${ADMIN_API_PREFIX}/demo/${id}`,
    RESTORE: `${ADMIN_API_PREFIX}/demo/restore`,
  },

} as const;

// HTTP status codes
export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  UNPROCESSABLE_ENTITY: 422,
  INTERNAL_SERVER_ERROR: 500,
  BAD_GATEWAY: 502,
  SERVICE_UNAVAILABLE: 503,
} as const;

// Request configuration
export const REQUEST_CONFIG = {
  BASE_URL: API_BASE_URL,
  TIMEOUT: API_TIMEOUT,
  RETRY_ATTEMPTS: 3,
  RETRY_DELAY: 1000,
  HEADERS: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
} as const;

// Error messages
export const ERROR_MESSAGES = {
  NETWORK_ERROR: "Network connection error. Please check your internet connection.",
  TIMEOUT_ERROR: "Request timed out. Please try again later.",
  UNAUTHORIZED: "Unauthorized. Please sign in again.",
  FORBIDDEN: "Insufficient permissions to perform this action.",
  NOT_FOUND: "Requested resource was not found.",
  SERVER_ERROR: "Server error. Please try again later.",
  VALIDATION_ERROR: "Data validation failed.",
  UNKNOWN_ERROR: "An unknown error occurred.",
} as const;

// Cache configuration
export const CACHE_CONFIG = {
  DEFAULT_TTL: 5 * 60 * 1000, // 5 minutes
  RESOURCES_TTL: 30 * 60 * 1000, // 30 minutes
  ROLES_TTL: 10 * 60 * 1000, // 10 minutes
  STATS_TTL: 2 * 60 * 1000, // 2 minutes
} as const;
