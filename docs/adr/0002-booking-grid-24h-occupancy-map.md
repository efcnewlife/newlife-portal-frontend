# 0002. Booking Grid is a 24-hour 30-minute freeze-pane occupancy map

## Status

Accepted

## Context

Admin Booking Grid previously showed only 08:00–22:00 in one-hour cells that stretched to fill the viewport. Overnight and half-hour bookings were clipped or misaligned, and the time axis rarely scrolled. Multi-room bookings appeared only on Primary facility, so other occupied room rows looked free.

ADR 0001 still governs Calendar. Its “Grid unchanged” note is superseded for Booking Grid only by this decision.

## Decision

Treat Booking Grid as the single-day occupancy map for one operator-local calendar day:

- Rooms are frozen rows; time is a horizontally scrollable 00:00–24:00 axis with 48 half-hour Grid cells. The trailing 12:00 AM is an axis label, not a 49th cell. Last cell is 23:30–24:00.
- Occupancy is a continuous bar from Booking start / Booking end (percent of the 24-hour span), clipped to the Grid day window `[00:00, 24:00)`. Do not fill discrete cells.
- Hour labels always use 12-hour AM/PM (not locale 24-hour). Both ends are labelled 12:00 AM. Half-hour columns have a line and no text.
- One booking has one interval. Draw that interval on every room id in `facilityIds`. If `facilityIds` is empty, fall back to Primary `facilityId`. Do not match rooms by `facilityNames`.
- Cancelled bookings stay off Booking Grid. Other statuses stay on, matching Calendar.
- Freeze pane: one scrollport; room column sticky left; time header sticky top and coupled to the time columns. Default horizontal offset lands near 8:00 AM. Column min-width must force horizontal overflow (no stretching `1fr` as the only sizing).
- Click empty cell: prefill that 30 minutes (including 23:30–24:00 as next local midnight). Empty cells are disabled without create permission.
- Admin list items include `facilityIds` (core-api) so Grid does not infer rooms from names. List Primary filter and `facilityNames` stay unchanged.

## Consequences

- Operators can read a full local day of occupancy, including overnight clips and 30-minute alignment.
- Multi-room bookings no longer look free on secondary room rows.
- Calendar layout, packing, K, and density overflow stay under ADR 0001; density overflow still opens Booking Grid on that date.
- Do not restore 08:00–22:00, 1-hour cells, or Primary-only Grid placement without superseding this ADR.
