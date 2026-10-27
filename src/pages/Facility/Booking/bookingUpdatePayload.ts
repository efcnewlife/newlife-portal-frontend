import type { BookingUpdate } from "@/api/services/facilityService";

export interface BookingUpdateInput {
  title: string;
  /**
   * Full replacement, not a delta: the detail read has no way to show which surcharges are
   * currently applied, so the edit form always starts this empty. Submitting without touching
   * it sends `[]`.
   */
  surchargeCodes: string[];
}

/** The Ministry association is immutable after creation, so it is omitted and the server keeps the stored value. */
export const buildBookingUpdatePayload = (input: BookingUpdateInput): BookingUpdate => ({
  title: input.title.trim(),
  surchargeCodes: input.surchargeCodes,
});
