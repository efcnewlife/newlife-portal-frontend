import type { Breadcrumb, ErrorEvent, Log } from "@sentry/react";
import { describe, expect, it } from "vitest";
import {
  ApiFailureError,
  FILTERED,
  isApiClientRejection,
  sanitizeBreadcrumb,
  sanitizeEvent,
  sanitizeLog,
  sanitizeUrl,
  scrubText,
} from "./privacy";

const EMAIL = "pii-marker@example.test";
const JWT = "eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJtYXJrZXIifQ.c2lnbmF0dXJl";
const NAME = "Zebulonmarker";

describe("sanitizeUrl", () => {
  it("drops credentials, the query string, and the fragment", () => {
    expect(sanitizeUrl(`https://user:pass@portal.example.test/org/members?search=${NAME}#id_token=${JWT}`)).toBe(
      "https://portal.example.test/org/members"
    );
  });

  it("handles relative URLs and personal data in the path", () => {
    expect(sanitizeUrl(`/admin/api/v1/user/${EMAIL}?token=abc`)).toBe(`/admin/api/v1/user/${FILTERED}`);
    expect(sanitizeUrl("/facility/booking-series/3fa85f64-5717-4562-b3fc-2c963f66afa6")).toBe(
      "/facility/booking-series/3fa85f64-5717-4562-b3fc-2c963f66afa6"
    );
  });
});

describe("scrubText", () => {
  it.each([
    [`Failed for ${EMAIL}`, `Failed for ${FILTERED}`],
    [`Bearer ${JWT}`, `Bearer ${FILTERED}`],
    [`token ${JWT} rejected`, `token ${FILTERED} rejected`],
    ["Call 416-555-0199 or (416) 555-0199 or +1 416 555 0199", `Call ${FILTERED} or ${FILTERED} or ${FILTERED}`],
    ["GET https://api.example.test/x?email=a&b=c#frag failed", "GET https://api.example.test/x failed"],
    ["GET /x?email=a failed", `GET /x?email=${FILTERED} failed`],
    [
      '{"accessToken":"abc","remark":"secret","id":"1"}',
      `{"accessToken":"${FILTERED}","remark":"${FILTERED}","id":"1"}`,
    ],
  ])("scrubs %j", (input, expected) => {
    expect(scrubText(input)).toBe(expected);
  });

  it("keeps dates and identifiers useful for diagnosis", () => {
    const text = "Booking 3fa85f64-5717-4562-b3fc-2c963f66afa6 on 2026-11-01 failed at 10:00";
    expect(scrubText(text)).toBe(text);
  });
});

describe("sanitizeBreadcrumb", () => {
  it("rebuilds console breadcrumbs from authored text only", () => {
    const apiError = { code: 500, message: `failed for ${EMAIL}`, details: { remark: "remark marker" } };
    const breadcrumb: Breadcrumb = {
      category: "console",
      level: "error",
      message: `API Error: ${JSON.stringify(apiError)}`,
      data: { arguments: ["API Error:", apiError], logger: "console" },
    };

    expect(sanitizeBreadcrumb(breadcrumb, { input: ["API Error:", apiError] })).toEqual({
      category: "console",
      level: "error",
      message: `API Error: ${FILTERED}`,
      data: { logger: "console" },
    });
  });

  it("keeps only the first console argument, even when later ones are strings", () => {
    expect(
      sanitizeBreadcrumb(
        { category: "console", level: "error", data: { logger: "console" } },
        { input: ["Failed to fetch:", `Rejected for ${NAME}`] }
      ).message
    ).toBe(`Failed to fetch: ${FILTERED}`);
    expect(sanitizeBreadcrumb({ category: "console" }, { input: [new Error(NAME), "after"] }).message).toBe(
      `${FILTERED} ${FILTERED}`
    );
  });

  it("keeps only method, status, and sanitized URL for HTTP breadcrumbs", () => {
    const breadcrumb: Breadcrumb = {
      category: "xhr",
      type: "http",
      data: {
        method: "POST",
        url: "https://api.example.test/admin/api/v1/auth/login?email=x",
        status_code: 200,
        request_body_size: 42,
        response_body_size: 512,
      },
    };

    expect(sanitizeBreadcrumb(breadcrumb)).toEqual({
      category: "xhr",
      type: "http",
      data: { method: "POST", url: "https://api.example.test/admin/api/v1/auth/login", status_code: 200 },
    });
  });

  it("sanitizes navigation URLs", () => {
    expect(
      sanitizeBreadcrumb({ category: "navigation", data: { from: "/signin#code=abc", to: `/org?search=${NAME}` } })
    ).toEqual({ category: "navigation", data: { from: "/signin", to: "/org" } });
  });

  it("drops attribute values from UI selectors", () => {
    expect(
      sanitizeBreadcrumb({
        category: "ui.click",
        message: `div.card > button.remove[aria-label="Remove ${NAME}"][title="x"]`,
        data: { nodeId: 7 },
      })
    ).toEqual({ category: "ui.click", message: "div.card > button.remove" });
  });

  it("drops selector attribute values that contain brackets", () => {
    expect(
      sanitizeBreadcrumb({
        category: "ui.click",
        message: `div.card > button.remove[aria-label="Remove [A] ${NAME}"] > span.icon`,
      })
    ).toEqual({ category: "ui.click", message: "div.card > button.remove > span.icon" });
  });

  it("drops data from unknown breadcrumb categories", () => {
    expect(sanitizeBreadcrumb({ category: "custom", message: `for ${EMAIL}`, data: { remark: "x" } })).toEqual({
      category: "custom",
      message: `for ${FILTERED}`,
    });
  });
});

describe("sanitizeLog", () => {
  const consoleLog = (overrides: Partial<Log>): Log => ({
    level: "error",
    message: "",
    attributes: {
      "sentry.origin": "auto.log.console",
      "sentry.environment": "dev",
      "sentry.release": "newlife-portal-frontend@local",
      "user.id": "admin-1",
      "user.email": EMAIL,
      "user.name": NAME,
    },
    ...overrides,
  });

  it.each(["trace", "debug", "info"] as const)("drops %s logs", (level) => {
    expect(sanitizeLog(consoleLog({ level, message: "hello" }))).toBeNull();
  });

  it("uses the console template and drops parameters and personal attributes", () => {
    const log = consoleLog({ message: `Failed to save: {"remark":"x","email":"${EMAIL}"}` });
    log.attributes = {
      ...log.attributes,
      "sentry.message.template": "Failed to save: {}",
      "sentry.message.parameter.0": { remark: "x" },
    };

    expect(sanitizeLog(log)).toEqual({
      level: "error",
      message: "Failed to save: {}",
      attributes: {
        "sentry.origin": "auto.log.console",
        "sentry.environment": "dev",
        "sentry.release": "newlife-portal-frontend@local",
        "sentry.message.template": "Failed to save: {}",
        "user.id": "admin-1",
      },
    });
  });

  it("drops the API client's own failure log: its 5xx is an event and its 4xx is not an issue", () => {
    const log = consoleLog({ message: "API Error: {}" });
    log.attributes = { ...log.attributes, "sentry.message.template": "API Error: {}" };

    expect(sanitizeLog(log)).toBeNull();
  });

  it("drops logs with nothing left to say", () => {
    expect(sanitizeLog(consoleLog({ message: '{"remark":"x"}' }))).toBeNull();
  });

  it("filters error text, keeping the first line of authored messages", () => {
    expect(sanitizeLog(consoleLog({ message: `Error: failed for ${NAME}\n    at Foo (app.js:1:1)` }))?.message).toBe(
      `Error: ${FILTERED}`
    );
    expect(sanitizeLog(consoleLog({ message: `TypeError: no ${NAME}` }))?.message).toBe(`TypeError: ${FILTERED}`);
    expect(sanitizeLog(consoleLog({ message: `Invalid JWT format for ${EMAIL}\nmore` }))?.message).toBe(
      `Invalid JWT format for ${FILTERED}`
    );
  });
});

describe("isApiClientRejection", () => {
  it.each([
    { code: 409, message: "Booking conflict", details: { error_code: "FACILITY_SCHEDULING_CONFLICT" } },
    { code: "UNAUTHORIZED", message: "Unauthorized" },
    { code: "500", message: "Server error" },
  ])("recognizes API client rejections %j", (reason) => {
    expect(isApiClientRejection(reason)).toBe(true);
  });

  it.each([Object.assign(new Error("x"), { code: 500 }), { message: "no code" }, "text", null])(
    "does not treat %j as an API client rejection",
    (reason) => {
      expect(isApiClientRejection(reason)).toBe(false);
    }
  );
});

describe("sanitizeEvent", () => {
  it("drops API client rejections", () => {
    expect(sanitizeEvent({ type: undefined }, { originalException: { code: 500, message: "x" } })).toBeNull();
  });

  it("keeps only the internal user ID, safe request metadata, and code locations", () => {
    const event: ErrorEvent = {
      type: undefined,
      user: { id: "admin-1", email: EMAIL, username: NAME, ip_address: "{{auto}}" },
      request: {
        url: `https://portal.example.test/org/members?search=${NAME}#id_token=abc`,
        headers: { "User-Agent": "jsdom", Referer: `https://portal.example.test/signin?email=${EMAIL}` },
        cookies: { session: "abc" },
        data: { remark: "secret" },
      },
      extra: { __serialized__: { remark: "secret" } },
      logentry: { message: `for ${NAME}`, params: [NAME] },
      tags: { note: EMAIL },
      contexts: { custom: { note: EMAIL } },
      exception: {
        values: [
          {
            type: "SyntaxError",
            value: `Unexpected token in "${NAME}"`,
            mechanism: { type: "generic", handled: true },
            stacktrace: {
              frames: [
                {
                  filename: "https://portal.example.test/assets/app.js?t=1",
                  abs_path: "https://portal.example.test/assets/app.js?t=1",
                  function: "f",
                  lineno: 1,
                  colno: 2,
                  in_app: true,
                  vars: { name: NAME },
                  context_line: NAME,
                },
              ],
            },
          },
        ],
      },
    };

    expect(sanitizeEvent(event, { originalException: new Error(NAME) })).toEqual({
      type: undefined,
      user: { id: "admin-1" },
      request: { url: "https://portal.example.test/org/members", headers: { "User-Agent": "jsdom" } },
      tags: { note: FILTERED },
      contexts: { custom: { note: FILTERED } },
      exception: {
        values: [
          {
            type: "SyntaxError",
            mechanism: { type: "generic", handled: true },
            stacktrace: {
              frames: [
                {
                  filename: "https://portal.example.test/assets/app.js",
                  abs_path: "https://portal.example.test/assets/app.js",
                  function: "f",
                  lineno: 1,
                  colno: 2,
                  in_app: true,
                },
              ],
            },
          },
        ],
      },
    });
  });

  it("keeps the authored summary of an API failure", () => {
    const summary = "API 500 POST /admin/api/v1/facility/bookings";
    const event: ErrorEvent = {
      type: undefined,
      exception: { values: [{ type: "ApiFailureError", value: summary }] },
    };

    expect(
      sanitizeEvent(event, { originalException: new ApiFailureError(summary) })?.exception?.values?.[0].value
    ).toBe(summary);
  });

  it("does not let a foreign error reuse the API failure name to keep its text", () => {
    const event: ErrorEvent = {
      type: undefined,
      exception: { values: [{ type: "ApiFailureError", value: `for ${NAME}` }] },
    };

    expect(sanitizeEvent(event, { originalException: new Error(NAME) })?.exception?.values?.[0]).toEqual({
      type: "ApiFailureError",
    });
  });

  it("drops message text, which may come from a thrown value", () => {
    expect(
      sanitizeEvent(
        { type: undefined, message: NAME, exception: { values: [{ type: "Error", value: NAME }] } },
        { originalException: NAME }
      )
    ).toEqual({ type: undefined, exception: { values: [{ type: "Error" }] } });
  });

  it("removes the user when no internal ID is set", () => {
    expect(sanitizeEvent({ type: undefined, user: { ip_address: "{{auto}}" } }, {})).toEqual({ type: undefined });
  });
});
