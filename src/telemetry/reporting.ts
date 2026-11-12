import * as Sentry from "@sentry/react";
import type { RootOptions } from "react-dom/client";
import { ApiFailureError, sanitizeUrl } from "./privacy";

interface ApiFailureRequest {
  method?: string;
  url?: string;
}

const URL_ORIGIN = /^[a-z][\w+.-]*:\/\/[^/]*/i;
const STATIC_SEGMENT = /^(?:[a-z]+(?:[-_][a-z]+)*|v\d+)?$/i;

const apiRoute = (url: string) =>
  sanitizeUrl(url)
    .replace(URL_ORIGIN, "")
    .split("/")
    .map((segment) => (STATIC_SEGMENT.test(segment) ? segment : "{id}"))
    .join("/");

let currentAdministratorId: string | null = null;

// 32 lowercase hex characters; `getRandomValues` also works outside secure contexts, unlike `randomUUID`.
const newTraceId = () =>
  Array.from(crypto.getRandomValues(new Uint8Array(16)), (byte) => byte.toString(16).padStart(2, "0")).join("");

const SEPARATION_FAILED = "Telemetry could not separate Administrator activity";

// Ends the previous Administrator's trace and Replay before the identity changes, so neither continues into
// the next Administrator's activity or carries their ID. Replay restarts in the mode sampling chose at page
// load; its unsent tail segment is dropped rather than sent under the next identity. Telemetry faults are
// logged and never break login or logout.
const separateAdministratorActivity = () => {
  try {
    const activeSpan = Sentry.getActiveSpan();
    if (activeSpan) Sentry.getRootSpan(activeSpan).end();
    Sentry.getCurrentScope().setPropagationContext({ traceId: newTraceId(), sampleRand: Math.random() });

    const replay = Sentry.getReplay();
    const mode = replay?.getRecordingMode();
    if (!replay || !mode) return;
    replay
      .stop({ flush: false })
      .then(() => (mode === "session" ? replay.start() : replay.startBuffering()))
      .catch(() => console.warn(SEPARATION_FAILED));
  } catch {
    console.warn(SEPARATION_FAILED);
  }
};

/**
 * Sets the telemetry user to the internal Administrator ID only; `null` clears it. Breadcrumbs are
 * dropped too: they hold the previous Administrator's URLs and clicks, and logout does not reload the page.
 * Logout or an account change also ends the previous Administrator's trace and Replay.
 */
export const setTelemetryUser = (administratorId: string | null) => {
  if (currentAdministratorId && currentAdministratorId !== administratorId) {
    separateAdministratorActivity();
  }
  currentAdministratorId = administratorId;
  Sentry.setUser(administratorId ? { id: administratorId } : null);
  Sentry.getIsolationScope().clearBreadcrumbs();
};

/**
 * Reports a 5xx API response as one issue per route and status. Bodies and backend messages are not
 * sent; 4xx responses (permission, validation, Booking rejections), timeouts, and offline errors are not issues.
 */
export const reportApiFailure = (status: number, request: ApiFailureRequest) => {
  if (status < 500) return;

  const method = (request.method ?? "GET").toUpperCase();
  const route = apiRoute(request.url ?? "");
  Sentry.captureException(new ApiFailureError(`API ${status} ${method} ${route}`), {
    fingerprint: ["api-failure", method, route, String(status)],
    tags: { "api.method": method, "api.route": route, "api.status": status },
  });
};

/** Reports a defect raised inside the API client or auth service, which reaches callers as a generic failure. */
export const reportUnexpectedError = (error: Error) => {
  Sentry.captureException(error);
};

/** React root error hooks: report once, then keep React's default console/global reporting. */
export const telemetryRootOptions = {
  onCaughtError: Sentry.reactErrorHandler((error) => console.error(error)),
  onUncaughtError: (error, errorInfo) => {
    Sentry.captureReactException(error, errorInfo, {
      mechanism: { handled: false, type: "auto.function.react.error_handler" },
    });
    reportError(error);
  },
} satisfies Pick<RootOptions, "onCaughtError" | "onUncaughtError">;
