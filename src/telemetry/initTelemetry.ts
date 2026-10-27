import * as Sentry from "@sentry/react";
import type { TelemetryConfig } from "@/config/telemetry";

interface InitTelemetryOptions {
  /** Test seam: replaces the network transport so tests never reach Sentry ingestion. */
  transport?: Sentry.BrowserOptions["transport"];
}

/**
 * Initialize the Admin Portal Sentry client once. Returns whether a client is active.
 * Safe to call repeatedly (StrictMode, re-evaluated entry); later calls are no-ops.
 */
export const initTelemetry = (config: TelemetryConfig, { transport }: InitTelemetryOptions = {}): boolean => {
  if (!config.enabled) return false;
  if (Sentry.isInitialized()) return true;

  Sentry.init({
    dsn: config.dsn,
    environment: config.environment,
    release: config.release,
    // Automatic errors, breadcrumbs, sessions, tracing, logs, and Replay stay off until
    // the privacy contract lands (EFC-283, EFC-286). Only explicit captures are sent.
    defaultIntegrations: false,
    integrations: [],
    sendClientReports: false,
    ...(transport ? { transport } : {}),
  });
  return Sentry.isInitialized();
};
