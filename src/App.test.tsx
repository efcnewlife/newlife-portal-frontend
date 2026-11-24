import "@testing-library/jest-dom/vitest";
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { AxiosError, type AxiosAdapter, type AxiosInstance } from "axios";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { API_ENDPOINTS } from "@/api/config";
import type { TelemetryConfig } from "@/config/telemetry";

const throwDenied = () => {
  throw new DOMException("The operation is insecure.", "SecurityError");
};

const BLOCKED_STORAGES: Array<[string, PropertyDescriptor]> = [
  ["missing", { configurable: true, value: null }],
  ["denied on access", { configurable: true, get: throwDenied }],
  [
    "denied on every method",
    { configurable: true, value: { getItem: throwDenied, setItem: throwDenied, removeItem: throwDenied } },
  ],
];

const ACCESS_TOKEN = "access-token";
const REFRESH_TOKEN = "refresh-token";
const RENEWED_TOKEN = "renewed-token";
const CREDENTIALS = { email: "admin@example.test", password: "password" };
const BOOT_TIMEOUT = 20_000;

const TELEMETRY: TelemetryConfig = {
  enabled: true,
  dsn: "https://public@o0.ingest.example.test/1",
  environment: "dev",
  release: "newlife-portal-frontend@local",
  tracePropagationTargets: [],
  tracesSampleRate: 1,
  replaysSessionSampleRate: 1,
};

const originals = {
  localStorage: Object.getOwnPropertyDescriptor(globalThis, "localStorage"),
  sessionStorage: Object.getOwnPropertyDescriptor(globalThis, "sessionStorage"),
};

const defineStorages = (local: PropertyDescriptor, session: PropertyDescriptor) => {
  Object.defineProperty(globalThis, "localStorage", local);
  Object.defineProperty(globalThis, "sessionStorage", session);
};

const restoreStorage = (name: keyof typeof originals) => {
  const descriptor = originals[name];
  if (descriptor) Object.defineProperty(globalThis, name, descriptor);
  else Reflect.deleteProperty(globalThis, name);
};

const createStorage = () => {
  const entries = new Map<string, string>();
  const descriptor: PropertyDescriptor = {
    configurable: true,
    value: {
      getItem: (key: string) => entries.get(key) ?? null,
      setItem: (key: string, value: string) => entries.set(key, String(value)),
      removeItem: (key: string) => entries.delete(key),
    },
  };
  return { entries, descriptor };
};

// The router builds a Node Request with a jsdom AbortSignal on every redirect, which Node rejects.
const NodeRequest = globalThis.Request;
class SignallessRequest extends NodeRequest {
  constructor(input: RequestInfo | URL, init?: RequestInit) {
    super(input, { ...init, signal: undefined });
  }
}

/** Signs in with ACCESS_TOKEN and, once it is expired, renews it to RENEWED_TOKEN. */
const connectBackend = (
  httpClient: unknown,
  { isAccessTokenExpired = false } = {}
): { bearers: Array<string | null> } => {
  const bearers: Array<string | null> = [];
  const adapter: AxiosAdapter = async (config) => {
    const reply = (status: number, data: unknown) => {
      const response = { status, data, statusText: "", headers: {}, config };
      if (status >= 400) throw new AxiosError("Rejected", AxiosError.ERR_BAD_REQUEST, config, null, response);
      return response;
    };
    switch (config.url) {
      case API_ENDPOINTS.AUTH.LOGIN:
        return reply(200, {
          admin: { id: "admin-1", email: CREDENTIALS.email, first_name: "Admin" },
          token: { accessToken: ACCESS_TOKEN, refreshToken: REFRESH_TOKEN, tokenType: "bearer", expiresIn: 3600 },
        });
      case API_ENDPOINTS.AUTH.REFRESH:
        return String(config.data).includes(REFRESH_TOKEN)
          ? reply(200, { accessToken: RENEWED_TOKEN })
          : reply(401, { detail: "Unknown refresh token" });
      default: {
        const bearer = config.headers.get("Authorization")?.toString() ?? null;
        bearers.push(bearer);
        return isAccessTokenExpired && bearer !== `Bearer ${RENEWED_TOKEN}`
          ? reply(401, { detail: "Token expired" })
          : reply(200, { items: [] });
      }
    }
  };
  (httpClient as { axiosInstance: AxiosInstance }).axiosInstance.defaults.adapter = adapter;
  return { bearers };
};

const loadAuth = async () => {
  const { httpClient } = await import("@/api/services/httpClient");
  const { authService } = await import("@/api/services/authService");
  return { httpClient, authService };
};

beforeEach(() => {
  vi.resetModules();
  vi.stubGlobal("Request", SignallessRequest);
});

afterEach(() => {
  cleanup();
  restoreStorage("localStorage");
  restoreStorage("sessionStorage");
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
  document.documentElement.classList.remove("dark");
  window.history.replaceState(null, "", "/");
});

describe.each(BLOCKED_STORAGES)("portal with browser storage %s", (_, descriptor) => {
  beforeEach(() => {
    defineStorages(descriptor, descriptor);
  });

  it("loads i18n in the browser default language and still switches language", async () => {
    vi.spyOn(navigator, "language", "get").mockReturnValue("zh-TW");

    const { default: i18n, change_app_language } = await import("@/i18n");

    expect(i18n.language).toBe("zh-TW");
    await expect(change_app_language("zh-CN")).resolves.toBe(true);
    expect(i18n.language).toBe("zh-CN");
  });

  it("loads i18n and then starts telemetry", async () => {
    await import("@/i18n");
    const { initTelemetry } = await import("@/telemetry/initTelemetry");
    const { createCapturedTransport, resetTelemetryForTests } = await import("@/telemetry/testSupport");
    await resetTelemetryForTests();

    expect(initTelemetry(TELEMETRY, { transport: createCapturedTransport().transport })).toBe(true);

    await resetTelemetryForTests();
  });

  it(
    "shows the sign-in page in the light theme",
    async () => {
      vi.spyOn(navigator, "language", "get").mockReturnValue("en");
      const { ThemeProvider } = await import("@/context/ThemeContext");
      const { AppWrapper } = await import("@/components/common/PageMeta");
      const { default: App } = await import("@/App");

      render(
        <ThemeProvider>
          <AppWrapper>
            <App />
          </AppWrapper>
        </ThemeProvider>
      );

      expect(
        await screen.findByRole("button", { name: "Sign in with Microsoft" }, { timeout: BOOT_TIMEOUT / 2 })
      ).toBeVisible();
      expect(window.location.pathname).toBe("/signin");
      expect(document.documentElement).not.toHaveClass("dark");
    },
    BOOT_TIMEOUT
  );

  it.each([false, true])("keeps the sign-in for the life of the tab (remember me: %s)", async (rememberMe) => {
    const { httpClient, authService } = await loadAuth();
    const { bearers } = connectBackend(httpClient);

    await authService.login({ ...CREDENTIALS, rememberMe });
    await httpClient.get(API_ENDPOINTS.LOCALE.LIST);

    expect(authService.isAuthenticated()).toBe(true);
    expect(authService.getRefreshToken()).toBe(rememberMe ? REFRESH_TOKEN : null);
    expect(bearers).toEqual([`Bearer ${ACCESS_TOKEN}`]);

    authService.clearAuth();
    expect(authService.isAuthenticated()).toBe(false);
  });

  it("renews an expired remembered sign-in", async () => {
    const { httpClient, authService } = await loadAuth();
    const { bearers } = connectBackend(httpClient, { isAccessTokenExpired: true });

    await authService.login({ ...CREDENTIALS, rememberMe: true });
    await httpClient.get(API_ENDPOINTS.LOCALE.LIST);

    expect(bearers).toEqual([`Bearer ${ACCESS_TOKEN}`, `Bearer ${RENEWED_TOKEN}`]);
    expect(authService.getToken()).toBe(RENEWED_TOKEN);
  });
});

describe("portal with working browser storage", () => {
  const setup = () => {
    const local = createStorage();
    const session = createStorage();
    defineStorages(local.descriptor, session.descriptor);
    return { local: local.entries, session: session.entries };
  };

  const authKeys = (entries: Map<string, string>) => [...entries.keys()].filter((key) => key !== "app_locale").sort();

  it("keeps a normal sign-in in session storage only", async () => {
    const { local, session } = setup();
    const { httpClient, authService } = await loadAuth();
    connectBackend(httpClient);

    await authService.login({ ...CREDENTIALS, rememberMe: false });

    expect(authKeys(session)).toEqual(["auth_token", "user_data"]);
    expect(authKeys(local)).toEqual([]);
  });

  it("keeps a remembered sign-in in local storage only", async () => {
    const { local, session } = setup();
    const { httpClient, authService } = await loadAuth();
    connectBackend(httpClient);
    await authService.login({ ...CREDENTIALS, rememberMe: false });

    await authService.login({ ...CREDENTIALS, rememberMe: true });

    expect(authKeys(local)).toEqual([
      "auth_token",
      "refresh_token",
      "refresh_token_expiry",
      "remember_me",
      "user_data",
    ]);
    expect(authKeys(session)).toEqual([]);
  });

  it("restores the saved language on reload", async () => {
    setup();
    vi.spyOn(navigator, "language", "get").mockReturnValue("en");
    const first = await import("@/i18n");
    await first.change_app_language("zh-CN");

    vi.resetModules();
    const { default: reloaded } = await import("@/i18n");

    expect(reloaded.language).toBe("zh-CN");
  });

  it("restores the saved theme on reload", async () => {
    setup();
    const renderTheme = async () => {
      const { ThemeProvider, useTheme } = await import("@/context/ThemeContext");
      const Toggle = () => <button onClick={useTheme().toggleTheme}>Toggle theme</button>;
      render(
        <ThemeProvider>
          <Toggle />
        </ThemeProvider>
      );
    };
    await renderTheme();
    await userEvent.click(screen.getByRole("button", { name: "Toggle theme" }));
    cleanup();
    document.documentElement.classList.remove("dark");
    vi.resetModules();

    await renderTheme();

    expect(document.documentElement).toHaveClass("dark");
  });
});
