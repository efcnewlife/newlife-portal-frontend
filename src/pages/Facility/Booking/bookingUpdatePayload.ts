import type { BookingUpdate } from "@/api/services/facilityService";

export interface BookingUpdateInput {
  title: string;
  ministryId: string | null;
  surchargeCodes: string[];
}

export const buildBookingUpdatePayload = (input: BookingUpdateInput): BookingUpdate => ({
  title: input.title.trim(),
  ministryId: input.ministryId || undefined,
  surchargeCodes: input.surchargeCodes,
});
