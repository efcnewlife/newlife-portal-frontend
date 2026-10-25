interface SavedPricedRecord {
  ministryId?: string | null;
  quotedAmount?: string | number | null;
}

/**
 * Saved Booking and Series reads carry no free flag (EFC-275). The server creates a Ministry
 * association only through the free-pricing gate and the association is immutable afterwards,
 * so a Ministry record with a zero snapshot total is a free Ministry booking.
 */
export const isSavedFreeMinistryBooking = (record: SavedPricedRecord): boolean => {
  if (!record.ministryId || record.quotedAmount == null || record.quotedAmount === "") {
    return false;
  }
  return Number(record.quotedAmount) === 0;
};
