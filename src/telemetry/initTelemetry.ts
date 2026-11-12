import * as Sentry from "@sentry/react";
import type { TelemetryConfig, TelemetrySampleRates } from "@/config/telemetry";
import {
  type TelemetryTransport,
  sanitizeBreadcrumb,
  sanitizeEvent,
  sanitizeLog,
  sanitizeRecordingEvent,
  sanitizeReplayEnvelope,
  sanitizeReplayEvent,
  sanitizeSpan,
} from "./privacy";

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

// Every screen can show Administrators' and members' data, so nothing is unmasked anywhere. Attributes the app
// fills with names (tooltips, labels, previews) are masked too; network details (headers, bodies) are never captured.
// Recordings stay uncompressed so `withRecordingPrivacy` can sanitize the URLs rrweb records (masking skips href/src).
const REPLAY_PRIVACY_OPTIONS = {
  maskAllText: true,
  maskAllInputs: true,
  blockAllMedia: true,
  maskAttributes: ["title", "placeholder", "aria-label", "alt"],
  useCompression: false,
  networkDetailAllowUrls: [],
  networkCaptureBodies: false,
  beforeAddRecordingEvent: sanitizeRecordingEvent,
} satisfies Parameters<typeof Sentry.replayIntegration>[0];

// Replay events skip `beforeSend`; an integration's event processor still sees them.
const replayEventPrivacyIntegration = (): Parameters<typeof Sentry.addIntegration>[0] => ({
  name: "ReplayEventPrivacy",
  processEvent: sanitizeReplayEvent,
});

const withRecordingPrivacy =
  (makeTransport: TelemetryTransport): TelemetryTransport =>
  (options) => {
    const transport = makeTransport(options);
    return {
      ...transport,
      send: (envelope) => {
        const sanitized = sanitizeReplayEnvelope(envelope);
        return sanitized ? transport.send(sanitized) : Promise.resolve({});
      },
    };
  };

const hasReplaySampling = (config: TelemetrySampleRates) =>
  config.replaysSessionSampleRate !== undefined || config.replaysOnErrorSampleRate !== undefined;

/**
 * Initialize the Admin Portal Sentry client once. Returns whether a client is active.
 * Safe to call repeatedly (StrictMode, re-evaluated entry); later calls are no-ops.
 */
export const initTelemetry = (config: TelemetryConfig, { transport }: InitTelemetryOptions = {}): boolean => {
  if (!config.enabled) return false;
  if (Sentry.isInitialized()) return true;

  // Errors, breadcrumbs, and warning/error logs always; tracing and Replay only when their sample rates are
  // configured. Sessions, metrics, client reports, and Profiling are not part of this integration.
  const isTracing = config.tracesSampleRate !== undefined;
  const isReplaying = hasReplaySampling(config);
  const telemetryTransport = isReplaying ? withRecordingPrivacy(transport ?? Sentry.makeFetchTransport) : transport;
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
      ...(isTracing ? [Sentry.browserTracingIntegration()] : []),
      ...(isReplaying ? [Sentry.replayIntegration(REPLAY_PRIVACY_OPTIONS), replayEventPrivacyIntegration()] : []),
    ],
    // Sentry-native `sentry-trace` + `baggage`, which Core API continues. W3C `traceparent` stays off until a
    // backend needs it. Headers go only to the Admin API (see `resolveTelemetryConfig`).
    ...(isTracing
      ? {
          tracesSampleRate: config.tracesSampleRate,
          tracePropagationTargets: config.tracePropagationTargets,
          propagateTraceparent: false,
          beforeSendSpan: sanitizeSpan,
        }
      : {}),
    ...(isReplaying
      ? {
          replaysSessionSampleRate: config.replaysSessionSampleRate ?? 0,
          replaysOnErrorSampleRate: config.replaysOnErrorSampleRate ?? 0,
        }
      : {}),
    dataCollection: PRIVATE_DATA_COLLECTION,
    sendClientReports: false,
    beforeSend: sanitizeEvent,
    beforeBreadcrumb: sanitizeBreadcrumb,
    beforeSendLog: sanitizeLog,
    beforeSendMetric: () => null,
    ...(telemetryTransport ? { transport: telemetryTransport } : {}),
  });
  return Sentry.isInitialized();
};
