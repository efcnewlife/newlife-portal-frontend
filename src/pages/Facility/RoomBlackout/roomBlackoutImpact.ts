import type { ApiError } from "@/types/api";
import type {
  RoomBlackoutImpactOccurrence,
  RoomBlackoutImpactPreview,
  RoomBlackoutWrite,
} from "@/api/services/facilityService";

export const ROOM_BLACKOUT_IMPACT_ERROR_CODE = {
  CONFIRMATION_REQUIRED: "FACILITY_BLACKOUT_IMPACT_CONFIRMATION_REQUIRED",
  MISMATCH: "FACILITY_BLACKOUT_IMPACT_MISMATCH",
} as const;

const compareStrings = (a: string, b: string): number => (a < b ? -1 : a > b ? 1 : 0);

export interface BlackoutImpactSeriesGroup {
  seriesId: string;
  items: RoomBlackoutImpactOccurrence[];
}

/** Groups impact occurrences by Series, each group's occurrences ordered by start time. */
export const groupBlackoutImpactBySeries = (items: RoomBlackoutImpactOccurrence[]): BlackoutImpactSeriesGroup[] => {
  const bySeries = new Map<string, RoomBlackoutImpactOccurrence[]>();
  for (const item of items) {
    const list = bySeries.get(item.seriesId) ?? [];
    list.push(item);
    bySeries.set(item.seriesId, list);
  }
  return Array.from(bySeries.entries())
    .sort(([a], [b]) => compareStrings(a, b))
    .map(([seriesId, seriesItems]) => ({
      seriesId,
      items: [...seriesItems].sort((a, b) => compareStrings(a.startAt, b.startAt)),
    }));
};

export const isMinistrySeriesImpact = (item: RoomBlackoutImpactOccurrence): boolean => item.ministryId !== null;

/** Attaches the confirmed occurrence ids from a preview to the create payload; leaves other fields untouched. */
export const buildConfirmedBlackoutPayload = (
  payload: RoomBlackoutWrite,
  items: RoomBlackoutImpactOccurrence[]
): RoomBlackoutWrite & { confirmOccurrenceIds: string[] } => ({
  ...payload,
  confirmOccurrenceIds: items.map((item) => item.id),
});

export interface PendingBlackoutImpact {
  payload: RoomBlackoutWrite;
  items: RoomBlackoutImpactOccurrence[];
}

export type BlackoutImpactDecision =
  { kind: "create"; payload: RoomBlackoutWrite } | { kind: "confirm"; pending: PendingBlackoutImpact };

/**
 * Decides how the create flow proceeds from an impact preview: straight to create when nothing
 * is impacted, or hold the payload and impacted items for operator confirmation otherwise.
 */
export const decideBlackoutImpact = (
  payload: RoomBlackoutWrite,
  preview: RoomBlackoutImpactPreview
): BlackoutImpactDecision =>
  preview.confirmationRequired
    ? { kind: "confirm", pending: { payload, items: preview.items } }
    : { kind: "create", payload };

type Translate = (key: string, options?: Record<string, unknown>) => string;

const isApiError = (error: unknown): error is ApiError =>
  Boolean(error && typeof error === "object" && "code" in error && typeof (error as ApiError).code === "number");

/**
 * Maps a stale Blackout impact `error_code` (the confirmed occurrence set no longer matches the
 * current preview, e.g. another operator acted on an occurrence meanwhile) to a translated
 * message. Returns undefined for unmapped codes so callers fall back to the shared generic mapper.
 */
export const resolveRoomBlackoutImpactErrorMessage = (error: unknown, t: Translate): string | undefined => {
  if (!isApiError(error)) {
    return undefined;
  }
  const errorCode = typeof error.details?.error_code === "string" ? error.details.error_code : undefined;
  switch (errorCode) {
    case ROOM_BLACKOUT_IMPACT_ERROR_CODE.CONFIRMATION_REQUIRED:
    case ROOM_BLACKOUT_IMPACT_ERROR_CODE.MISMATCH:
      return t("roomBlackout.impact.errors.stale");
    default:
      return undefined;
  }
};
