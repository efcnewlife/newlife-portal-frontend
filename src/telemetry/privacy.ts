import type {
  Breadcrumb,
  BreadcrumbHint,
  BrowserOptions,
  ErrorEvent,
  Event,
  EventHint,
  Exception,
  Log,
  replayIntegration,
  StackFrame,
} from "@sentry/react";

/**
 * Privacy contract applied to every Sentry channel before transmission. Telemetry keeps code
 * locations, route paths, status codes, and the internal Administrator ID; it never carries bodies,
 * credentials, tokens, names, email addresses, phone numbers, remarks, or query/fragment values.
 */

export const FILTERED = "[Filtered]";

const BEARER = /\bBearer\s+\S+/gi;
const JWT = /\beyJ[\w-]+\.[\w-]+\.[\w-]*/g;
const EMAIL = /[\w.+-]+@[\w-]+(?:\.[\w-]+)+/g;
const PHONES = [
  /\+\d{1,3}[\s.-]?\(?\d{1,4}\)?(?:[\s.-]?\d{2,4}){2,4}/g,
  /\(\d{3}\)\s?\d{3}[\s.-]\d{4}/g,
  /\b\d{3}[\s.-]\d{3}[\s.-]\d{4}\b/g,
];
const ABSOLUTE_URL = /\bhttps?:\/\/[^\s"'<>]+/g;
const QUERY_VALUE = /([?&][^=\s&#?]+)=[^&\s#"'<>]*/g;
const SENSITIVE_JSON_VALUE =
  /"([\w-]*(?:token|password|secret|authorization|cookie|remark|email|phone|name)[\w-]*)"\s*:\s*"(?:[^"\\]|\\.)*"/gi;
const SELECTOR_ATTRIBUTE = /\[[^\]"]*(?:"[^"]*"[^\]"]*)*\]/g;
const URL_CREDENTIALS = /^([a-z][\w+.-]*:\/\/)[^/@]*@/i;
const ERROR_TEXT = /^([\w$.]*Error):/;

// httpClient logs every ApiError: its 5xx is already an event and its 4xx is not an issue.
const API_CLIENT_LOG_TEMPLATE = "API Error: {}";

type StreamedSpan = Parameters<NonNullable<BrowserOptions["beforeSendSpan"]>>[0];
export type TelemetryTransport = NonNullable<BrowserOptions["transport"]>;
type Envelope = Parameters<ReturnType<TelemetryTransport>["send"]>[0];
type ReplayOptions = NonNullable<Parameters<typeof replayIntegration>[0]>;
type RecordingEvent = Parameters<NonNullable<ReplayOptions["beforeAddRecordingEvent"]>>[0];

const LOG_LEVELS = new Set<Log["level"]>(["warn", "error", "fatal"]);
const LOG_ATTRIBUTES = new Set([
  "sentry.origin",
  "sentry.environment",
  "sentry.release",
  "sentry.sdk.name",
  "sentry.sdk.version",
  "sentry.message.template",
  "sentry.trace.parent_span_id",
  "user.id",
]);

/** A 5xx API response. Its message is authored from the status, method, and route template only. */
export class ApiFailureError extends Error {
  override name = "ApiFailureError";
}

const scrubIdentifiers = (text: string): string => {
  let scrubbed = text.replace(BEARER, `Bearer ${FILTERED}`).replace(JWT, FILTERED).replace(EMAIL, FILTERED);
  for (const phone of PHONES) {
    scrubbed = scrubbed.replace(phone, FILTERED);
  }
  return scrubbed;
};

/** Keeps scheme, host, and path; drops credentials, the query string, and the fragment. */
export const sanitizeUrl = (url: string): string =>
  scrubIdentifiers(url.split(/[?#]/, 1)[0].replace(URL_CREDENTIALS, "$1"));

/** Pattern-based redaction for free-form text the app authors or a library logs. Cannot detect names. */
export const scrubText = (text: string): string =>
  scrubIdentifiers(
    text.replace(ABSOLUTE_URL, (url) => sanitizeUrl(url)).replace(SENSITIVE_JSON_VALUE, `"$1":"${FILTERED}"`)
  ).replace(QUERY_VALUE, `$1=${FILTERED}`);

/** Only a leading string is authored; later arguments may be API errors or backend text. */
const describeConsoleArgs = (args: unknown[]): string =>
  args.map((arg, index) => (index === 0 && typeof arg === "string" ? scrubText(arg) : FILTERED)).join(" ");

const scrubFormattedMessage = (message: string): string => {
  const [firstLine] = message.split("\n", 1);
  if (/^\s*[[{]/.test(firstLine)) return FILTERED;
  const errorText = ERROR_TEXT.exec(firstLine);
  return errorText ? `${errorText[1]}: ${FILTERED}` : scrubText(firstLine);
};

const pickDefined = <T extends Record<string, unknown>>(record: T): Partial<T> =>
  Object.fromEntries(Object.entries(record).filter(([, value]) => value !== undefined)) as Partial<T>;

const sanitizeOptionalUrl = (value: unknown) => (typeof value === "string" ? sanitizeUrl(value) : undefined);

const stripSelectorAttributes = (selector: string) => scrubText(selector.replace(SELECTOR_ATTRIBUTE, ""));

export const sanitizeBreadcrumb = (breadcrumb: Breadcrumb, hint?: BreadcrumbHint): Breadcrumb => {
  const { data, message, ...rest } = breadcrumb;
  const category = breadcrumb.category ?? "";

  if (category === "console") {
    const args = Array.isArray(hint?.input) ? (hint.input as unknown[]) : undefined;
    return {
      ...rest,
      message: args ? describeConsoleArgs(args) : scrubFormattedMessage(message ?? ""),
      data: { logger: "console" },
    };
  }
  if (category === "fetch" || category === "xhr") {
    return {
      ...rest,
      data: pickDefined({ method: data?.method, url: sanitizeOptionalUrl(data?.url), status_code: data?.status_code }),
    };
  }
  if (category === "navigation") {
    return { ...rest, data: pickDefined({ from: sanitizeOptionalUrl(data?.from), to: sanitizeOptionalUrl(data?.to) }) };
  }
  if (category.startsWith("ui.")) {
    return pickDefined({ ...rest, message: message && stripSelectorAttributes(message) });
  }
  return pickDefined({ ...rest, message: message && scrubText(message) });
};

export const sanitizeLog = (log: Log): Log | null => {
  if (!LOG_LEVELS.has(log.level)) return null;

  const attributes = log.attributes ?? {};
  const template = attributes["sentry.message.template"];
  if (template === API_CLIENT_LOG_TEMPLATE) return null;

  const message = typeof template === "string" ? scrubText(template) : scrubFormattedMessage(String(log.message));
  if (message === FILTERED) return null;

  const safeAttributes = Object.fromEntries(
    Object.entries(attributes).filter(([key]) => LOG_ATTRIBUTES.has(key))
  ) as NonNullable<Log["attributes"]>;
  if (typeof template === "string") {
    safeAttributes["sentry.message.template"] = message;
  }
  return { ...log, message, attributes: safeAttributes };
};

/**
 * `ApiError` / `AuthError` objects rejected by the API client. Eligible failures are reported once
 * where they occur; their rejections (expected 4xx, conflicts, or already-reported 5xx) are not issues.
 */
export const isApiClientRejection = (value: unknown): boolean => {
  if (typeof value !== "object" || value === null || value instanceof Error) return false;
  const { code, message } = value as { code?: unknown; message?: unknown };
  return typeof message === "string" && (typeof code === "number" || typeof code === "string");
};

const scrubDeep = (value: unknown): unknown => {
  if (typeof value === "string") return scrubText(value);
  if (Array.isArray(value)) return value.map(scrubDeep);
  if (value && typeof value === "object") {
    return Object.fromEntries(Object.entries(value).map(([key, nested]) => [key, scrubDeep(nested)]));
  }
  return value;
};

const sanitizeFrame = ({ filename, abs_path, function: fn, module, lineno, colno, in_app }: StackFrame): StackFrame =>
  pickDefined({
    filename: sanitizeOptionalUrl(filename),
    abs_path: sanitizeOptionalUrl(abs_path),
    function: fn,
    module,
    lineno,
    colno,
    in_app,
  });

// Exception text is always dropped: Admin screens show member data, and names in a message or a parsed
// payload cannot be detected by pattern. Diagnosis relies on types, chained causes, and stack frames.
const sanitizeException = ({ value, stacktrace, ...exception }: Exception, keepValue: boolean): Exception =>
  pickDefined({
    ...exception,
    value: keepValue ? value : undefined,
    stacktrace: stacktrace && { ...stacktrace, frames: stacktrace.frames?.map(sanitizeFrame) },
  });

// Fields every event type shares: identity, request, transaction name, tags, contexts, and breadcrumbs.
const sanitizeSharedFields = <T extends Event>(event: T): T => {
  const { user, request, ...rest } = event;
  const sanitized = rest as T;
  delete sanitized.extra;
  delete sanitized.logentry;
  // The SDK copies thrown strings here, indistinguishably from captureMessage text.
  delete sanitized.message;

  if (user?.id !== undefined && user.id !== null && user.id !== "") {
    sanitized.user = { id: String(user.id) };
  }
  if (request) {
    const userAgent = request.headers?.["User-Agent"];
    sanitized.request = pickDefined({
      url: sanitizeOptionalUrl(request.url),
      headers: userAgent ? { "User-Agent": userAgent } : undefined,
    });
  }
  if (event.transaction) sanitized.transaction = scrubText(event.transaction);
  if (event.tags) sanitized.tags = scrubDeep(event.tags) as T["tags"];
  if (event.contexts) sanitized.contexts = scrubDeep(event.contexts) as T["contexts"];
  if (event.breadcrumbs) sanitized.breadcrumbs = event.breadcrumbs.map((breadcrumb) => sanitizeBreadcrumb(breadcrumb));
  return sanitized;
};

export const sanitizeEvent = (event: ErrorEvent, hint: EventHint): ErrorEvent | null => {
  if (isApiClientRejection(hint.originalException)) return null;

  const sanitized = sanitizeSharedFields(event);
  if (event.exception?.values) {
    const keepValue = hint.originalException instanceof ApiFailureError;
    sanitized.exception = {
      ...event.exception,
      values: event.exception.values.map((exception) => sanitizeException(exception, keepValue)),
    };
  }
  return sanitized;
};

// The SDK splits query strings and fragments into their own span attributes.
const DROPPED_SPAN_ATTRIBUTES = new Set(["http.query", "http.fragment", "url.query", "url.fragment"]);
const URL_SPAN_ATTRIBUTE = /(?:^|[._])url(?:\.full)?$/i;
// Web vital attributes name the element as a selector, e.g. `img.preview[alt="<file name>"]`.
const SELECTOR_SPAN_ATTRIBUTE = /^browser\.web_vital\./;

const sanitizeSpanAttribute = (key: string, value: unknown): unknown => {
  if (typeof value !== "string") return scrubDeep(value);
  if (URL_SPAN_ATTRIBUTE.test(key)) return sanitizeUrl(value);
  return SELECTOR_SPAN_ATTRIBUTE.test(key) ? stripSelectorAttributes(value) : scrubText(value);
};

/**
 * Streamed spans keep timing, operation, method, status, route paths, and sanitized URLs. Query strings,
 * fragments, selector attribute values, and any user attribute other than the internal ID are removed.
 */
export const sanitizeSpan = (span: StreamedSpan): StreamedSpan => {
  const isUiSpan = String(span.attributes["sentry.op"] ?? "").startsWith("ui.");
  return {
    ...span,
    name: isUiSpan ? stripSelectorAttributes(span.name) : scrubText(span.name),
    attributes: Object.fromEntries(
      Object.entries(span.attributes)
        .filter(([key]) => !DROPPED_SPAN_ATTRIBUTES.has(key) && (!key.startsWith("user.") || key === "user.id"))
        .map(([key, value]) => [key, sanitizeSpanAttribute(key, value)])
    ),
  };
};

/** Replay events list every page URL the replay visited; only scheme, host, and path remain. */
export const sanitizeReplayEvent = (event: Event): Event => {
  if (event.type !== "replay_event") return event;
  const sanitized = sanitizeSharedFields(event) as Event & { urls?: unknown };
  if (Array.isArray(sanitized.urls)) {
    sanitized.urls = sanitized.urls.map((url) => (typeof url === "string" ? sanitizeUrl(url) : FILTERED));
  }
  return sanitized;
};

interface RecordingSpan {
  op: string;
  description: string;
  data?: Record<string, unknown>;
}

const sizeOnly = (detail: unknown) =>
  detail && typeof detail === "object" ? pickDefined({ size: (detail as { size?: unknown }).size }) : undefined;

const sanitizeRecordingSpan = (span: RecordingSpan): RecordingSpan => {
  const { op, description, data } = span;
  if (op === "resource.fetch" || op === "resource.xhr") {
    return {
      ...span,
      description: sanitizeUrl(description),
      data: pickDefined({
        method: data?.method,
        statusCode: data?.statusCode,
        request: sizeOnly(data?.request),
        response: sizeOnly(data?.response),
      }),
    };
  }
  const isUrl = op.startsWith("navigation.") || op.startsWith("resource.");
  return {
    ...span,
    description: isUrl ? sanitizeUrl(description) : scrubText(description),
    ...(data ? { data: scrubDeep(data) as Record<string, unknown> } : {}),
  };
};

// Replay adds the clicked node's text and attributes to its own UI breadcrumbs; only the node reference stays.
const sanitizeRecordingBreadcrumb = (breadcrumb: Breadcrumb): Breadcrumb => {
  const sanitized = sanitizeBreadcrumb(breadcrumb);
  if (!breadcrumb.category?.startsWith("ui.")) return sanitized;
  const { nodeId, node } = (breadcrumb.data ?? {}) as { nodeId?: unknown; node?: { id?: unknown; tagName?: unknown } };
  return {
    ...sanitized,
    ...(nodeId !== undefined || node
      ? { data: pickDefined({ nodeId, node: node && pickDefined({ id: node.id, tagName: node.tagName }) }) }
      : {}),
  };
};

/**
 * Replay's own recording frames: breadcrumbs, network and navigation spans, and SDK options. DOM snapshots
 * cannot be changed here; masking and blocking in `initTelemetry` cover them.
 */
export const sanitizeRecordingEvent = (event: RecordingEvent): RecordingEvent => {
  const { tag, payload } = event.data as { tag: string; payload: unknown };
  if (tag === "breadcrumb") {
    return {
      ...event,
      data: { ...event.data, payload: sanitizeRecordingBreadcrumb(payload as Breadcrumb) },
    } as RecordingEvent;
  }
  if (tag === "performanceSpan") {
    return {
      ...event,
      data: { ...event.data, payload: sanitizeRecordingSpan(payload as RecordingSpan) },
    } as RecordingEvent;
  }
  return event;
};

// rrweb records the page URL (meta events) and link, media, and form URLs (DOM attributes) unmasked, and
// `beforeAddRecordingEvent` never sees its events. Each of these keeps scheme, host, and path only.
const URL_RECORDING_KEYS = new Set(["href", "src", "poster", "action"]);

const sanitizeRecordingUrls = (value: unknown): unknown => {
  if (Array.isArray(value)) return value.map(sanitizeRecordingUrls);
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value).map(([key, nested]) => [
        key,
        URL_RECORDING_KEYS.has(key) && typeof nested === "string" ? sanitizeUrl(nested) : sanitizeRecordingUrls(nested),
      ])
    );
  }
  return value;
};

// An uncompressed recording item is `{"segment_id":n}\n[...events]`.
const sanitizeRecordingPayload = (payload: unknown): string => {
  const text = typeof payload === "string" ? payload : new TextDecoder().decode(payload as Uint8Array);
  const newline = text.indexOf("\n");
  const events = JSON.parse(text.slice(newline + 1)) as unknown;
  return `${text.slice(0, newline)}\n${JSON.stringify(sanitizeRecordingUrls(events))}`;
};

/**
 * Rewrites URLs inside Replay recording items before transmission. Returns `null` when a recording cannot be
 * read (for example compressed), so it is dropped rather than sent unchecked.
 */
export const sanitizeReplayEnvelope = (envelope: Envelope): Envelope | null => {
  const [headers, items] = envelope as unknown as [unknown, Array<[{ type?: string; length?: number }, unknown]>];
  if (!items.some(([header]) => header.type === "replay_recording")) return envelope;
  try {
    const sanitizedItems = items.map(([header, payload]) => {
      if (header.type !== "replay_recording") return [header, payload];
      const sanitized = sanitizeRecordingPayload(payload);
      return [{ ...header, length: new TextEncoder().encode(sanitized).length }, sanitized];
    });
    return [headers, sanitizedItems] as unknown as Envelope;
  } catch {
    return null;
  }
};
