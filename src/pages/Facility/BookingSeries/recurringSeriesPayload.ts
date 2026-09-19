import type { PreviewRecurringBookingSeriesPayload } from "@/api/services/facilityService";

export interface RecurringSeriesPayloadInput {
  userId: string;
  ministryId: string | null;
  firstOccurrenceDate: string | null;
  lastOccurrenceDate: string | null;
  localStartTime: string | null;
  localEndTime: string | null;
  facilityIds: string[];
  surchargeCodes: string[];
  remark: string;
}

/**
 * Builds the on-behalf-of-Booker preview/create payload from already-validated form
 * field values. Returns null if a required field is missing so the caller can treat
 * that as "not ready to submit" without duplicating the required-field list.
 */
export const buildRecurringSeriesPreviewPayload = (
  input: RecurringSeriesPayloadInput
): PreviewRecurringBookingSeriesPayload | null => {
  if (
    !input.userId ||
    !input.firstOccurrenceDate ||
    !input.lastOccurrenceDate ||
    !input.localStartTime ||
    !input.localEndTime ||
    !input.facilityIds.length
  ) {
    return null;
  }

  return {
    userId: input.userId,
    ministryId: input.ministryId,
    firstOccurrenceDate: input.firstOccurrenceDate,
    lastOccurrenceDate: input.lastOccurrenceDate,
    localStartTime: input.localStartTime,
    localEndTime: input.localEndTime,
    rooms: input.facilityIds.map((facilityId, index) => ({ facilityId, sequence: index })),
    surchargeCodes: input.surchargeCodes,
    remark: input.remark.trim() || undefined,
  };
};
