import type { ApiError } from "@/types/api";

export const RECURRING_SERIES_ERROR_CODE = {
  NOT_ELIGIBLE: "FACILITY_RECURRING_NOT_ELIGIBLE",
  ROOMS_REQUIRED: "FACILITY_BOOKING_ROOMS_REQUIRED",
  INVALID_TIME_RANGE: "FACILITY_RECURRING_INVALID_TIME_RANGE",
  MAX_ROOMS: "FACILITY_BOOKING_MAX_ROOMS",
  WEEKDAY_MISMATCH: "FACILITY_RECURRING_WEEKDAY_MISMATCH",
  USE_PERIOD: "FACILITY_RECURRING_USE_PERIOD",
  AVAILABILITY_WINDOW: "FACILITY_RECURRING_AVAILABILITY_WINDOW",
  MIN_OCCURRENCES: "FACILITY_RECURRING_MIN_OCCURRENCES",
  DST_NONEXISTENT: "FACILITY_RECURRING_DST_NONEXISTENT",
  MINISTRY_INACTIVE: "FACILITY_BOOKING_MINISTRY_INACTIVE",
  WEEKLY_QUOTA: "FACILITY_RECURRING_WEEKLY_QUOTA",
  SCHEDULING_CONFLICT: "FACILITY_BOOKING_SCHEDULING_CONFLICT",
  ROOM_BLACKOUT: "FACILITY_BOOKING_ROOM_BLACKOUT",
  INVALID_EXCLUSION: "FACILITY_RECURRING_INVALID_EXCLUSION",
  MINISTRY_CONFLICT: "FACILITY_RECURRING_MINISTRY_CONFLICT",
  SERIES_NOT_FOUND: "FACILITY_BOOKING_SERIES_NOT_FOUND",
  INVALID_CANCELLATION_SCOPE: "FACILITY_RECURRING_INVALID_CANCELLATION_SCOPE",
  OCCURRENCE_REQUIRED: "FACILITY_RECURRING_OCCURRENCE_REQUIRED",
  OCCURRENCE_NOT_FOUND: "FACILITY_RECURRING_OCCURRENCE_NOT_FOUND",
  HISTORICAL_OCCURRENCE: "FACILITY_RECURRING_HISTORICAL_OCCURRENCE",
} as const;

interface RecurringSeriesRoomOption {
  id: string;
  code: string;
  name?: string;
}

type Translate = (key: string, options?: Record<string, unknown>) => string;

const isApiError = (error: unknown): error is ApiError =>
  Boolean(error && typeof error === "object" && "code" in error && typeof (error as ApiError).code === "number");

const roomNameForFacilityId = (rooms: RecurringSeriesRoomOption[], facilityId: unknown): string | undefined => {
  if (typeof facilityId !== "string" || !facilityId) return undefined;
  const room = rooms.find((item) => item.id === facilityId);
  const name = room?.name?.trim();
  return name || undefined;
};

/**
 * Maps a Recurring Booking Series preview/create/cancel `error_code` to a translated
 * message. Returns undefined for unmapped codes so callers fall back to the shared
 * generic mapper (Feedback copy convention: never show raw backend `detail`).
 */
export const resolveRecurringSeriesErrorMessage = (
  error: unknown,
  rooms: RecurringSeriesRoomOption[],
  t: Translate
): string | undefined => {
  if (!isApiError(error)) {
    return undefined;
  }

  const errorCode = typeof error.details?.error_code === "string" ? error.details.error_code : undefined;
  const context = (error.details?.context ?? {}) as Record<string, unknown>;
  const roomName = roomNameForFacilityId(rooms, context.facility_id);

  switch (errorCode) {
    case RECURRING_SERIES_ERROR_CODE.NOT_ELIGIBLE:
      return t("bookingSeries.errors.notEligible");
    case RECURRING_SERIES_ERROR_CODE.ROOMS_REQUIRED:
      return t("bookingSeries.errors.roomsRequired");
    case RECURRING_SERIES_ERROR_CODE.INVALID_TIME_RANGE:
      return t("bookingSeries.errors.invalidTimeRange");
    case RECURRING_SERIES_ERROR_CODE.MAX_ROOMS:
      return t("bookingSeries.errors.maxRooms");
    case RECURRING_SERIES_ERROR_CODE.WEEKDAY_MISMATCH:
      return t("bookingSeries.errors.weekdayMismatch");
    case RECURRING_SERIES_ERROR_CODE.USE_PERIOD:
      return t("bookingSeries.errors.usePeriod");
    case RECURRING_SERIES_ERROR_CODE.AVAILABILITY_WINDOW:
      return t("bookingSeries.errors.availabilityWindow");
    case RECURRING_SERIES_ERROR_CODE.MIN_OCCURRENCES:
      return t("bookingSeries.errors.minOccurrences");
    case RECURRING_SERIES_ERROR_CODE.DST_NONEXISTENT:
      return t("bookingSeries.errors.dstNonexistent");
    case RECURRING_SERIES_ERROR_CODE.MINISTRY_INACTIVE:
      return t("bookingSeries.errors.ministryInactive");
    case RECURRING_SERIES_ERROR_CODE.WEEKLY_QUOTA:
      return t("bookingSeries.errors.weeklyQuota");
    case RECURRING_SERIES_ERROR_CODE.SCHEDULING_CONFLICT:
      return roomName
        ? t("bookingSeries.errors.schedulingConflict", { room: roomName })
        : t("bookingSeries.errors.schedulingConflictGeneric");
    case RECURRING_SERIES_ERROR_CODE.ROOM_BLACKOUT:
      return roomName
        ? t("bookingSeries.errors.roomBlackout", { room: roomName })
        : t("bookingSeries.errors.roomBlackoutGeneric");
    case RECURRING_SERIES_ERROR_CODE.INVALID_EXCLUSION:
      return t("bookingSeries.errors.invalidExclusion");
    case RECURRING_SERIES_ERROR_CODE.MINISTRY_CONFLICT: {
      const stewardName =
        typeof context.ministry_steward_display_name === "string" ? context.ministry_steward_display_name : undefined;
      const stewardEmail =
        typeof context.ministry_steward_email === "string" ? context.ministry_steward_email : undefined;
      const steward = [stewardName, stewardEmail].filter(Boolean).join(" · ");
      return steward
        ? t("bookingSeries.errors.ministryConflict", { steward })
        : t("bookingSeries.errors.ministryConflictGeneric");
    }
    case RECURRING_SERIES_ERROR_CODE.SERIES_NOT_FOUND:
      return t("bookingSeries.errors.seriesNotFound");
    case RECURRING_SERIES_ERROR_CODE.INVALID_CANCELLATION_SCOPE:
      return t("bookingSeries.errors.invalidCancellationScope");
    case RECURRING_SERIES_ERROR_CODE.OCCURRENCE_REQUIRED:
      return t("bookingSeries.errors.occurrenceRequired");
    case RECURRING_SERIES_ERROR_CODE.OCCURRENCE_NOT_FOUND:
      return t("bookingSeries.errors.occurrenceNotFound");
    case RECURRING_SERIES_ERROR_CODE.HISTORICAL_OCCURRENCE:
      return t("bookingSeries.errors.historicalOccurrence");
    default:
      return undefined;
  }
};
