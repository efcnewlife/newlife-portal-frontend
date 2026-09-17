import { describe, expect, it } from "vitest";
import type { ApiError } from "@/types/api";
import { resolveRecurringSeriesErrorMessage } from "./recurringSeriesErrorCode";

const t = (key: string, options?: Record<string, unknown>): string =>
  options ? `${key}:${JSON.stringify(options)}` : key;

const rooms = [{ id: "room-1", code: "R1", name: "Sanctuary" }];

const apiError = (overrides: Partial<ApiError> & { details?: ApiError["details"] }): ApiError => ({
  code: 400,
  message: "error",
  ...overrides,
});

describe("resolveRecurringSeriesErrorMessage", () => {
  it("maps a plain validation error code with no context", () => {
    const error = apiError({ details: { error_code: "FACILITY_RECURRING_MIN_OCCURRENCES" } });
    expect(resolveRecurringSeriesErrorMessage(error, rooms, t)).toBe("bookingSeries.errors.minOccurrences");
  });

  it("includes the room name for a scheduling conflict when the facility id is known", () => {
    const error = apiError({
      details: { error_code: "FACILITY_BOOKING_SCHEDULING_CONFLICT", context: { facility_id: "room-1" } },
    });
    expect(resolveRecurringSeriesErrorMessage(error, rooms, t)).toBe(
      'bookingSeries.errors.schedulingConflict:{"room":"Sanctuary"}'
    );
  });

  it("falls back to the generic scheduling conflict copy when the room is unknown", () => {
    const error = apiError({
      details: { error_code: "FACILITY_BOOKING_SCHEDULING_CONFLICT", context: { facility_id: "room-unknown" } },
    });
    expect(resolveRecurringSeriesErrorMessage(error, rooms, t)).toBe("bookingSeries.errors.schedulingConflictGeneric");
  });

  it("includes the room name for a blackout conflict", () => {
    const error = apiError({
      details: { error_code: "FACILITY_BOOKING_ROOM_BLACKOUT", context: { facility_id: "room-1" } },
    });
    expect(resolveRecurringSeriesErrorMessage(error, rooms, t)).toBe(
      'bookingSeries.errors.roomBlackout:{"room":"Sanctuary"}'
    );
  });

  it("includes the steward contact for a ministry-vs-ministry conflict", () => {
    const error = apiError({
      details: {
        error_code: "FACILITY_RECURRING_MINISTRY_CONFLICT",
        context: {
          facility_id: "room-1",
          ministry_id: "ministry-2",
          ministry_steward_display_name: "Jane Steward",
          ministry_steward_email: "jane@example.com",
        },
      },
    });
    expect(resolveRecurringSeriesErrorMessage(error, rooms, t)).toBe(
      'bookingSeries.errors.ministryConflict:{"steward":"Jane Steward · jane@example.com"}'
    );
  });

  it("falls back to the generic ministry-conflict copy when no steward contact is present", () => {
    const error = apiError({ details: { error_code: "FACILITY_RECURRING_MINISTRY_CONFLICT", context: {} } });
    expect(resolveRecurringSeriesErrorMessage(error, rooms, t)).toBe("bookingSeries.errors.ministryConflictGeneric");
  });

  it("maps every cancellation-scope error code", () => {
    expect(
      resolveRecurringSeriesErrorMessage(
        apiError({ code: 404, details: { error_code: "FACILITY_BOOKING_SERIES_NOT_FOUND" } }),
        rooms,
        t
      )
    ).toBe("bookingSeries.errors.seriesNotFound");
    expect(
      resolveRecurringSeriesErrorMessage(
        apiError({ details: { error_code: "FACILITY_RECURRING_INVALID_CANCELLATION_SCOPE" } }),
        rooms,
        t
      )
    ).toBe("bookingSeries.errors.invalidCancellationScope");
    expect(
      resolveRecurringSeriesErrorMessage(
        apiError({ details: { error_code: "FACILITY_RECURRING_OCCURRENCE_REQUIRED" } }),
        rooms,
        t
      )
    ).toBe("bookingSeries.errors.occurrenceRequired");
    expect(
      resolveRecurringSeriesErrorMessage(
        apiError({ code: 404, details: { error_code: "FACILITY_RECURRING_OCCURRENCE_NOT_FOUND" } }),
        rooms,
        t
      )
    ).toBe("bookingSeries.errors.occurrenceNotFound");
    expect(
      resolveRecurringSeriesErrorMessage(
        apiError({ details: { error_code: "FACILITY_RECURRING_HISTORICAL_OCCURRENCE" } }),
        rooms,
        t
      )
    ).toBe("bookingSeries.errors.historicalOccurrence");
  });

  it("returns undefined for an unmapped error code", () => {
    const error = apiError({ details: { error_code: "SOME_OTHER_CODE" } });
    expect(resolveRecurringSeriesErrorMessage(error, rooms, t)).toBeUndefined();
  });

  it("returns undefined for non-ApiError values", () => {
    expect(resolveRecurringSeriesErrorMessage(new Error("boom"), rooms, t)).toBeUndefined();
  });
});
