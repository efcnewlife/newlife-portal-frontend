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
    MICROSOFT: `${ADMIN_API_PREFIX}/auth/login/microsoft`,
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

  // Locale management
  LOCALE: {
    LIST: `${ADMIN_API_PREFIX}/locale/list`,
  },

  // System settings (admin)
  SETTING: {
    LIST: `${ADMIN_API_PREFIX}/system/settings/list`,
    BY_KEY: `${ADMIN_API_PREFIX}/system/settings/by-key`,
    CREATE: `${ADMIN_API_PREFIX}/system/settings`,
    DETAIL: (id: string) => `${ADMIN_API_PREFIX}/system/settings/${id}`,
    UPDATE: (id: string) => `${ADMIN_API_PREFIX}/system/settings/${id}`,
    DELETE: (id: string) => `${ADMIN_API_PREFIX}/system/settings/${id}`,
    RESTORE: `${ADMIN_API_PREFIX}/system/settings/restore`,
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
    CREATE: `${ADMIN_API_PREFIX}/user`,
    DETAIL: (id: string) => `${ADMIN_API_PREFIX}/user/${id}`,
    UPDATE: (id: string) => `${ADMIN_API_PREFIX}/user/${id}`,
    DELETE: (id: string) => `${ADMIN_API_PREFIX}/user/${id}`,
    RESTORE: `${ADMIN_API_PREFIX}/user/restore`,
    ME: `${ADMIN_API_PREFIX}/user/me`,
    UPDATE_ME: `${ADMIN_API_PREFIX}/user/me`,
    UPDATE_ME_PREFERRED_LANGUAGE: `${ADMIN_API_PREFIX}/user/me/preferred-language`,
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

  // Content (admin)
  CONTENT: {
    FILES: {
      PAGES: `${ADMIN_API_PREFIX}/content/file/pages`,
      SUMMARY: `${ADMIN_API_PREFIX}/content/file/summary`,
      UPLOAD: `${ADMIN_API_PREFIX}/content/file/upload`,
      BULK_DELETE: `${ADMIN_API_PREFIX}/content/file/bulk`,
      ASSOCIATION_PREVIEW: `${ADMIN_API_PREFIX}/content/file/association-preview`,
    },
    LEGAL_DOCUMENTS: {
      PAGES: `${ADMIN_API_PREFIX}/content/legal-document/pages`,
      CREATE: `${ADMIN_API_PREFIX}/content/legal-document`,
      DETAIL: (id: string) => `${ADMIN_API_PREFIX}/content/legal-document/${id}`,
      UPDATE: (id: string) => `${ADMIN_API_PREFIX}/content/legal-document/${id}`,
      DELETE: (id: string) => `${ADMIN_API_PREFIX}/content/legal-document/${id}`,
      RESTORE: `${ADMIN_API_PREFIX}/content/legal-document/restore`,
    },
  },

  // Facility booking (admin)
  FACILITY: {
    ROOMS: {
      PAGES: `${ADMIN_API_PREFIX}/facility/rooms/pages`,
      LIST: `${ADMIN_API_PREFIX}/facility/rooms/list`,
      CREATE: `${ADMIN_API_PREFIX}/facility/rooms`,
      DETAIL: (id: string) => `${ADMIN_API_PREFIX}/facility/rooms/${id}`,
      UPDATE: (id: string) => `${ADMIN_API_PREFIX}/facility/rooms/${id}`,
      DELETE: (id: string) => `${ADMIN_API_PREFIX}/facility/rooms/${id}`,
      RESTORE: `${ADMIN_API_PREFIX}/facility/rooms/restore`,
    },
    ROOM_SLOT_TEMPLATES: {
      PAGES: `${ADMIN_API_PREFIX}/facility/room-slot-templates/pages`,
      LIST: `${ADMIN_API_PREFIX}/facility/room-slot-templates/list`,
      CREATE: `${ADMIN_API_PREFIX}/facility/room-slot-templates`,
      DETAIL: (id: string) => `${ADMIN_API_PREFIX}/facility/room-slot-templates/${id}`,
      UPDATE: (id: string) => `${ADMIN_API_PREFIX}/facility/room-slot-templates/${id}`,
      DELETE: (id: string) => `${ADMIN_API_PREFIX}/facility/room-slot-templates/${id}`,
      RESTORE: (id: string) => `${ADMIN_API_PREFIX}/facility/room-slot-templates/${id}/restore`,
    },
    ROOM_BLACKOUTS: {
      PAGES: `${ADMIN_API_PREFIX}/facility/room-blackouts/pages`,
      LIST: `${ADMIN_API_PREFIX}/facility/room-blackouts/list`,
      CREATE: `${ADMIN_API_PREFIX}/facility/room-blackouts`,
      DETAIL: (id: string) => `${ADMIN_API_PREFIX}/facility/room-blackouts/${id}`,
      UPDATE: (id: string) => `${ADMIN_API_PREFIX}/facility/room-blackouts/${id}`,
      DELETE: (id: string) => `${ADMIN_API_PREFIX}/facility/room-blackouts/${id}`,
      RESTORE: (id: string) => `${ADMIN_API_PREFIX}/facility/room-blackouts/${id}/restore`,
    },
    RENTAL_RATE_TEMPLATES: {
      PAGES: `${ADMIN_API_PREFIX}/facility/rental-rate-templates/pages`,
      LIST: `${ADMIN_API_PREFIX}/facility/rental-rate-templates/list`,
      CREATE: `${ADMIN_API_PREFIX}/facility/rental-rate-templates`,
      DETAIL: (id: string) => `${ADMIN_API_PREFIX}/facility/rental-rate-templates/${id}`,
      UPDATE: (id: string) => `${ADMIN_API_PREFIX}/facility/rental-rate-templates/${id}`,
      DELETE: (id: string) => `${ADMIN_API_PREFIX}/facility/rental-rate-templates/${id}`,
      RESTORE: (id: string) => `${ADMIN_API_PREFIX}/facility/rental-rate-templates/${id}/restore`,
    },
    RENTAL_RATES: {
      PAGES: `${ADMIN_API_PREFIX}/facility/rental-rates/pages`,
      LIST: `${ADMIN_API_PREFIX}/facility/rental-rates/list`,
      CREATE: `${ADMIN_API_PREFIX}/facility/rental-rates`,
      DETAIL: (id: string) => `${ADMIN_API_PREFIX}/facility/rental-rates/${id}`,
      UPDATE: (id: string) => `${ADMIN_API_PREFIX}/facility/rental-rates/${id}`,
      DELETE: (id: string) => `${ADMIN_API_PREFIX}/facility/rental-rates/${id}`,
      RESTORE: (id: string) => `${ADMIN_API_PREFIX}/facility/rental-rates/${id}/restore`,
      PREVIEW_QUOTE: `${ADMIN_API_PREFIX}/facility/rental-rates/preview-quote`,
    },
    DISCOUNT_RULES: {
      LIST: `${ADMIN_API_PREFIX}/facility/discount-rules`,
      CREATE: `${ADMIN_API_PREFIX}/facility/discount-rules`,
      DETAIL: (id: string) => `${ADMIN_API_PREFIX}/facility/discount-rules/${id}`,
      UPDATE: (id: string) => `${ADMIN_API_PREFIX}/facility/discount-rules/${id}`,
      DELETE: (id: string) => `${ADMIN_API_PREFIX}/facility/discount-rules/${id}`,
    },
    SURCHARGES: {
      LIST: `${ADMIN_API_PREFIX}/facility/surcharges`,
      CREATE: `${ADMIN_API_PREFIX}/facility/surcharges`,
      DETAIL: (id: string) => `${ADMIN_API_PREFIX}/facility/surcharges/${id}`,
      UPDATE: (id: string) => `${ADMIN_API_PREFIX}/facility/surcharges/${id}`,
      DELETE: (id: string) => `${ADMIN_API_PREFIX}/facility/surcharges/${id}`,
    },
    POLICY_SETTINGS: {
      LIST: `${ADMIN_API_PREFIX}/facility/policy-settings`,
      DETAIL: (id: string) => `${ADMIN_API_PREFIX}/facility/policy-settings/${id}`,
      UPDATE: (id: string) => `${ADMIN_API_PREFIX}/facility/policy-settings/${id}`,
    },
    BOOKINGS: {
      PAGES: `${ADMIN_API_PREFIX}/facility/bookings/pages`,
      RANGE: `${ADMIN_API_PREFIX}/facility/bookings/range`,
      CREATE: `${ADMIN_API_PREFIX}/facility/bookings`,
      DETAIL: (id: string) => `${ADMIN_API_PREFIX}/facility/bookings/${id}`,
      UPDATE: (id: string) => `${ADMIN_API_PREFIX}/facility/bookings/${id}`,
      CANCEL: (id: string) => `${ADMIN_API_PREFIX}/facility/bookings/${id}/cancel`,
    },
    BOOKING_OVERRIDE_LOGS: {
      PAGES: `${ADMIN_API_PREFIX}/facility/booking-override-logs/pages`,
    },
  },

  // Ministry (admin)
  MINISTRY: {
    MINISTRIES: {
      PAGES: `${ADMIN_API_PREFIX}/ministry/ministries/pages`,
      LIST: `${ADMIN_API_PREFIX}/ministry/ministries/list`,
      CREATE: `${ADMIN_API_PREFIX}/ministry/ministries`,
      DETAIL: (id: string) => `${ADMIN_API_PREFIX}/ministry/ministries/${id}`,
      UPDATE: (id: string) => `${ADMIN_API_PREFIX}/ministry/ministries/${id}`,
      DELETE: (id: string) => `${ADMIN_API_PREFIX}/ministry/ministries/${id}`,
      RESTORE: `${ADMIN_API_PREFIX}/ministry/ministries/restore`,
      MEMBERS: (id: string) => `${ADMIN_API_PREFIX}/ministry/ministries/${id}/members`,
      STEWARD_DIRECTORY: `${ADMIN_API_PREFIX}/ministry/ministries/steward-directory`,
      SUBMIT: (id: string) => `${ADMIN_API_PREFIX}/ministry/ministries/${id}/submit`,
      APPROVE: (id: string) => `${ADMIN_API_PREFIX}/ministry/ministries/${id}/approve`,
      REJECT: (id: string) => `${ADMIN_API_PREFIX}/ministry/ministries/${id}/reject`,
    },
    APPROVALS: {
      PAGES: `${ADMIN_API_PREFIX}/ministry/approvals/pages`,
    },
    CATALOG: {
      MINISTRY_TYPES: `${ADMIN_API_PREFIX}/ministry/catalog/ministry-types`,
      TARGET_AUDIENCES: `${ADMIN_API_PREFIX}/ministry/catalog/target-audiences`,
    },
  },

  // Organization (admin)
  ORG: {
    POSITIONS: {
      PAGES: `${ADMIN_API_PREFIX}/org/positions/pages`,
      CREATE: `${ADMIN_API_PREFIX}/org/positions`,
      DETAIL: (id: string) => `${ADMIN_API_PREFIX}/org/positions/${id}`,
      UPDATE: (id: string) => `${ADMIN_API_PREFIX}/org/positions/${id}`,
      DELETE: (id: string) => `${ADMIN_API_PREFIX}/org/positions/${id}`,
      RESTORE: `${ADMIN_API_PREFIX}/org/positions/restore`,
      ASSIGN: (id: string) => `${ADMIN_API_PREFIX}/org/positions/${id}/assign`,
      ASSIGNABLE: `${ADMIN_API_PREFIX}/org/positions/assignable`,
    },
    MEMBERS: {
      PAGES: `${ADMIN_API_PREFIX}/org/members/pages`,
      CREATE: `${ADMIN_API_PREFIX}/org/members`,
      DETAIL: (id: string) => `${ADMIN_API_PREFIX}/org/members/${id}`,
      UPDATE: (id: string) => `${ADMIN_API_PREFIX}/org/members/${id}`,
      LINK: (id: string) => `${ADMIN_API_PREFIX}/org/members/${id}/link`,
    },
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
