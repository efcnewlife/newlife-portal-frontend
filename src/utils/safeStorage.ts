type StorageKind = "local" | "session";
type SafeStorage = Pick<Storage, "getItem" | "setItem" | "removeItem">;

const resolveBrowserStorage = (kind: StorageKind): Storage =>
  kind === "local" ? globalThis.localStorage : globalThis.sessionStorage;

// Blocked storage is either missing or throws, on the accessor or on any method, and can start or stop doing so
// at any time. Every call is therefore guarded on its own.
const createSafeStorage = (kind: StorageKind): SafeStorage => {
  // Only writes the browser rejected; null marks a rejected removal, so a stale browser value stays hidden.
  const rejectedWrites = new Map<string, string | null>();

  const removeItem = (key: string): void => {
    try {
      resolveBrowserStorage(kind).removeItem(key);
      rejectedWrites.delete(key);
    } catch {
      rejectedWrites.set(key, null);
    }
  };

  return {
    getItem: (key) => {
      const rejected = rejectedWrites.get(key);
      if (rejected !== undefined) return rejected;
      try {
        return resolveBrowserStorage(kind).getItem(key);
      } catch {
        return null;
      }
    },
    setItem: (key, value) => {
      try {
        resolveBrowserStorage(kind).setItem(key, value);
        rejectedWrites.delete(key);
      } catch {
        // A full storage still accepts removals; otherwise the previous value would return on reload.
        removeItem(key);
        rejectedWrites.set(key, value);
      }
    },
    removeItem,
  };
};

const storages: Record<StorageKind, SafeStorage> = {
  local: createSafeStorage("local"),
  session: createSafeStorage("session"),
};

/** Web Storage that never throws: values the browser refuses to store live in memory until the page unloads. */
export const safeStorage = (kind: StorageKind): SafeStorage => storages[kind];
