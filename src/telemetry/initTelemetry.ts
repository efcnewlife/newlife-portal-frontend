import * as Sentry from "@sentry/react";
import type { TelemetryConfig } from "@/config/telemetry";
import { sanitizeBreadcrumb, sanitizeEvent, sanitizeLog } from "./privacy";

interface InitTelemetryOptions {
  /** Test seam: replaces the network transport so tests never reach Sentry ingestion. */
  transport?: Sentry.BrowserOptions["transport"];
}

// The SDK collects no personal or request data itself; the internal Administrator ID is set
// explicitly and every channel passes through `privacy.ts` before transmission.
const PRIVATE_DATA_COLLECTION: Sentry.BrowserOptions["dataCollection"] = {
  userInfo: false,
  cookies: false,
  httpHeaders: false,
  httpBodies: [],
  urlQueryParams: false,
  graphQL: { document: false, variables: false },
  genAI: { inputs: false, outputs: false },
  databaseQueryData: false,
  queues: false,
  stackFrameVariables: false,
  frameContextLines: 0,
};

/**
 * Initialize the Admin Portal Sentry client once. Returns whether a client is active.
 * Safe to call repeatedly (StrictMode, re-evaluated entry); later calls are no-ops.
 */
export const initTelemetry = (config: TelemetryConfig, { transport }: InitTelemetryOptions = {}): boolean => {
  if (!config.enabled) return false;
  if (Sentry.isInitialized()) return true;

  // Errors, breadcrumbs, and warning/error logs only. Tracing and Replay stay off until EFC-286;
  // sessions, metrics, and client reports are not part of this integration.
  Sentry.init({
    dsn: config.dsn,
    environment: config.environment,
    release: config.release,
    defaultIntegrations: false,
    integrations: [
      Sentry.eventFiltersIntegration(),
      Sentry.functionToStringIntegration(),
      Sentry.browserApiErrorsIntegration(),
      Sentry.breadcrumbsIntegration(),
      Sentry.consoleIntegration({ levels: ["warn", "error"] }),
      Sentry.globalHandlersIntegration(),
      Sentry.linkedErrorsIntegration(),
      Sentry.dedupeIntegration(),
      Sentry.httpContextIntegration(),
      Sentry.consoleLoggingIntegration({ levels: ["warn", "error"] }),
    ],
    dataCollection: PRIVATE_DATA_COLLECTION,
    sendClientReports: false,
    beforeSend: sanitizeEvent,
    beforeBreadcrumb: sanitizeBreadcrumb,
    beforeSendLog: sanitizeLog,
    beforeSendMetric: () => null,
    ...(transport ? { transport } : {}),
  });
  return Sentry.isInitialized();
};
