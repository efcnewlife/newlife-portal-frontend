import { describe, expect, it } from "vitest";
import { filterBookingRowsByMinistry } from "./bookingListFilter";

describe("filterBookingRowsByMinistry", () => {
  const rows = [
    { id: "a", ministryId: "m1" },
    { id: "b", ministryId: "m2" },
    { id: "c", ministryId: undefined },
  ];

  it("returns every row when no Ministry is selected", () => {
    expect(filterBookingRowsByMinistry(rows, "")).toEqual(rows);
  });

  it("keeps only rows matching the selected Ministry", () => {
    expect(filterBookingRowsByMinistry(rows, "m1")).toEqual([{ id: "a", ministryId: "m1" }]);
  });

  it("excludes Personal Rental rows (no Ministry) once a Ministry is selected", () => {
    expect(filterBookingRowsByMinistry(rows, "m1").some((row) => row.id === "c")).toBe(false);
  });
});
