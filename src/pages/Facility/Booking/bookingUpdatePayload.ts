import type { BookingUpdate } from "@/api/services/facilityService";

export interface BookingUpdateInput {
  title: string;
  ministryId: string | null;
  /**
   * Full replacement, not a delta: the detail read has no way to show which surcharges are
   * currently applied, so the edit form always starts this empty. Submitting without touching
   * it sends `[]`.
   */
  surchargeCodes: string[];
}

export const buildBookingUpdatePayload = (input: BookingUpdateInput): BookingUpdate => ({
  title: input.title.trim(),
  ministryId: input.ministryId || undefined,
  surchargeCodes: input.surchargeCodes,
});
