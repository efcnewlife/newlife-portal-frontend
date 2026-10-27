import "@testing-library/jest-dom/vitest";
import * as Sentry from "@sentry/react";
import { cleanup, render, screen } from "@testing-library/react";
import { StrictMode, useEffect } from "react";
import { afterEach, describe, expect, it } from "vitest";
import type { TelemetryConfig } from "@/config/telemetry";
import { initTelemetry } from "./initTelemetry";

type Transport = ReturnType<NonNullable<Sentry.BrowserOptions["transport"]>>;
type Envelope = Parameters<Transport["send"]>[0];

const ENABLED_CONFIG: TelemetryConfig = {
  enabled: true,
  dsn: "https://public@example.ingest.sentry.io/1",
  environment: "stg",
  release: "newlife-portal-frontend@5ba2c79",
};

const SYNTHETIC_MESSAGE = "telemetry synthetic probe";

// Test-only transport: records outbound envelopes and never reaches Sentry ingestion.
const captureTransport = (sent: Envelope[], { fail = false } = {}) => {
  return (): Transport => ({
    send: async (envelope) => {
      sent.push(envelope);
      if (fail) throw new Error("ingestion unavailable");
      return {};
    },
    flush: async () => true,
  });
};

const sentItems = (sent: Envelope[]) =>
  sent.flatMap(([, items]) => items.map(([header, payload]) => ({ type: header.type, payload })));

const sentEvents = (sent: Envelope[]) =>
  sentItems(sent)
    .filter((item) => item.type === "event")
    .map((item) => item.payload as Sentry.Event);

afterEach(async () => {
  cleanup();
  await Sentry.close();
  Sentry.getCurrentScope().setClient(undefined);
});

describe("initTelemetry", () => {
  it("sends a synthetic event tagged with canonical environment and release", async () => {
    const sent: Envelope[] = [];

    expect(initTelemetry(ENABLED_CONFIG, { transport: captureTransport(sent) })).toBe(true);
    Sentry.captureMessage(SYNTHETIC_MESSAGE);
    await Sentry.flush(2000);

    const events = sentEvents(sent);
    expect(events).toHaveLength(1);
    expect(events[0]).toMatchObject({
      message: SYNTHETIC_MESSAGE,
      environment: "stg",
      release: "newlife-portal-frontend@5ba2c79",
    });
  });

  it("does not export automatic context before the privacy contract exists", async () => {
    const sent: Envelope[] = [];

    initTelemetry(ENABLED_CONFIG, { transport: captureTransport(sent) });
    console.warn("console breadcrumb marker");
    Sentry.captureMessage(SYNTHETIC_MESSAGE);
    await Sentry.flush(2000);

    expect(sentItems(sent).map((item) => item.type)).toEqual(["event"]);
    const [event] = sentEvents(sent);
    expect(event.breadcrumbs ?? []).toEqual([]);
    expect(event.request).toBeUndefined();
    expect(event.user).toBeUndefined();
    expect(Sentry.getClient()?.getOptions()).toMatchObject({ integrations: [], sendClientReports: false });
  });

  it("initializes one client under StrictMode and repeated startup", async () => {
    const sent: Envelope[] = [];
    const transport = captureTransport(sent);

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
    expect(sentEvents(sent)).toHaveLength(1);
  });

  it.each<TelemetryConfig>([
    { enabled: false, reason: "disabled" },
    { enabled: false, reason: "missing_dsn" },
    { enabled: false, reason: "unknown_mode" },
  ])("leaves the SDK uninitialized when configuration is $reason", async (config) => {
    const sent: Envelope[] = [];

    expect(initTelemetry(config, { transport: captureTransport(sent) })).toBe(false);
    Sentry.captureMessage(SYNTHETIC_MESSAGE);
    await Sentry.flush(2000);

    expect(Sentry.isInitialized()).toBe(false);
    expect(sent).toEqual([]);
  });

  it("keeps the application running when ingestion rejects events", async () => {
    const sent: Envelope[] = [];

    initTelemetry(ENABLED_CONFIG, { transport: captureTransport(sent, { fail: true }) });
    expect(() => Sentry.captureMessage(SYNTHETIC_MESSAGE)).not.toThrow();
    await expect(Sentry.flush(2000)).resolves.toBeDefined();
    render(<p>admin portal</p>);

    expect(sentEvents(sent)).toHaveLength(1);
    expect(screen.getByText("admin portal")).toBeInTheDocument();
  });

  it("does not throw on a malformed DSN", () => {
    expect(() => initTelemetry({ ...ENABLED_CONFIG, dsn: "not-a-dsn" })).not.toThrow();
  });
});
