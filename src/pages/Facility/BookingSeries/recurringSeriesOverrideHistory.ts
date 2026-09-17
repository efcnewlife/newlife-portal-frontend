import type { OverrideLogItem, RecurringBookingSeriesOccurrence } from "@/api/services/facilityService";

/**
 * The admin Override Logs API has no seriesId filter (ADR: it audits bookings, not
 * Series). Series detail asks for logs across the Series' room set and date range,
 * then keeps only rows whose overriding booking is actually one of this Series'
 * occurrences.
 */
export const filterOverrideLogsForOccurrences = (
  logs: OverrideLogItem[],
  occurrences: RecurringBookingSeriesOccurrence[]
): OverrideLogItem[] => {
  const occurrenceIds = new Set(occurrences.map((occurrence) => occurrence.id));
  return logs.filter((log) => occurrenceIds.has(log.facilityBookingId));
};

/** Every room used by any occurrence, so the override-log query can be scoped per facility instead of pulling every facility's rows for the date window. */
export const uniqueOccurrenceFacilityIds = (occurrences: RecurringBookingSeriesOccurrence[]): string[] =>
  Array.from(new Set(occurrences.flatMap((occurrence) => occurrence.facilityIds)));
