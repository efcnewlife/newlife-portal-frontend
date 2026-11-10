// Telemetry (Sentry) configuration resolution.
// Pure: env.ts feeds raw values in, so the rules stay testable without import.meta.env.

export const TELEMETRY_RELEASE_PREFIX = "newlife-portal-frontend";

/** Canonical telemetry environments shared with Core API and Facility Booking. */
export type TelemetryEnvironment = "dev" | "stg" | "prod";

export type TelemetryDisabledReason = "unknown_mode" | "disabled" | "missing_dsn" | "invalid_release";

/** Optional collection channels. An unset rate leaves its channel off; no sampling policy is prescribed. */
export interface TelemetrySampleRates {
  tracesSampleRate?: number;
  replaysSessionSampleRate?: number;
  replaysOnErrorSampleRate?: number;
}

export type TelemetryConfig =
  | ({
      enabled: true;
      dsn: string;
      environment: TelemetryEnvironment;
      release: string;
      /** Only the Admin API receives trace headers; empty when the API base URL is unusable. */
      tracePropagationTargets: RegExp[];
    } & TelemetrySampleRates)
  | { enabled: false; reason: TelemetryDisabledReason };

export interface TelemetryConfigInput {
  /** Raw Vite build mode (`--mode`); a plain string so unknown modes can be rejected. */
  mode: string;
  dsn: string;
  /** Raw VITE_SENTRY_ENABLED value. */
  enabled: string | undefined;
  /** Raw VITE_SENTRY_RELEASE_VERSION value. */
  releaseVersion: string;
  /** Core API base URL the API client prefixes to every request. */
  apiBaseUrl: string;
  /** Raw VITE_SENTRY_TRACES_SAMPLE_RATE value. */
  tracesSampleRate: string | undefined;
  /** Raw VITE_SENTRY_REPLAYS_SESSION_SAMPLE_RATE value. */
  replaysSessionSampleRate: string | undefined;
  /** Raw VITE_SENTRY_REPLAYS_ON_ERROR_SAMPLE_RATE value. */
  replaysOnErrorSampleRate: string | undefined;
}

// Build mode -> telemetry environment. Unknown modes (including Vitest's "test") never export.
const ENVIRONMENT_BY_MODE = new Map<string, TelemetryEnvironment>([
  ["development", "dev"],
  ["staging", "stg"],
  ["production", "prod"],
]);

// Deployed builds must carry a real version: short commit SHA for staging, x.y.z for production.
const DEPLOYED_RELEASE_PATTERN: Record<Exclude<TelemetryEnvironment, "dev">, RegExp> = {
  stg: /^[0-9a-f]{7,12}$/,
  prod: /^\d+\.\d+\.\d+$/,
};

const resolveReleaseVersion = (environment: TelemetryEnvironment, releaseVersion: string): string | null => {
  if (environment === "dev") return "local";
  return DEPLOYED_RELEASE_PATTERN[environment].test(releaseVersion) ? releaseVersion : null;
};

// Same rule as Core API's SENTRY_TRACES_SAMPLE_RATE: a decimal in 0..1, anything else leaves the channel off.
const SAMPLE_RATE_PATTERN = /^(?:0(?:\.\d+)?|1(?:\.0+)?|\.\d+)$/;

const parseSampleRate = (raw: string | undefined): number | undefined => {
  const trimmed = raw?.trim() ?? "";
  return SAMPLE_RATE_PATTERN.test(trimmed) ? Number(trimmed) : undefined;
};

const ADMIN_API_PATH = "/admin/api/v1";

const escapeRegExp = (text: string) => text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

// Anchored on the API origin and the Admin API path, so MSAL, other services, and look-alike hosts never
// receive trace headers.
const resolvePropagationTargets = (apiBaseUrl: string): RegExp[] => {
  if (!URL.canParse(apiBaseUrl)) return [];
  const { origin, pathname } = new URL(apiBaseUrl);
  const prefix = `${origin}${pathname.replace(/\/+$/, "")}${ADMIN_API_PATH}`;
  return [new RegExp(`^${escapeRegExp(prefix)}(?:[/?#]|$)`)];
};

const pickRates = (rates: TelemetrySampleRates): TelemetrySampleRates =>
  Object.fromEntries(Object.entries(rates).filter(([, rate]) => rate !== undefined));

export const resolveTelemetryConfig = ({
  mode,
  dsn,
  enabled,
  releaseVersion,
  apiBaseUrl,
  tracesSampleRate,
  replaysSessionSampleRate,
  replaysOnErrorSampleRate,
}: TelemetryConfigInput): TelemetryConfig => {
  const environment = ENVIRONMENT_BY_MODE.get(mode);
  if (!environment) return { enabled: false, reason: "unknown_mode" };

  // Development export is opt-in; deployed environments export when unset or "true".
  // Any other value (typos included) fails closed.
  const isEnabled = enabled === "true" || (environment !== "dev" && !enabled);
  if (!isEnabled) return { enabled: false, reason: "disabled" };

  const trimmedDsn = dsn.trim();
  if (!trimmedDsn) return { enabled: false, reason: "missing_dsn" };

  const version = resolveReleaseVersion(environment, releaseVersion.trim());
  if (!version) return { enabled: false, reason: "invalid_release" };

  return {
    enabled: true,
    dsn: trimmedDsn,
    environment,
    release: `${TELEMETRY_RELEASE_PREFIX}@${version}`,
    tracePropagationTargets: resolvePropagationTargets(apiBaseUrl.trim()),
    ...pickRates({
      tracesSampleRate: parseSampleRate(tracesSampleRate),
      replaysSessionSampleRate: parseSampleRate(replaysSessionSampleRate),
      replaysOnErrorSampleRate: parseSampleRate(replaysOnErrorSampleRate),
    }),
  };
};
