import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const throwDenied = () => {
  throw new DOMException("The operation is insecure.", "SecurityError");
};

const createStorage = (initial: Record<string, string> = {}) => {
  const entries = new Map(Object.entries(initial));
  return {
    entries,
    getItem: vi.fn((key: string) => entries.get(key) ?? null),
    setItem: vi.fn((key: string, value: string) => {
      entries.set(key, value);
    }),
    removeItem: vi.fn((key: string) => {
      entries.delete(key);
    }),
  };
};

const originals = new Map(
  ["localStorage", "sessionStorage"].map((name) => [name, Object.getOwnPropertyDescriptor(globalThis, name)] as const)
);

const defineStorage = (name: string, descriptor: PropertyDescriptor) =>
  Object.defineProperty(globalThis, name, { configurable: true, ...descriptor });

const BLOCKED_STORAGES: Array<[string, PropertyDescriptor]> = [
  ["is null", { value: null }],
  ["is undefined", { value: undefined }],
  ["throws on access", { get: throwDenied }],
  ["throws on every method", { value: { getItem: throwDenied, setItem: throwDenied, removeItem: throwDenied } }],
];

const loadSafeStorage = async () => (await import("./safeStorage")).safeStorage;

describe("safeStorage", () => {
  beforeEach(() => {
    vi.resetModules();
  });

  afterEach(() => {
    for (const [name, descriptor] of originals) {
      if (descriptor) Object.defineProperty(globalThis, name, descriptor);
      else Reflect.deleteProperty(globalThis, name);
    }
  });

  describe.each(BLOCKED_STORAGES)("when browser storage %s", (_, descriptor) => {
    beforeEach(() => {
      defineStorage("localStorage", descriptor);
      defineStorage("sessionStorage", descriptor);
    });

    it.each(["local", "session"] as const)("keeps %s values in memory", async (kind) => {
      const storage = (await loadSafeStorage())(kind);

      expect(storage.getItem("theme")).toBeNull();
      expect(() => storage.removeItem("theme")).not.toThrow();

      storage.setItem("theme", "dark");
      expect(storage.getItem("theme")).toBe("dark");

      storage.removeItem("theme");
      expect(storage.getItem("theme")).toBeNull();
    });

    it("keeps local and session values apart", async () => {
      const safeStorage = await loadSafeStorage();

      safeStorage("local").setItem("auth_token", "remembered");

      expect(safeStorage("session").getItem("auth_token")).toBeNull();
    });

    it("shares values between callers", async () => {
      const safeStorage = await loadSafeStorage();

      safeStorage("local").setItem("auth_token", "remembered");

      expect(safeStorage("local").getItem("auth_token")).toBe("remembered");
    });
  });

  describe("when browser storage works", () => {
    it.each([
      ["local", "localStorage"],
      ["session", "sessionStorage"],
    ] as const)("reads and writes %s values in the browser", async (kind, name) => {
      const browserStorage = createStorage({ existing: "kept" });
      defineStorage(name, { value: browserStorage });
      const storage = (await loadSafeStorage())(kind);

      expect(storage.getItem("existing")).toBe("kept");
      storage.setItem("theme", "dark");
      expect(browserStorage.entries.get("theme")).toBe("dark");
      storage.removeItem("theme");
      expect(browserStorage.entries.has("theme")).toBe(false);
    });

    it("sees values another tab changed", async () => {
      const browserStorage = createStorage();
      defineStorage("localStorage", { value: browserStorage });
      const storage = (await loadSafeStorage())("local");

      storage.setItem("auth_token", "first");
      browserStorage.entries.set("auth_token", "second");

      expect(storage.getItem("auth_token")).toBe("second");
    });
  });

  describe("when browser storage fails part of the time", () => {
    it("reads the latest value when a write is rejected but reads still work", async () => {
      const browserStorage = createStorage({ auth_token: "stale" });
      browserStorage.setItem.mockImplementation(throwDenied);
      defineStorage("sessionStorage", { value: browserStorage });
      const storage = (await loadSafeStorage())("session");

      storage.setItem("auth_token", "fresh");

      expect(storage.getItem("auth_token")).toBe("fresh");
    });

    it("does not bring back the previous value on reload when a write is rejected", async () => {
      const browserStorage = createStorage({ auth_token: "previous-admin" });
      browserStorage.setItem.mockImplementation(throwDenied);
      defineStorage("localStorage", { value: browserStorage });
      (await loadSafeStorage())("local").setItem("auth_token", "current-admin");

      vi.resetModules();
      const reloaded = (await loadSafeStorage())("local");

      expect(reloaded.getItem("auth_token")).toBeNull();
    });

    it("does not bring back a removed value when the removal is rejected", async () => {
      const browserStorage = createStorage({ auth_token: "signed-out" });
      browserStorage.removeItem.mockImplementation(throwDenied);
      defineStorage("localStorage", { value: browserStorage });
      const storage = (await loadSafeStorage())("local");

      storage.removeItem("auth_token");

      expect(storage.getItem("auth_token")).toBeNull();
    });

    it("uses the browser again once a write succeeds", async () => {
      const browserStorage = createStorage();
      browserStorage.setItem.mockImplementationOnce(throwDenied);
      defineStorage("localStorage", { value: browserStorage });
      const storage = (await loadSafeStorage())("local");

      storage.setItem("theme", "dark");
      storage.setItem("theme", "light");
      browserStorage.entries.set("theme", "dark");

      expect(storage.getItem("theme")).toBe("dark");
    });

    it("survives storage that becomes unavailable after the first read", async () => {
      defineStorage("localStorage", { value: createStorage({ theme: "dark" }) });
      const storage = (await loadSafeStorage())("local");
      expect(storage.getItem("theme")).toBe("dark");

      defineStorage("localStorage", { value: null });

      expect(storage.getItem("theme")).toBeNull();
      storage.setItem("theme", "light");
      expect(storage.getItem("theme")).toBe("light");
    });
  });
});
