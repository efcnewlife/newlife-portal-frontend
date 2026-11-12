import "@testing-library/jest-dom/vitest";
import * as Sentry from "@sentry/react";
import { cleanup, render, screen } from "@testing-library/react";
import { StrictMode, useEffect } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { TelemetryConfig } from "@/config/telemetry";
import { initTelemetry } from "./initTelemetry";
import { setTelemetryUser } from "./reporting";
import { createCapturedTransport, resetTelemetryForTests } from "./testSupport";

const ENABLED_CONFIG: TelemetryConfig = {
  enabled: true,
  dsn: "https://public@example.ingest.sentry.io/1",
  environment: "stg",
  release: "newlife-portal-frontend@5ba2c79",
  tracePropagationTargets: [],
};

const SYNTHETIC_MESSAGE = "telemetry synthetic probe";

const ADMIN_API = "https://core.example.test/admin/api/v1";
const TRACING_CONFIG: TelemetryConfig = {
  ...ENABLED_CONFIG,
  tracePropagationTargets: [/^https:\/\/core\.example\.test\/admin\/api\/v1(?:[/?#]|$)/],
  tracesSampleRate: 1,
};
const REPLAY_CONFIG: TelemetryConfig = { ...ENABLED_CONFIG, replaysSessionSampleRate: 1 };

// Registered before the SDK wraps XHR, so it sees the headers the SDK adds.
const setRequestHeader = vi.spyOn(XMLHttpRequest.prototype, "setRequestHeader");

const headersSentTo = (url: string) => {
  const xhr = new XMLHttpRequest();
  xhr.open("GET", url);
  xhr.send();
  xhr.abort();
  return setRequestHeader.mock.calls
    .filter((_, index) => setRequestHeader.mock.contexts[index] === xhr)
    .map(([name]) => name.toLowerCase());
};

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

  it("traces navigation and requests only when a traces sample rate is configured", () => {
    initTelemetry(TRACING_CONFIG, { transport: createCapturedTransport().transport });

    const client = Sentry.getClient();
    expect(client?.getIntegrationByName("BrowserTracing")).toBeDefined();
    expect(client?.getIntegrationByName("Replay")).toBeUndefined();
    expect(client?.getOptions()).toMatchObject({
      tracesSampleRate: 1,
      tracePropagationTargets: TRACING_CONFIG.enabled ? TRACING_CONFIG.tracePropagationTargets : [],
      propagateTraceparent: false,
    });
  });

  it("sends Sentry trace headers to the Admin API only", () => {
    initTelemetry(TRACING_CONFIG, { transport: createCapturedTransport().transport });

    expect(headersSentTo(`${ADMIN_API}/auth/me`)).toEqual(expect.arrayContaining(["sentry-trace", "baggage"]));
    expect(headersSentTo(`${ADMIN_API}/auth/me`)).not.toContain("traceparent");
    for (const url of [
      "https://login.microsoftonline.com/tenant/oauth2/v2.0/token",
      "https://core.example.test/api/v1/org",
      "https://files.example.test/upload",
    ]) {
      expect(headersSentTo(url)).toEqual([]);
    }
  });

  it("records masked Replay only when a Replay sample rate is configured", () => {
    initTelemetry(REPLAY_CONFIG, { transport: createCapturedTransport().transport });

    const client = Sentry.getClient();
    expect(client?.getIntegrationByName("Replay")).toBeDefined();
    expect(client?.getIntegrationByName("BrowserTracing")).toBeUndefined();
    expect(client?.getOptions()).toMatchObject({ replaysSessionSampleRate: 1, replaysOnErrorSampleRate: 0 });
  });

  // The SDK does not record Replay under Node, so Replay rotation is verified in a real browser (see README).
  it("starts a new trace when the Administrator logs out or changes", () => {
    initTelemetry(TRACING_CONFIG, { transport: createCapturedTransport().transport });
    const traceId = () => Sentry.getCurrentScope().getPropagationContext().traceId;

    setTelemetryUser("admin-a");
    const firstTrace = traceId();
    setTelemetryUser("admin-a");
    expect(traceId()).toBe(firstTrace);

    setTelemetryUser(null);
    const loggedOutTrace = traceId();
    expect(loggedOutTrace).not.toBe(firstTrace);
    expect(loggedOutTrace).toMatch(/^[0-9a-f]{32}$/);

    setTelemetryUser("admin-b");
    expect(traceId()).toBe(loggedOutTrace);
    setTelemetryUser("admin-c");
    expect(traceId()).not.toBe(loggedOutTrace);
  });

  it("keeps logout working when the SDK fails while separating Administrator activity", () => {
    initTelemetry(TRACING_CONFIG, { transport: createCapturedTransport().transport });
    setTelemetryUser("admin-a");
    const scope = Sentry.getCurrentScope();
    const setPropagationContext = vi.spyOn(scope, "setPropagationContext").mockImplementation(() => {
      throw new Error("SDK fault");
    });
    const warn = vi.spyOn(console, "warn").mockImplementation(() => undefined);

    expect(() => setTelemetryUser(null)).not.toThrow();
    expect(warn).toHaveBeenCalledWith("Telemetry could not separate Administrator activity");
    expect(Sentry.getIsolationScope().getUser()).toEqual({});

    setPropagationContext.mockRestore();
    warn.mockRestore();
  });

  it("keeps the application running with tracing and Replay when ingestion is unavailable", async () => {
    const captured = createCapturedTransport({ unavailable: true });

    initTelemetry({ ...TRACING_CONFIG, replaysSessionSampleRate: 1 }, { transport: captured.transport });
    expect(() => headersSentTo(`${ADMIN_API}/auth/me`)).not.toThrow();
    expect(() => setTelemetryUser(null)).not.toThrow();
    render(<p>admin portal</p>);
    await expect(Sentry.flush(2000)).resolves.toBeDefined();

    expect(screen.getByText("admin portal")).toBeInTheDocument();
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
