// Environment variable configuration
// Centralize all environment variables to avoid direct use of import.meta.env or process.env

/**
 * Application environment type
 * - development: development environment (pnpm run dev)
 * - staging: pre-release environment (pnpm run build:stg)
 * - production: production environment (pnpm run build)
 */
export type AppEnv = "development" | "staging" | "production" | "test";

/**
 * Application environment configuration
 */
export const ENV_CONFIG = {
  // Application environment (using Vite MODE or environment variables)
  // Vite MODE can be specified at build time with --mode
  // - pnpm run dev -> MODE = "development"
  // - vite build --mode staging -> MODE = "staging"
  // - vite build -> MODE = "production" (default)
  APP_ENV: (import.meta.env.MODE as AppEnv) || "development",

  // Node environment (for compatibility; may be unavailable in browsers)
  // During Vite builds, NODE_ENV is set automatically:
  // - development mode: NODE_ENV = "development"
  // - build mode: NODE_ENV = "production" (regardless of MODE)
  NODE_ENV: import.meta.env.PROD ? "production" : "development",

  // APP Base
  APP_NAME: import.meta.env.VITE_APP_NAME || "Newlife Portal",

  // API configuration
  API_BASE_URL: import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000",
  API_TIMEOUT: parseInt(import.meta.env.VITE_API_TIMEOUT || "90000", 10), // 90 seconds

  // Authentication configuration
  SKIP_AUTH: import.meta.env.VITE_SKIP_AUTH === "true",
  /** When true (development only), show email/password login on the sign-in page. */
  SHOW_DEV_LOGIN: import.meta.env.VITE_SHOW_DEV_LOGIN === "true",
  USE_MOCK_API: import.meta.env.VITE_USE_MOCK_API !== "false",
  USE_MOCK_DEMO: import.meta.env.VITE_USE_MOCK_DEMO === "true",

  // Microsoft Entra ID (Admin Portal) — optional; when set, shows "Sign in with Microsoft"
  AZURE_CLIENT_ID: (import.meta.env.VITE_AZURE_CLIENT_ID as string | undefined) || "",
  AZURE_TENANT_ID: (import.meta.env.VITE_AZURE_TENANT_ID as string | undefined) || "",
  AZURE_REDIRECT_URI: (import.meta.env.VITE_AZURE_REDIRECT_URI as string | undefined) || "",

  // Application configuration
  APP_TITLE: import.meta.env.VITE_APP_TITLE || "Newlife Portal",
  APP_VERSION: import.meta.env.VITE_APP_VERSION || "1.0.0",

  // Development tooling configuration
  ENABLE_DEBUG: import.meta.env.VITE_ENABLE_DEBUG === "true",
  LOG_LEVEL: import.meta.env.VITE_LOG_LEVEL || "info",
} as const;

/**
 * Whether this is development environment
 */
export const IS_DEV = ENV_CONFIG.APP_ENV === "development";

/**
 * Whether this is staging environment
 */
export const IS_STAGING = ENV_CONFIG.APP_ENV === "staging";

/**
 * Whether this is production environment
 */
export const IS_PROD = ENV_CONFIG.APP_ENV === "production";

/**
 * Whether this is test environment
 */
export const IS_TEST = ENV_CONFIG.APP_ENV === "test";

/**
 * Whether this is a production build (including staging and production)
 * When NODE_ENV === "production", this is an optimized build
 */
export const IS_PROD_BUILD = ENV_CONFIG.NODE_ENV === "production";

/**
 * Whether auth skipping is enabled (development environment only)
 */
export const IS_SKIP_AUTH = IS_DEV && ENV_CONFIG.SKIP_AUTH;
/** Email/password block on sign-in; development only, controlled by VITE_SHOW_DEV_LOGIN. */
export const IS_SHOW_DEV_LOGIN = IS_DEV && ENV_CONFIG.SHOW_DEV_LOGIN;
export const IS_MOCK_API = IS_DEV && ENV_CONFIG.USE_MOCK_API;
export const IS_MOCK_DEMO = IS_DEV && (ENV_CONFIG.USE_MOCK_DEMO || ENV_CONFIG.USE_MOCK_API);

/** True when VITE_AZURE_CLIENT_ID and VITE_AZURE_TENANT_ID are set (production/staging may enable without dev-only flags). */
export const IS_MICROSOFT_LOGIN_ENABLED = Boolean(ENV_CONFIG.AZURE_CLIENT_ID?.trim()) && Boolean(ENV_CONFIG.AZURE_TENANT_ID?.trim());
