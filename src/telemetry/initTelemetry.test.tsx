import "@testing-library/jest-dom/vitest";
import * as Sentry from "@sentry/react";
import { cleanup, render, screen } from "@testing-library/react";
import { StrictMode, useEffect } from "react";
import { afterEach, describe, expect, it } from "vitest";
import type { TelemetryConfig } from "@/config/telemetry";
import { initTelemetry } from "./initTelemetry";
import { createCapturedTransport, resetTelemetryForTests } from "./testSupport";

const ENABLED_CONFIG: TelemetryConfig = {
  enabled: true,
  dsn: "https://public@example.ingest.sentry.io/1",
  environment: "stg",
  release: "newlife-portal-frontend@5ba2c79",
};

const SYNTHETIC_MESSAGE = "telemetry synthetic probe";

afterEach(async () => {
  cleanup();
  await resetTelemetryForTests();
});

describe("initTelemetry", () => {
  it("sends a synthetic event tagged with canonical environment and release", async () => {
    const captured = createCapturedTransport();

    expect(initTelemetry(ENABLED_CONFIG, { transport: captured.transport })).toBe(true);
    Sentry.captureMessage(SYNTHETIC_MESSAGE);
    await Sentry.flush(2000);

    const events = captured.events();
    expect(events).toHaveLength(1);
    expect(events[0]).toMatchObject({
      environment: "stg",
      release: "newlife-portal-frontend@5ba2c79",
    });
  });

  it("exports no identity by default and leaves tracing, Replay, and sessions off", async () => {
    const captured = createCapturedTransport();

    initTelemetry(ENABLED_CONFIG, { transport: captured.transport });
    Sentry.captureMessage(SYNTHETIC_MESSAGE);
    await Sentry.flush(2000);

    expect(captured.items.map((item) => item.type)).toEqual(["event"]);
    expect(captured.events()[0]).not.toHaveProperty("user");
    const client = Sentry.getClient();
    expect(client?.getOptions()).toMatchObject({ sendClientReports: false });
    expect(client?.getOptions().tracesSampleRate).toBeUndefined();
    for (const integration of ["BrowserTracing", "Replay", "BrowserSession", "CaptureConsole"]) {
      expect(client?.getIntegrationByName(integration)).toBeUndefined();
    }
  });

  it("initializes one client under StrictMode and repeated startup", async () => {
    const captured = createCapturedTransport();
    const { transport } = captured;

    initTelemetry(ENABLED_CONFIG, { transport });
    const firstClient = Sentry.getClient();

    const Probe = () => {
      useEffect(() => {
        initTelemetry(ENABLED_CONFIG, { transport });
      }, []);
      return <p>admin portal</p>;
    };
    render(
      <StrictMode>
        <Probe />
      </StrictMode>
    );

    expect(screen.getByText("admin portal")).toBeInTheDocument();
    expect(Sentry.getClient()).toBe(firstClient);
    Sentry.captureMessage(SYNTHETIC_MESSAGE);
    await Sentry.flush(2000);
    expect(captured.events()).toHaveLength(1);
  });

  it.each<TelemetryConfig>([
    { enabled: false, reason: "disabled" },
    { enabled: false, reason: "missing_dsn" },
    { enabled: false, reason: "unknown_mode" },
  ])("leaves the SDK uninitialized when configuration is $reason", async (config) => {
    const captured = createCapturedTransport();

    expect(initTelemetry(config, { transport: captured.transport })).toBe(false);
    Sentry.captureMessage(SYNTHETIC_MESSAGE);
    await Sentry.flush(2000);

    expect(Sentry.isInitialized()).toBe(false);
    expect(captured.sendAttempts()).toBe(0);
  });

  it("keeps the application running when ingestion rejects events", async () => {
    const captured = createCapturedTransport({ unavailable: true });

    initTelemetry(ENABLED_CONFIG, { transport: captured.transport });
    expect(() => Sentry.captureMessage(SYNTHETIC_MESSAGE)).not.toThrow();
    await expect(Sentry.flush(2000)).resolves.toBeDefined();
    render(<p>admin portal</p>);

    expect(captured.sendAttempts()).toBe(1);
    expect(screen.getByText("admin portal")).toBeInTheDocument();
  });

  it("does not throw on a malformed DSN", () => {
    expect(() => initTelemetry({ ...ENABLED_CONFIG, dsn: "not-a-dsn" })).not.toThrow();
  });
});
