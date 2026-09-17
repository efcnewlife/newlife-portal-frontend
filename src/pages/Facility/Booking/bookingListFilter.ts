/**
 * Ministry has no server-side filter on the admin Booking list/range endpoints, so
 * this filters the already-grouped rows on the current page only (see
 * bookingSeriesGrouping.ts for the same page-local limitation).
 */
export const filterBookingRowsByMinistry = <T extends { ministryId?: string }>(rows: T[], ministryId: string): T[] => {
  if (!ministryId) return rows;
  return rows.filter((row) => row.ministryId === ministryId);
};
