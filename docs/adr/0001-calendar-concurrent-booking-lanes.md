# 0001. Calendar concurrent booking lanes

## Status

Accepted

## Context

On the admin booking Calendar, overlapping Calendar booking events were drawn full-width in the day column. Later blocks covered earlier ones, so an operator could not see or click every booking in that time range.

## Decision

Lay out overlapping Calendar booking events in equal-width side-by-side lanes, one block per booking.

- A Calendar collision group is a connected component of interval overlap on that local day. Intervals are half-open: `end <= other.start` is not overlap.
- Pack columns with greedy assignment: sort by Booking start ascending, then Booking end descending; assign the leftmost column whose last end is `<=` this start.
- Lane count and width are computed per group. Width is `1 / visibleLaneCount` of the day column, where `visibleLaneCount` is `min(columnsNeeded, K)` for that group only — never the max column count of the whole day. Do not expand a lane into empty neighbors.
- Week passes `K = 4`. Day passes `K = 10`. The packer does not hard-code K.
- Visible lanes are the first K from greedy packing. Events assigned column index `>= K` are omitted from the grid.
- Calendar density overflow is a control on the collision group. Its label includes N (undrawn count for that group). Activating it switches Booking view mode to `grid` and sets `date` to that day column's ISO date. It does not open detail, a context menu, or a remainder list.
- One Calendar booking event per booking id; title is the Booker. Cancelled bookings stay off Calendar. Midnight-spanning bookings continue across day columns, with packing computed per day.
- Month view is unused by booking Calendar and stays as-is. List and Grid views are unchanged.

## Consequences

- Operators can click every drawn booking that still fits the lane cap.
- A busy morning does not shrink an unrelated afternoon booking.
- When a group exceeds K, Calendar is explicitly incomplete for that slot; Grid is the overflow destination.
- Later work must not silently restore full-width stacking, a representative + remainder popover, day-wide column counts, or unlimited lane splitting.
