# 0001. Calendar concurrent booking lanes

## Status

Accepted

## Context

On the admin booking Calendar, overlapping Calendar booking events were drawn full-width in the day column. Later blocks covered earlier ones, so an operator could not see or click every booking in that time range.

Equal-width columns for a whole collision group shrink every booking for its entire duration, even when a short booking only covers part of that span. Nesting contained intervals inside a parent box also diverges from Google Calendar's card-stack overlay.

## Decision

Lay out overlapping Calendar booking events as a right-aligned card stack: the earliest lane stays full width; later lanes overlay with a fixed left indent and flush to the day column's right edge.

- A Calendar collision group is a connected component of interval overlap on one day column. Intervals are half-open: `end <= other.start` is not overlap.
- Pack columns with greedy assignment: sort by start ascending, then end descending; assign the leftmost column whose last end is `<=` this start. There is no parent/child containment tree.
- Horizontal geometry does not use column count `n`: `left = min(col * INDENT, 1 - MIN_WIDTH)`, `width = 1 - left`. Column 0 is always full width. Later columns share the same indent when they reuse a lane (back-to-back).
- Do not expand into empty neighbor columns. Width stays constant for the event's whole duration.
- Week passes `K = 4`. Day passes `K = 10`. K is the max concurrent columns in a collision group. The packer does not hard-code K.
- Visible lanes are the first K from greedy packing. Events assigned column index `>= K` are omitted. Overflow layout still uses each visible event's real `col` for indent (not `col / n`).
- Calendar density overflow is a control on that overflowing group. Its label includes N (undrawn count). Activating it switches Booking view mode to `grid` and sets `date` to that day column's ISO date. It does not open detail, a context menu, or a remainder list.
- One Calendar booking event per booking id; title is the Booker. Cancelled bookings stay off Calendar. Midnight-spanning bookings continue across day columns, with packing computed per day.
- Calendar month layout and Calendar date control are governed by ADR 0006 (this ADR’s former “Month view is unused” clause is superseded for Month only). List view is unchanged. Booking Grid layout is governed by ADR 0002 (this ADR’s former “Grid unchanged” clause is superseded for Grid only). Day and Week lane packing, K, and density overflow in this ADR still apply; Month’s right pane reuses Day’s rules (`K = 10`).

## Consequences

- Operators can click every drawn booking that still fits the lane cap.
- A long booking stays a full-width base card; shorter overlapping bookings stack on top with a slight left indent (Google Calendar-style overlay), not side-by-side equal tiles.
- A busy morning does not shrink an unrelated afternoon booking.
- When a group exceeds K, Calendar is explicitly incomplete for that slot; Grid is the overflow destination.
- Later work must not silently restore full-width stacking without indent, a representative + remainder popover, equal-width day columns, or containment nesting boxes.
