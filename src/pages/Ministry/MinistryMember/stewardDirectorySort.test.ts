import { describe, expect, it } from "vitest";
import {
  DEFAULT_STEWARD_DIRECTORY_SORT,
  convertStewardDirectorySortToApiParams,
  toggleStewardDirectorySort,
} from "./stewardDirectorySort";

describe("stewardDirectorySort", () => {
  it("defaults to updated newest first", () => {
    expect(DEFAULT_STEWARD_DIRECTORY_SORT).toEqual({ field: "updated_at", descending: true });
    expect(convertStewardDirectorySortToApiParams(DEFAULT_STEWARD_DIRECTORY_SORT)).toEqual({
      order_by: "updated_at",
      descending: true,
    });
  });

  it("toggles direction when clicking the active field", () => {
    const next = toggleStewardDirectorySort({ field: "updated_at", descending: true }, "updated_at");
    expect(next).toEqual({ field: "updated_at", descending: false });
  });

  it("switches field with sensible default direction", () => {
    expect(toggleStewardDirectorySort(DEFAULT_STEWARD_DIRECTORY_SORT, "name")).toEqual({
      field: "name",
      descending: false,
    });
    expect(toggleStewardDirectorySort({ field: "name", descending: false }, "created_at")).toEqual({
      field: "created_at",
      descending: true,
    });
  });
});
