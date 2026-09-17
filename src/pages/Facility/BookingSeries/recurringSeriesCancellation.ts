import type { RecurringBookingSeriesOccurrence, RecurringCancellationScope } from "@/api/services/facilityService";

export const RECURRING_CANCELLATION_SCOPE = {
  OCCURRENCE: "occurrence",
  THIS_AND_FUTURE: "this_and_future",
  ENTIRE_SERIES: "entire_series",
} as const satisfies Record<string, RecurringCancellationScope>;

export const APPROVED_CANCELLATION_SCOPES: RecurringCancellationScope[] = [
  RECURRING_CANCELLATION_SCOPE.OCCURRENCE,
  RECURRING_CANCELLATION_SCOPE.THIS_AND_FUTURE,
  RECURRING_CANCELLATION_SCOPE.ENTIRE_SERIES,
];

const LIVE_OCCURRENCE_STATUSES = new Set(["pending_payment", "confirmed"]);

/** Cancellable = still live (not already cancelled/overridden) and its start is in the future. */
export const isCancellableOccurrence = (occurrence: RecurringBookingSeriesOccurrence, now: Date): boolean => {
  if (!LIVE_OCCURRENCE_STATUSES.has(occurrence.status)) {
    return false;
  }
  const startAt = new Date(occurrence.startAt).getTime();
  return Number.isFinite(startAt) && startAt > now.getTime();
};

/** Mirrors the backend's cancellation targeting so the modal can preview what a scope will affect. */
export const affectedOccurrencesForScope = (
  occurrences: RecurringBookingSeriesOccurrence[],
  scope: RecurringCancellationScope,
  occurrenceId: string | null,
  now: Date
): RecurringBookingSeriesOccurrence[] => {
  const cancellable = occurrences.filter((occurrence) => isCancellableOccurrence(occurrence, now));

  if (scope === RECURRING_CANCELLATION_SCOPE.ENTIRE_SERIES) {
    return cancellable;
  }

  if (!occurrenceId) {
    return [];
  }
  const pivot = occurrences.find((occurrence) => occurrence.id === occurrenceId);
  if (!pivot) {
    return [];
  }

  if (scope === RECURRING_CANCELLATION_SCOPE.OCCURRENCE) {
    return cancellable.filter((occurrence) => occurrence.id === occurrenceId);
  }

  const pivotStart = new Date(pivot.startAt).getTime();
  return cancellable.filter((occurrence) => new Date(occurrence.startAt).getTime() >= pivotStart);
};
