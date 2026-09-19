export const BOOKING_TITLE_MAX_LENGTH = 30;

const HTML_TAG_RE = /<\/?[A-Za-z][^>]*>/;

export type BookingTitleError = "required" | "tooLong" | "notPlainText";

/** Mirrors the server's normalize_booking_title rule so a bad title fails before the request. */
export const validateBookingTitle = (value: string): BookingTitleError | null => {
  const trimmed = value.trim();
  if (trimmed.length < 1) return "required";
  if (trimmed.length > BOOKING_TITLE_MAX_LENGTH) return "tooLong";
  if (HTML_TAG_RE.test(trimmed)) return "notPlainText";
  return null;
};
