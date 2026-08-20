import { describe, expect, it } from "vitest";
import type { ApiError } from "@/types/api";
import { resolveBookingSaveErrorMessage } from "./bookingSaveError";

const rooms = [
  { id: "room-1", code: "CHAPEL", name: "Chapel" },
  { id: "room-2", code: "GYM" },
];

const t = (key: string, options?: Record<string, unknown>): string => {
  if (typeof options?.room === "string") {
    return `${key}:${options.room}`;
  }
  return key;
};

const apiError = (overrides: Partial<ApiError> & { details?: ApiError["details"] }): ApiError => ({
  code: 400,
  message: "Room 11111111-1111-1111-1111-111111111111 has a scheduling conflict",
  ...overrides,
});

describe("resolveBookingSaveErrorMessage", () => {
  it("returns the scheduling conflict toast with room name", () => {
    const error = apiError({
      code: 409,
      details: {
        error_code: "FACILITY_BOOKING_SCHEDULING_CONFLICT",
        context: { facility_id: "room-1" },
      },
    });
    expect(resolveBookingSaveErrorMessage(error, rooms, t)).toBe("booking.errors.schedulingConflict:Chapel");
  });

  it("returns the generic scheduling conflict toast when room name is missing", () => {
    const error = apiError({
      code: 409,
      details: {
        error_code: "FACILITY_BOOKING_SCHEDULING_CONFLICT",
        context: { facility_id: "unknown-room" },
      },
    });
    expect(resolveBookingSaveErrorMessage(error, rooms, t)).toBe("booking.errors.schedulingConflictGeneric");
  });

  it("returns the blackout toast with room name", () => {
    const error = apiError({
      details: {
        error_code: "FACILITY_BOOKING_ROOM_BLACKOUT",
        context: { facility_id: "room-1" },
      },
    });
    expect(resolveBookingSaveErrorMessage(error, rooms, t)).toBe("booking.errors.roomBlackout:Chapel");
  });

  it("returns the generic blackout toast when the room has no name", () => {
    const error = apiError({
      details: {
        error_code: "FACILITY_BOOKING_ROOM_BLACKOUT",
        context: { facility_id: "room-2" },
      },
    });
    expect(resolveBookingSaveErrorMessage(error, rooms, t)).toBe("booking.errors.roomBlackoutGeneric");
  });

  it("returns undefined for other errors so notifyApiError can use the shared mapper", () => {
    const error = apiError({
      message: "end_at must be after start_at",
      details: { detail: "end_at must be after start_at" },
    });
    expect(resolveBookingSaveErrorMessage(error, rooms, t)).toBeUndefined();
  });

  it("does not parse the English detail string for a room name", () => {
    const error = apiError({
      code: 409,
      details: {
        detail: "Room room-1 has a scheduling conflict",
        error_code: "FACILITY_BOOKING_SCHEDULING_CONFLICT",
        context: { facility_id: "missing" },
      },
    });
    expect(resolveBookingSaveErrorMessage(error, rooms, t)).toBe("booking.errors.schedulingConflictGeneric");
  });
});
