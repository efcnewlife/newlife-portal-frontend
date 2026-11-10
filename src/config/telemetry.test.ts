import { describe, expect, it } from "vitest";
import { TELEMETRY_CONFIG } from "./env";
import { resolveTelemetryConfig, type TelemetryConfigInput } from "./telemetry";

const DSN = "https://public@example.ingest.sentry.io/1";

const input = (overrides: Partial<TelemetryConfigInput>): TelemetryConfigInput => ({
  mode: "production",
  dsn: DSN,
  enabled: undefined,
  releaseVersion: "0.2.33",
  apiBaseUrl: "https://core.example.test",
  tracesSampleRate: undefined,
  replaysSessionSampleRate: undefined,
  replaysOnErrorSampleRate: undefined,
  ...overrides,
});

const ADMIN_API_TARGET = /^https:\/\/core\.example\.test\/admin\/api\/v1(?:[/?#]|$)/;

describe("resolveTelemetryConfig", () => {
  it.each([
    ["development", "dev", "true", "", "newlife-portal-frontend@local"],
    ["staging", "stg", undefined, "5ba2c79", "newlife-portal-frontend@5ba2c79"],
    ["production", "prod", undefined, "0.2.33", "newlife-portal-frontend@0.2.33"],
  ])("maps %s mode to %s with release %s", (mode, environment, enabled, releaseVersion, release) => {
    expect(resolveTelemetryConfig(input({ mode, enabled, releaseVersion }))).toEqual({
      enabled: true,
      dsn: DSN,
      environment,
      release,
      tracePropagationTargets: [ADMIN_API_TARGET],
    });
  });

  it("uses the local release in development even when a version is supplied", () => {
    const config = resolveTelemetryConfig(input({ mode: "development", enabled: "true", releaseVersion: "0.2.33" }));
    expect(config).toMatchObject({ enabled: true, release: "newlife-portal-frontend@local" });
  });

  it.each(["test", "preview", "prod", ""])("never exports from unknown mode %j", (mode) => {
    expect(resolveTelemetryConfig(input({ mode, enabled: "true" }))).toEqual({
      enabled: false,
      reason: "unknown_mode",
    });
  });

  it.each([undefined, "", "false", "1"])("keeps development export off unless opted in (%j)", (enabled) => {
    expect(resolveTelemetryConfig(input({ mode: "development", enabled }))).toEqual({
      enabled: false,
      reason: "disabled",
    });
  });

  it.each([
    ["staging", "false"],
    ["production", "false"],
    ["production", "0"],
    ["production", "False"],
  ])("switches %s export off for %j", (mode, enabled) => {
    expect(resolveTelemetryConfig(input({ mode, enabled, releaseVersion: "5ba2c79" }))).toEqual({
      enabled: false,
      reason: "disabled",
    });
  });

  it.each([undefined, "", "true"])("exports from production when enabled is %j", (enabled) => {
    expect(resolveTelemetryConfig(input({ enabled }))).toMatchObject({ enabled: true });
  });

  it("keeps the Vitest build's own telemetry config off", () => {
    expect(TELEMETRY_CONFIG).toEqual({ enabled: false, reason: "unknown_mode" });
  });

  it.each(["", "   "])("stays off without a DSN (%j)", (dsn) => {
    expect(resolveTelemetryConfig(input({ dsn }))).toEqual({ enabled: false, reason: "missing_dsn" });
  });

  it.each([
    ["staging", ""],
    ["staging", "local"],
    ["staging", "0.2.33"],
    ["staging", "5BA2C79"],
    ["production", ""],
    ["production", "local"],
    ["production", "1.0"],
    ["production", "5ba2c79"],
  ])("refuses a placeholder or mismatched %s release %j", (mode, releaseVersion) => {
    expect(resolveTelemetryConfig(input({ mode, releaseVersion }))).toEqual({
      enabled: false,
      reason: "invalid_release",
    });
  });

  it("trims configured values", () => {
    expect(resolveTelemetryConfig(input({ dsn: ` ${DSN} `, releaseVersion: " 0.2.33 " }))).toMatchObject({
      dsn: DSN,
      release: "newlife-portal-frontend@0.2.33",
    });
  });

  it("leaves tracing and Replay off unless their sample rates are configured", () => {
    const config = resolveTelemetryConfig(input({}));
    expect(config).not.toHaveProperty("tracesSampleRate");
    expect(config).not.toHaveProperty("replaysSessionSampleRate");
    expect(config).not.toHaveProperty("replaysOnErrorSampleRate");
  });

  it("passes configured sample rates through without a default policy", () => {
    expect(
      resolveTelemetryConfig(
        input({ tracesSampleRate: "0.25", replaysSessionSampleRate: " 0 ", replaysOnErrorSampleRate: "1" })
      )
    ).toMatchObject({ tracesSampleRate: 0.25, replaysSessionSampleRate: 0, replaysOnErrorSampleRate: 1 });
  });

  it.each(["", " ", "abc", "-0.1", "1.5", "NaN", "Infinity", "0x1"])(
    "turns a channel off for an unusable sample rate %j",
    (rate) => {
      const config = resolveTelemetryConfig(
        input({ tracesSampleRate: rate, replaysSessionSampleRate: rate, replaysOnErrorSampleRate: rate })
      );
      expect(config).toMatchObject({ enabled: true });
      expect(config).not.toHaveProperty("tracesSampleRate");
      expect(config).not.toHaveProperty("replaysSessionSampleRate");
      expect(config).not.toHaveProperty("replaysOnErrorSampleRate");
    }
  );
});

describe("trace propagation targets", () => {
  const targetsFor = (apiBaseUrl: string) => {
    const config = resolveTelemetryConfig(input({ apiBaseUrl }));
    return config.enabled ? config.tracePropagationTargets : [];
  };
  const propagates = (apiBaseUrl: string, url: string) => targetsFor(apiBaseUrl).some((target) => target.test(url));

  it.each([
    "https://core.example.test/admin/api/v1",
    "https://core.example.test/admin/api/v1/auth/me",
    "https://core.example.test/admin/api/v1/facility/bookings?page=1",
  ])("propagates to the Admin API at %s", (url) => {
    expect(propagates("https://core.example.test", url)).toBe(true);
  });

  it.each([
    "https://login.microsoftonline.com/tenant/oauth2/v2.0/token",
    "https://core.example.test/api/v1/org",
    "https://core.example.test/healthz",
    "https://core.example.test/admin/api/v10/auth/me",
    "https://core.example.test/admin/api/v1-legacy",
    "https://core.example.test.evil.test/admin/api/v1/auth/me",
    "http://core.example.test/admin/api/v1/auth/me",
    "https://evil.test/?next=https://core.example.test/admin/api/v1/auth/me",
    "/admin/api/v1/auth/me",
  ])("does not propagate to %s", (url) => {
    expect(propagates("https://core.example.test", url)).toBe(false);
  });

  it("keeps a path prefix and port in the configured API base URL", () => {
    expect(propagates("http://127.0.0.1:8000/", "http://127.0.0.1:8000/admin/api/v1/auth/me")).toBe(true);
    expect(propagates("https://example.test/core", "https://example.test/core/admin/api/v1/role/list")).toBe(true);
    expect(propagates("https://example.test/core", "https://example.test/admin/api/v1/role/list")).toBe(false);
  });

  it.each(["", "not a url", "/relative"])("propagates nowhere for an unusable API base URL %j", (apiBaseUrl) => {
    expect(targetsFor(apiBaseUrl)).toEqual([]);
  });
});
