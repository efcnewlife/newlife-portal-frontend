import { describe, expect, it } from "vitest";
import {
  parseMinistryQueryId,
  resolveStewardDirectorySelection,
  withMinistryQueryId,
} from "./stewardDirectorySelection";

describe("ministry query param", () => {
  it("parses ministry id from search", () => {
    expect(parseMinistryQueryId("?ministry=abc")).toBe("abc");
    expect(parseMinistryQueryId("ministry=abc")).toBe("abc");
    expect(parseMinistryQueryId("?q=jane")).toBeNull();
    expect(parseMinistryQueryId("?ministry=")).toBeNull();
  });

  it("writes ministry id without dropping other params", () => {
    expect(withMinistryQueryId("?q=jane", "abc")).toBe("?q=jane&ministry=abc");
    expect(withMinistryQueryId("?ministry=old", "new")).toBe("?ministry=new");
    expect(withMinistryQueryId("?ministry=old", null)).toBe("");
  });
});

describe("resolveStewardDirectorySelection", () => {
  const rail = ["a", "b", "c"];

  it("selects the first rail item on load when the URL has no ministry", () => {
    expect(
      resolveStewardDirectorySelection({
        reason: "load",
        urlMinistryId: null,
        railIds: rail,
        currentSelectedId: null,
        isDirty: false,
      }),
    ).toEqual({ action: "select", ministryId: "a", syncUrl: true });
  });

  it("keeps the URL ministry on load even when it is missing from the rail", () => {
    expect(
      resolveStewardDirectorySelection({
        reason: "load",
        urlMinistryId: "missing",
        railIds: rail,
        currentSelectedId: null,
        isDirty: false,
      }),
    ).toEqual({ action: "select", ministryId: "missing", syncUrl: false });
  });

  it("blocks a dirty rail click and allows a clean one", () => {
    expect(
      resolveStewardDirectorySelection({
        reason: "rail-click",
        urlMinistryId: "a",
        railIds: rail,
        currentSelectedId: "a",
        isDirty: true,
        requestedId: "b",
      }),
    ).toEqual({ action: "block" });
    expect(
      resolveStewardDirectorySelection({
        reason: "rail-click",
        urlMinistryId: "a",
        railIds: rail,
        currentSelectedId: "a",
        isDirty: false,
        requestedId: "b",
      }),
    ).toEqual({ action: "select", ministryId: "b", syncUrl: true });
  });

  it("keeps a dirty selection when a filter drops it from the rail", () => {
    expect(
      resolveStewardDirectorySelection({
        reason: "filter",
        urlMinistryId: "a",
        railIds: ["b"],
        currentSelectedId: "a",
        isDirty: true,
      }),
    ).toEqual({ action: "keep" });
  });

  it("selects the first remaining item when a clean selection misses the filter", () => {
    expect(
      resolveStewardDirectorySelection({
        reason: "filter",
        urlMinistryId: "a",
        railIds: ["b"],
        currentSelectedId: "a",
        isDirty: false,
      }),
    ).toEqual({ action: "select", ministryId: "b", syncUrl: true });
  });

  it("blocks a dirty URL change and selects a clean one", () => {
    expect(
      resolveStewardDirectorySelection({
        reason: "url-change",
        urlMinistryId: "b",
        railIds: rail,
        currentSelectedId: "a",
        isDirty: true,
      }),
    ).toEqual({ action: "block" });
    expect(
      resolveStewardDirectorySelection({
        reason: "url-change",
        urlMinistryId: "b",
        railIds: rail,
        currentSelectedId: "a",
        isDirty: false,
      }),
    ).toEqual({ action: "select", ministryId: "b", syncUrl: false });
  });

  it("clears when the rail is empty and the roster is clean", () => {
    expect(
      resolveStewardDirectorySelection({
        reason: "filter",
        urlMinistryId: "a",
        railIds: [],
        currentSelectedId: "a",
        isDirty: false,
      }),
    ).toEqual({ action: "clear" });
  });
});
