import type { BookingListItem } from "@/api/services/facilityService";

export interface BookingSeriesGroupRow extends BookingListItem {
  /** Number of materialized occurrences collapsed into this row; 1 for a one-time booking. */
  occurrenceCount: number;
}

/**
 * Collapses one page of Booking rows into one row per Series (keyed by seriesId; a
 * one-time booking is its own singleton group keyed by id). The earliest occurrence
 * by startAt is the representative row, since Booker/status/time-window come from it.
 * Grouping only sees the current page — there is no backend "list Series" endpoint,
 * so a Series split across pages shows a partial occurrenceCount on each page.
 */
export const groupBookingsBySeries = (items: BookingListItem[]): BookingSeriesGroupRow[] => {
  const order: string[] = [];
  const membersByKey = new Map<string, BookingListItem[]>();

  for (const item of items) {
    const key = item.seriesId || item.id;
    const members = membersByKey.get(key);
    if (members) {
      members.push(item);
    } else {
      order.push(key);
      membersByKey.set(key, [item]);
    }
  }

  return order.map((key) => {
    const members = membersByKey.get(key)!;
    const [representative] = [...members].sort((a, b) => a.startAt.localeCompare(b.startAt));
    return { ...representative, occurrenceCount: members.length };
  });
};
