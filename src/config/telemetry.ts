// Telemetry (Sentry) configuration resolution.
// Pure: env.ts feeds raw values in, so the rules stay testable without import.meta.env.

export const TELEMETRY_RELEASE_PREFIX = "newlife-portal-frontend";

/** Canonical telemetry environments shared with Core API and Facility Booking. */
export type TelemetryEnvironment = "dev" | "stg" | "prod";

export type TelemetryDisabledReason = "unknown_mode" | "disabled" | "missing_dsn" | "invalid_release";

export type TelemetryConfig =
  | { enabled: true; dsn: string; environment: TelemetryEnvironment; release: string }
  | { enabled: false; reason: TelemetryDisabledReason };

export interface TelemetryConfigInput {
  /** Raw Vite build mode (`--mode`); a plain string so unknown modes can be rejected. */
  mode: string;
  dsn: string;
  /** Raw VITE_SENTRY_ENABLED value. */
  enabled: string | undefined;
  /** Raw VITE_SENTRY_RELEASE_VERSION value. */
  releaseVersion: string;
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

export const resolveTelemetryConfig = ({
  mode,
  dsn,
  enabled,
  releaseVersion,
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

  return { enabled: true, dsn: trimmedDsn, environment, release: `${TELEMETRY_RELEASE_PREFIX}@${version}` };
};
