import { describe, expect, it } from "vitest";
import { TELEMETRY_CONFIG } from "./env";
import { resolveTelemetryConfig, type TelemetryConfigInput } from "./telemetry";

const DSN = "https://public@example.ingest.sentry.io/1";

const input = (overrides: Partial<TelemetryConfigInput>): TelemetryConfigInput => ({
  mode: "production",
  dsn: DSN,
  enabled: undefined,
  releaseVersion: "0.2.33",
  ...overrides,
});

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
});
