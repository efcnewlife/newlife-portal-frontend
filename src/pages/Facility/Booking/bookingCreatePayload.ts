import type { BookingCreate, PreviewQuoteRequest } from "@/api/services/facilityService";

export interface OneTimeBookingCreateInput {
  userId: string;
  title: string;
  startAt: string;
  endAt: string;
  ministryId: string | null;
  facilityIds: string[];
  surchargeCodes: string[];
  remark: string;
}

export interface OneTimePreviewQuoteInput {
  userId: string;
  ministryId: string | null;
  facilityIds: string[];
  billedHours: number;
  surchargeCodes: string[];
}

export const buildOneTimeBookingCreatePayload = (input: OneTimeBookingCreateInput): BookingCreate => ({
  userId: input.userId,
  title: input.title.trim(),
  startAt: input.startAt,
  endAt: input.endAt,
  ministryId: input.ministryId || undefined,
  rooms: input.facilityIds.map((facilityId, index) => ({ facilityId, sequence: index })),
  surchargeCodes: input.surchargeCodes,
  remark: input.remark.trim() || undefined,
});

export const buildOneTimePreviewQuoteRequest = (input: OneTimePreviewQuoteInput): PreviewQuoteRequest | null => {
  if (!input.facilityIds.length || input.billedHours <= 0) return null;
  return {
    bookingType: "one_time",
    userId: input.userId || undefined,
    ministryId: input.ministryId || undefined,
    currency: "CAD",
    roomLines: input.facilityIds.map((facilityId) => ({
      facilityId,
      billedHours: input.billedHours,
    })),
    surchargeCodes: input.surchargeCodes,
  };
};
