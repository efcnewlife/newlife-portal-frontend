import "@testing-library/jest-dom/vitest";
import * as Sentry from "@sentry/react";
import { act, cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { AxiosError, type AxiosAdapter, type AxiosInstance, type InternalAxiosRequestConfig } from "axios";
import { StrictMode, type ReactNode } from "react";
import { createRoot } from "react-dom/client";
import { createMemoryRouter, RouterProvider } from "react-router";
import { afterEach, beforeEach, describe, expect, it, vi, type MockInstance } from "vitest";

vi.hoisted(() => {
  const store = new Map<string, string>();
  Object.defineProperty(globalThis, "localStorage", {
    configurable: true,
    value: {
      getItem: (key: string) => store.get(key) ?? null,
      setItem: (key: string, value: string) => {
        store.set(key, String(value));
      },
      removeItem: (key: string) => {
        store.delete(key);
      },
      clear: () => store.clear(),
    },
  });
});

import { API_ENDPOINTS } from "@/api/config";
import { authService } from "@/api/services/authService";
import { facilityService } from "@/api/services/facilityService";
import { httpClient } from "@/api/services/httpClient";
import type { TelemetryConfig } from "@/config/telemetry";
import { AuthProvider, useAuth } from "@/context/AuthContext";
import i18n, { change_app_language } from "@/i18n";
import { notificationManager } from "@/utils/notificationManager";
import { notifyApiError } from "@/utils/operationFeedback";
import { initTelemetry } from "./initTelemetry";
import { reportApiFailure, telemetryRootOptions } from "./reporting";
import { createCapturedTransport, resetTelemetryForTests } from "./testSupport";

const LOCAL_OPT_IN: TelemetryConfig = {
  enabled: true,
  dsn: "https://public@o0.ingest.example.test/1",
  environment: "dev",
  release: "newlife-portal-frontend@local",
};

const ADMIN_A_ID = "admin-a-7f3e";
const ADMIN_B_ID = "admin-b-91c2";
const EMAIL_A = "pii-marker-a@example.test";
const EMAIL_B = "pii-marker-b@example.test";
const NAME_MARKER = "Zebulonmarker";
const PHONE_MARKER = "416-555-0199";
const REMARK_MARKER = "remark-marker-q9";
const PASSWORD_MARKER = "password-marker-p7";
const ACCESS_TOKEN = "eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJ0b2tlbi1tYXJrZXIifQ.c2lnbmF0dXJlLW1hcmtlcg";
const REFRESH_TOKEN = "refresh-marker-r4";
const VIEWED_MEMBER_ID = "viewed-member-5d1a";
const EXPIRED_TOKEN = "expired-access-token";
const PRIVATE_MARKERS = [
  EMAIL_A,
  EMAIL_B,
  NAME_MARKER,
  PHONE_MARKER,
  REMARK_MARKER,
  PASSWORD_MARKER,
  ACCESS_TOKEN,
  REFRESH_TOKEN,
];

const ADMINS: Record<string, { id: string; email: string; first_name: string }> = {
  [EMAIL_A]: { id: ADMIN_A_ID, email: EMAIL_A, first_name: NAME_MARKER },
  [EMAIL_B]: { id: ADMIN_B_ID, email: EMAIL_B, first_name: "Other" },
};

const BOOKING_URL = API_ENDPOINTS.FACILITY.BOOKINGS.CREATE;
const BOOKING_PAYLOAD = {
  title: `Choir practice for ${NAME_MARKER}`,
  remark: `${REMARK_MARKER} call ${PHONE_MARKER}`,
} as unknown as Parameters<typeof facilityService.createBooking>[0];
const SAVE_FAILED = "Save failed";
const TRY_AGAIN = "Try again";

type FakeResponse = { status: number; data: unknown } | { networkError: string };

let bookingResponse: FakeResponse;
let refreshResponse: FakeResponse;
let bookingAttempts: number;

const backend = (config: InternalAxiosRequestConfig): FakeResponse => {
  const body = typeof config.data === "string" ? (JSON.parse(config.data) as Record<string, unknown>) : {};
  switch (`${config.method?.toUpperCase()} ${config.url}`) {
    case `POST ${API_ENDPOINTS.AUTH.LOGIN}`:
      return {
        status: 200,
        data: {
          admin: ADMINS[String(body.email)],
          token: { accessToken: ACCESS_TOKEN, refreshToken: REFRESH_TOKEN, tokenType: "bearer", expiresIn: 3600 },
        },
      };
    case `POST ${API_ENDPOINTS.AUTH.LOGOUT}`:
      return { status: 200, data: {} };
    case `POST ${API_ENDPOINTS.AUTH.REFRESH}`:
      return refreshResponse;
    case `GET ${API_ENDPOINTS.AUTH.PROFILE}`:
      return { status: 401, data: { detail: "Session expired" } };
    case `GET ${API_ENDPOINTS.LOCALE.LIST}`:
      return { status: 200, data: { items: [] } };
    case `POST ${BOOKING_URL}`:
      if (config.headers.get("Authorization") === `Bearer ${EXPIRED_TOKEN}`) {
        return { status: 401, data: { detail: "Token expired" } };
      }
      bookingAttempts += 1;
      return bookingResponse;
    default:
      return { status: 404, data: { detail: "Not found" } };
  }
};

const fakeAdapter: AxiosAdapter = async (config) => {
  const result = backend(config);
  if ("networkError" in result) {
    throw new AxiosError("Network failure", result.networkError, config, null);
  }
  const response = { status: result.status, data: result.data, statusText: "", headers: {}, config };
  if (result.status >= 400) {
    const code = result.status >= 500 ? AxiosError.ERR_BAD_RESPONSE : AxiosError.ERR_BAD_REQUEST;
    throw new AxiosError(`Request failed with status code ${result.status}`, code, config, null, response);
  }
  return response;
};

const Harness = () => {
  const { isLoading, user, login, logout } = useAuth();

  const save = async () => {
    try {
      await facilityService.createBooking(BOOKING_PAYLOAD);
    } catch (error) {
      notifyApiError(error, { title: SAVE_FAILED, fallbackDescription: TRY_AGAIN });
    }
  };

  return (
    <>
      <span data-testid="admin">{isLoading ? "loading" : (user?.id ?? "signed-out")}</span>
      <button type="button" onClick={() => void login({ email: EMAIL_A, password: PASSWORD_MARKER })}>
        Sign in as A
      </button>
      <button type="button" onClick={() => void login({ email: EMAIL_B, password: PASSWORD_MARKER })}>
        Sign in as B
      </button>
      <button type="button" onClick={() => void logout()}>
        Sign out
      </button>
      <button type="button" onClick={() => void save()}>
        Save
      </button>
      <button type="button" title={`Remove ${NAME_MARKER}`} aria-label={`Remove ${NAME_MARKER}`}>
        Remove member
      </button>
    </>
  );
};

const renderPortal = () =>
  render(
    <AuthProvider>
      <Harness />
    </AuthProvider>
  );

const expectAdmin = (text: string) => waitFor(() => expect(screen.getByTestId("admin")).toHaveTextContent(text));

const signIn = async (as: "A" | "B", adminId: string) => {
  await userEvent.click(screen.getByRole("button", { name: `Sign in as ${as}` }));
  await expectAdmin(adminId);
};

const signOut = async () => {
  await userEvent.click(screen.getByRole("button", { name: "Sign out" }));
  await expectAdmin("signed-out");
};

const seedExpiredRememberedSession = () => {
  localStorage.setItem("remember_me", "true");
  localStorage.setItem("auth_token", EXPIRED_TOKEN);
  localStorage.setItem("refresh_token", REFRESH_TOKEN);
  localStorage.setItem("refresh_token_expiry", String(Date.now() + 60_000));
};

// Invoke the global handlers the browser calls; jsdom forwards dispatched error events to Vitest as crashes.
const raiseWindowError = (error: Error) => {
  globalThis.onerror?.(error.message, "http://localhost:5173/src/main.tsx", 1, 1, error);
};

const raiseUnhandledRejection = (reason: unknown) => {
  const event = Object.assign(new Event("unhandledrejection"), { reason }) as PromiseRejectionEvent;
  globalThis.onunhandledrejection?.call(window, event);
};

// The real root options under test; Testing Library's render types reject them.
const renderAtRoot = async (ui: ReactNode) => {
  const root = createRoot(document.body.appendChild(document.createElement("div")), telemetryRootOptions);
  await act(async () => root.render(ui));
};

const exceptionOf = (event: Record<string, unknown>) =>
  (event.exception as { values: Array<{ type: string; value?: string }> }).values.at(-1);

const expectNoPrivateData = (payload: unknown) => {
  const serialized = JSON.stringify(payload);
  for (const marker of PRIVATE_MARKERS) {
    expect(serialized).not.toContain(marker);
  }
};

describe("Admin Portal error capture", () => {
  let showNotification: MockInstance<typeof notificationManager.show>;

  beforeEach(async () => {
    await resetTelemetryForTests();
    sessionStorage.clear();
    localStorage.clear();
    showNotification = vi.spyOn(notificationManager, "show").mockImplementation(() => "toast");
    bookingAttempts = 0;
    bookingResponse = { status: 201, data: { id: "booking-1" } };
    refreshResponse = { status: 200, data: { accessToken: "fresh-access-token", refreshToken: REFRESH_TOKEN } };
    (httpClient as unknown as { axiosInstance: AxiosInstance }).axiosInstance.defaults.adapter = fakeAdapter;
    window.history.replaceState(null, "", `/org/members?search=${NAME_MARKER}#id_token=${ACCESS_TOKEN}`);
    await change_app_language("en");
  });

  afterEach(async () => {
    cleanup();
    await resetTelemetryForTests();
    vi.restoreAllMocks();
    window.history.replaceState(null, "", "/");
  });

  it("reports an unexpected API failure once, as the signed-in Administrator, without private data", async () => {
    const captured = createCapturedTransport();
    initTelemetry(LOCAL_OPT_IN, { transport: captured.transport });
    bookingResponse = {
      status: 500,
      data: { detail: `Failed for ${EMAIL_A} (${NAME_MARKER})`, debug_detail: { remark: REMARK_MARKER } },
    };

    renderPortal();
    await expectAdmin("signed-out");
    await signIn("A", ADMIN_A_ID);
    await userEvent.click(screen.getByRole("button", { name: "Save" }));
    await waitFor(() => expect(showNotification).toHaveBeenCalled(), { timeout: 10_000 });
    await Sentry.flush();

    expect(bookingAttempts).toBeGreaterThan(1);
    const events = captured.events();
    expect(events).toHaveLength(1);
    expect(exceptionOf(events[0])).toMatchObject({ type: "ApiFailureError", value: `API 500 POST ${BOOKING_URL}` });
    expect(events[0]).toMatchObject({
      environment: "dev",
      release: "newlife-portal-frontend@local",
      user: { id: ADMIN_A_ID },
      request: { url: "http://localhost:3000/org/members" },
      fingerprint: ["api-failure", "POST", BOOKING_URL, "500"],
      tags: { "api.method": "POST", "api.route": BOOKING_URL, "api.status": 500 },
    });
    expect(Object.keys(events[0].user as object)).toEqual(["id"]);
    expect(showNotification).toHaveBeenCalledTimes(1);
    expect(showNotification).toHaveBeenCalledWith(
      expect.objectContaining({ variant: "error", title: SAVE_FAILED, description: TRY_AGAIN })
    );
    expect(captured.logs()).toEqual([]);
    expectNoPrivateData(captured.items);
  }, 15_000);

  it("keeps permission, validation, and Booking rejections out of issues with unchanged feedback", async () => {
    const captured = createCapturedTransport();
    initTelemetry(LOCAL_OPT_IN, { transport: captured.transport });

    renderPortal();
    await signIn("A", ADMIN_A_ID);
    for (const status of [403, 404, 409, 422]) {
      showNotification.mockClear();
      bookingResponse = { status, data: { detail: `Rejected for ${NAME_MARKER}` } };
      await userEvent.click(screen.getByRole("button", { name: "Save" }));
      await waitFor(() => expect(showNotification).toHaveBeenCalledTimes(1));
      expect(showNotification).toHaveBeenCalledWith(
        expect.objectContaining({ variant: "error", title: SAVE_FAILED, description: TRY_AGAIN })
      );
    }
    raiseUnhandledRejection({ code: 409, message: "Already booked", details: { remark: REMARK_MARKER } });
    raiseUnhandledRejection({ code: "UNAUTHORIZED", message: "Unauthorized" });
    raiseUnhandledRejection({ code: 500, message: "Already reported", details: { remark: REMARK_MARKER } });
    await Sentry.flush();

    expect(captured.items).toEqual([]);
  });

  it("treats timeouts and offline errors as transport feedback, not issues", async () => {
    const captured = createCapturedTransport();
    initTelemetry(LOCAL_OPT_IN, { transport: captured.transport });

    for (const networkError of ["ECONNABORTED", AxiosError.ERR_NETWORK, AxiosError.ERR_CANCELED]) {
      showNotification.mockClear();
      bookingResponse = { networkError };
      await expect(facilityService.createBooking(BOOKING_PAYLOAD)).rejects.toMatchObject({ transportNotified: true });
      expect(showNotification).toHaveBeenCalledTimes(1);
    }
    await Sentry.flush();

    expect(captured.events()).toEqual([]);
  }, 15_000);

  it("reports a fault in the API client's own code without its message", async () => {
    const captured = createCapturedTransport();
    initTelemetry(LOCAL_OPT_IN, { transport: captured.transport });
    const unreadablePayload = {
      get title(): string {
        throw new TypeError(`Unreadable for ${NAME_MARKER}`);
      },
    } as unknown as typeof BOOKING_PAYLOAD;

    await expect(facilityService.createBooking(unreadablePayload)).rejects.toMatchObject({ code: 0 });
    await Sentry.flush();

    expect(captured.events().map((event) => exceptionOf(event))).toEqual([
      expect.objectContaining({ type: "TypeError" }),
    ]);
    expect(exceptionOf(captured.events()[0])).not.toHaveProperty("value");
    expectNoPrivateData(captured.items);
  });

  it("reports a fault inside the auth service, which callers receive as a plain rejection", async () => {
    const captured = createCapturedTransport();
    initTelemetry(LOCAL_OPT_IN, { transport: captured.transport });

    await expect(authService.login({ email: "unknown@example.test", password: PASSWORD_MARKER })).rejects.toMatchObject(
      { code: "UNKNOWN_ERROR" }
    );
    await Sentry.flush();

    expect(captured.events().map((event) => exceptionOf(event)?.type)).toEqual(["TypeError"]);
    expectNoPrivateData(captured.items);
  });

  it("captures render errors under StrictMode, runtime errors, and rejections once each", async () => {
    const captured = createCapturedTransport();
    initTelemetry(LOCAL_OPT_IN, { transport: captured.transport });
    const Broken = () => {
      throw new Error(`Render failed for ${NAME_MARKER}`);
    };
    const router = createMemoryRouter([{ path: "/", element: <Broken /> }]);

    await renderAtRoot(
      <StrictMode>
        <RouterProvider router={router} />
      </StrictMode>
    );
    expect(await screen.findByText("Unexpected Application Error!")).toBeInTheDocument();
    const runtimeError = new SyntaxError(`Unexpected token 'p', "${EMAIL_A}" is not valid JSON`);
    raiseWindowError(runtimeError);
    raiseWindowError(runtimeError);
    raiseUnhandledRejection(new Error(`Lazy chunk failed for ${NAME_MARKER}`));
    await Sentry.flush();

    const exceptions = captured.events().map((event) => exceptionOf(event));
    expect(exceptions.map((exception) => exception?.type)).toEqual(["Error", "SyntaxError", "Error"]);
    for (const exception of exceptions) {
      expect(exception).not.toHaveProperty("value");
    }
    expectNoPrivateData(captured.items);
  });

  it("reports an uncaught render error once while keeping global reporting", async () => {
    const captured = createCapturedTransport();
    initTelemetry(LOCAL_OPT_IN, { transport: captured.transport });
    const reportGlobalError = vi.fn((error: unknown) => raiseWindowError(error as Error));
    vi.stubGlobal("reportError", reportGlobalError);
    const Broken = () => {
      throw new Error(`Crash for ${NAME_MARKER}`);
    };

    // Outside act: React rethrows uncaught errors into act scopes instead of calling the root hook.
    createRoot(document.body.appendChild(document.createElement("div")), telemetryRootOptions).render(<Broken />);
    await waitFor(() => expect(reportGlobalError).toHaveBeenCalled());
    await Sentry.flush();
    vi.unstubAllGlobals();

    expect(reportGlobalError).toHaveBeenCalledTimes(1);
    expect(captured.events()).toHaveLength(1);
    expectNoPrivateData(captured.items);
  });

  it("does not export values thrown as strings or objects", async () => {
    const captured = createCapturedTransport();
    initTelemetry(LOCAL_OPT_IN, { transport: captured.transport });

    raiseUnhandledRejection(`Rejected for ${NAME_MARKER}`);
    raiseUnhandledRejection({ remark: REMARK_MARKER, phone: PHONE_MARKER });
    Sentry.captureException(`Thrown for ${NAME_MARKER}`);
    await Sentry.flush();

    expect(captured.events()).toHaveLength(3);
    expectNoPrivateData(captured.items);
  });

  it("attributes errors only to the current Administrator and clears identity on logout", async () => {
    const captured = createCapturedTransport();
    initTelemetry(LOCAL_OPT_IN, { transport: captured.transport });

    renderPortal();
    await signIn("A", ADMIN_A_ID);
    window.history.pushState(null, "", `/org/members/${VIEWED_MEMBER_ID}`);
    raiseWindowError(new Error("while signed in as A"));
    await signOut();
    raiseWindowError(new Error("after sign out"));
    await signIn("B", ADMIN_B_ID);
    raiseWindowError(new Error("while signed in as B"));
    await Sentry.flush();

    const events = captured.events();
    expect(events.map((event) => event.user)).toEqual([{ id: ADMIN_A_ID }, undefined, { id: ADMIN_B_ID }]);
    expect(JSON.stringify(events[0].breadcrumbs)).toContain(VIEWED_MEMBER_ID);
    expect(JSON.stringify(events.slice(1))).not.toContain(ADMIN_A_ID);
    expect(JSON.stringify(events.slice(1).map((event) => event.breadcrumbs))).not.toContain(VIEWED_MEMBER_ID);
    expectNoPrivateData(captured.items);
  });

  it("clears identity when the session ends without a logout", async () => {
    const captured = createCapturedTransport();
    initTelemetry(LOCAL_OPT_IN, { transport: captured.transport });

    renderPortal();
    await signIn("A", ADMIN_A_ID);
    await expect(authService.getCurrentUser()).rejects.toMatchObject({ code: "UNAUTHORIZED" });
    raiseWindowError(new Error("after the session ended"));
    await Sentry.flush();

    expect(captured.events().map((event) => event.user)).toEqual([undefined]);
  });

  it("clears identity when a stored session fails to restore", async () => {
    const captured = createCapturedTransport();
    initTelemetry(LOCAL_OPT_IN, { transport: captured.transport });

    renderPortal();
    await signIn("A", ADMIN_A_ID);
    cleanup();
    seedExpiredRememberedSession();
    refreshResponse = { status: 401, data: { detail: "Refresh token expired" } };
    renderPortal();
    await expectAdmin("signed-out");
    raiseWindowError(new Error("after failed restore"));
    await Sentry.flush();

    expect(captured.events().map((event) => event.user)).toEqual([undefined]);
  });

  it("keeps expected rejections out of issues around a token refresh", async () => {
    const captured = createCapturedTransport();
    initTelemetry(LOCAL_OPT_IN, { transport: captured.transport });
    seedExpiredRememberedSession();
    bookingResponse = { status: 409, data: { detail: "Already booked" } };

    await expect(facilityService.createBooking(BOOKING_PAYLOAD)).rejects.toMatchObject({ code: 409 });
    localStorage.setItem("auth_token", EXPIRED_TOKEN);
    refreshResponse = { status: 401, data: { detail: "Refresh token expired" } };
    await expect(facilityService.createBooking(BOOKING_PAYLOAD)).rejects.toMatchObject({ code: 401 });
    await Sentry.flush();

    expect(captured.events()).toEqual([]);
  });

  it("reports a failed token refresh once under the refresh route, for all waiting requests", async () => {
    const captured = createCapturedTransport();
    initTelemetry(LOCAL_OPT_IN, { transport: captured.transport });
    seedExpiredRememberedSession();
    refreshResponse = { status: 500, data: { detail: `Refresh failed for ${EMAIL_A}` } };

    const results = await Promise.allSettled([
      facilityService.createBooking(BOOKING_PAYLOAD),
      facilityService.createBooking(BOOKING_PAYLOAD),
    ]);
    await Sentry.flush();

    expect(results.map((result) => result.status)).toEqual(["rejected", "rejected"]);
    expect(captured.events().map((event) => exceptionOf(event)?.value)).toEqual([
      `API 500 POST ${API_ENDPOINTS.AUTH.REFRESH}`,
    ]);
    expectNoPrivateData(captured.items);
  });

  it("reports a 5xx from the retry after a token refresh once", async () => {
    const captured = createCapturedTransport();
    initTelemetry(LOCAL_OPT_IN, { transport: captured.transport });
    seedExpiredRememberedSession();
    bookingResponse = { status: 503, data: { detail: "Unavailable" } };

    await expect(facilityService.createBooking(BOOKING_PAYLOAD)).rejects.toMatchObject({ code: 503 });
    await Sentry.flush();

    expect(captured.events().map((event) => exceptionOf(event)?.value)).toEqual([`API 503 POST ${BOOKING_URL}`]);
  }, 15_000);

  it("replaces path identifiers in the API route used for grouping", async () => {
    const captured = createCapturedTransport();
    initTelemetry(LOCAL_OPT_IN, { transport: captured.transport });

    reportApiFailure(500, {
      method: "patch",
      url: `/admin/api/v1/user/3fa85f64-5717-4562-b3fc-2c963f66afa6/bind_role?search=${NAME_MARKER}`,
    });
    reportApiFailure(502, { url: `https://api.example.test/admin/api/v1/user/${EMAIL_A}` });
    await Sentry.flush();

    expect(captured.events().map((event) => exceptionOf(event)?.value)).toEqual([
      "API 500 PATCH /admin/api/v1/user/{id}/bind_role",
      "API 502 GET /admin/api/v1/user/{id}",
    ]);
    expectNoPrivateData(captured.items);
  });

  it("sanitizes logs and breadcrumbs drawn from the console, clicks, and navigation", async () => {
    const captured = createCapturedTransport();
    initTelemetry(LOCAL_OPT_IN, { transport: captured.transport });

    renderPortal();
    await expectAdmin("signed-out");
    await userEvent.click(screen.getByRole("button", { name: `Remove ${NAME_MARKER}` }));
    console.log("Sign-in result", { idToken: ACCESS_TOKEN });
    console.info(`Info for ${NAME_MARKER}`);
    console.warn("Failed to refresh user:", { remark: REMARK_MARKER });
    console.warn("Failed to load:", `Rejected for ${NAME_MARKER}`);
    console.error("Invalid JWT format");
    console.error(new Error(`Failed for ${NAME_MARKER}`));
    console.error({ email: EMAIL_A, phone: PHONE_MARKER });
    window.history.pushState(null, "", `/org/members/1?search=${NAME_MARKER}`);
    raiseWindowError(new Error(`First for ${NAME_MARKER}`));
    raiseWindowError(new Error(`Second for ${NAME_MARKER}`));
    await Sentry.flush();

    expect(captured.logs().map((log) => [log.level, log.body])).toEqual([
      ["warn", "Failed to refresh user: {}"],
      ["warn", "Failed to load: {}"],
      ["error", "Invalid JWT format"],
    ]);
    const breadcrumbs = captured.events().at(-1)?.breadcrumbs as Array<{ category: string; message?: string }>;
    expect(breadcrumbs.map((breadcrumb) => breadcrumb.category)).toEqual(
      expect.arrayContaining(["ui.click", "console", "navigation"])
    );
    expect(breadcrumbs.filter((breadcrumb) => breadcrumb.category === "console").length).toBeGreaterThan(0);
    expect(JSON.stringify(breadcrumbs)).not.toContain("Sign-in result");
    expect(JSON.stringify(breadcrumbs)).not.toContain("Info for");
    expectNoPrivateData(captured.items);
  });

  it.each([
    { environment: "stg", release: "newlife-portal-frontend@5ba2c79" },
    { environment: "prod", release: "newlife-portal-frontend@1.2.3" },
  ] as const)("labels $environment browser errors with $release and keeps the DSN", async (labels) => {
    const captured = createCapturedTransport();
    initTelemetry({ ...LOCAL_OPT_IN, ...labels }, { transport: captured.transport });

    raiseWindowError(new Error("deployed failure"));
    await Sentry.flush();

    expect(captured.events()).toEqual([expect.objectContaining(labels)]);
    expect(Sentry.getClient()?.getOptions().dsn).toBe(LOCAL_OPT_IN.enabled && LOCAL_OPT_IN.dsn);
  });

  it("collapses consecutive identical API failures through SDK dedupe", async () => {
    const captured = createCapturedTransport();
    initTelemetry(LOCAL_OPT_IN, { transport: captured.transport });

    for (const status of [500, 500, 503]) {
      reportApiFailure(status, { method: "POST", url: BOOKING_URL });
    }
    await Sentry.flush();

    expect(captured.events().map((event) => exceptionOf(event)?.value)).toEqual([
      `API 500 POST ${BOOKING_URL}`,
      `API 503 POST ${BOOKING_URL}`,
    ]);
  });

  it("keeps login and operations usable when telemetry is not configured", async () => {
    const captured = createCapturedTransport();
    expect(initTelemetry({ enabled: false, reason: "missing_dsn" }, { transport: captured.transport })).toBe(false);

    renderPortal();
    await signIn("A", ADMIN_A_ID);
    await userEvent.click(screen.getByRole("button", { name: "Save" }));
    await waitFor(() => expect(bookingAttempts).toBe(1));
    raiseWindowError(new Error("unconfigured failure"));
    await signOut();
    await Sentry.flush();

    expect(captured.sendAttempts()).toBe(0);
  });

  it("keeps login, feedback, and logout usable when ingestion is unavailable", async () => {
    const captured = createCapturedTransport({ unavailable: true });
    initTelemetry(LOCAL_OPT_IN, { transport: captured.transport });

    renderPortal();
    await signIn("A", ADMIN_A_ID);
    raiseWindowError(new Error("undeliverable failure"));
    bookingResponse = { status: 409, data: { detail: "Already booked" } };
    await userEvent.click(screen.getByRole("button", { name: "Save" }));
    await waitFor(() => expect(showNotification).toHaveBeenCalledWith(expect.objectContaining({ title: SAVE_FAILED })));
    await signOut();
    await Sentry.flush();

    await waitFor(() => expect(captured.sendAttempts()).toBeGreaterThan(0));
    await signIn("B", ADMIN_B_ID);
    expect(i18n.language).toBe("en");
  });
});
