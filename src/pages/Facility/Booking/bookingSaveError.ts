import type { ApiError } from "@/types/api";

export const BOOKING_ERROR_CODE = {
  SCHEDULING_CONFLICT: "FACILITY_BOOKING_SCHEDULING_CONFLICT",
  ROOM_BLACKOUT: "FACILITY_BOOKING_ROOM_BLACKOUT",
} as const;

interface BookingRoomOption {
  id: string;
  code: string;
  name?: string;
}

type Translate = (key: string, options?: Record<string, unknown>) => string;

const isApiError = (error: unknown): error is ApiError =>
  Boolean(error && typeof error === "object" && "code" in error && typeof (error as ApiError).code === "number");

const roomNameForFacilityId = (rooms: BookingRoomOption[], facilityId: string | undefined): string | undefined => {
  if (!facilityId) return undefined;
  const room = rooms.find((item) => item.id === facilityId);
  const name = room?.name?.trim();
  return name || undefined;
};

export const resolveBookingSaveErrorMessage = (
  error: unknown,
  rooms: BookingRoomOption[],
  t: Translate
): string | undefined => {
  if (!isApiError(error)) {
    return undefined;
  }

  const errorCode = typeof error.details?.error_code === "string" ? error.details.error_code : undefined;
  const facilityId = error.details?.context?.facility_id;
  const roomName = roomNameForFacilityId(rooms, typeof facilityId === "string" ? facilityId : undefined);

  if (errorCode === BOOKING_ERROR_CODE.SCHEDULING_CONFLICT) {
    return roomName
      ? t("booking.errors.schedulingConflict", { room: roomName })
      : t("booking.errors.schedulingConflictGeneric");
  }

  if (errorCode === BOOKING_ERROR_CODE.ROOM_BLACKOUT) {
    return roomName ? t("booking.errors.roomBlackout", { room: roomName }) : t("booking.errors.roomBlackoutGeneric");
  }

  return undefined;
};
