# Newlife Portal Frontend

Admin SPA for Newlife Core — menus, RBAC, facility booking admin, ministry/org management — consuming `@efcnewlife/newlife-ui` and the Core API.

## Language

**Effective from / Effective to**:
Optional calendar-day bounds for when a room slot template, room blackout rule, or ministry schedule applies. In admin forms they are two independent optional dates, not one contiguous range selection.
_Avoid_: DateRangePicker as the default control for these fields, treating an open-ended bound as an invalid half-range

**Booking start / Booking end**:
The start and end instants of a facility booking (`startAt` / `endAt` on the API as UTC ISO). The admin UI edits them as date-and-time values with a display timezone, not as date-only or time-only fields.
_Avoid_: calendar-date-only booking, wall-clock string as the domain meaning of the instant

**Calendar booking event**:
The Calendar view's unit is one booking: a single block keyed by booking id, showing Booker and Booking start / Booking end. Time is the block's vertical span.
_Avoid_: one block per room, duplicating the same booking across Calendar columns, treating Grid's Primary facility as the Calendar mapping rule

**Calendar collision group**:
Calendar booking events on the same day column that overlap through a chain of intervals (connected overlap). Greedy packing assigns columns; later columns overlay the earlier ones with a fixed left indent and flush to the day column's right edge (card stack). Column 0 stays full width. K is the max concurrent columns in the group (lower in week than in day). Each drawn Calendar booking event stays its own clickable block. Same-room overlap is a Scheduling Conflict and should not appear as confirmed events.
_Avoid_: representative + `+N` list as the v1 Calendar layout, stacking full-width blocks with no indent, equal-width tiles that shrink a long booking for its whole duration, containment nesting boxes, treating this as Grid occupancy, one lane per room

**Calendar density overflow**:
The control on a Calendar collision group when the group needs more lanes than K. It shows how many events were not drawn and switches Booking view mode to `grid` for that date. It is not a list of the hidden bookings.
_Avoid_: popover of remainder bookings, silent truncation, opening the representative's detail from this control

**DataTable**:
The Portal admin list shell built on `@efcnewlife/newlife-ui` Table primitives, plus pagination, sorting, row selection, and context menu. It is a host composite, not the library Table itself.
_Avoid_: Table (when meaning the Portal list page), DataGrid, Grid

**Table row hover**:
Transient visual emphasis on a DataTable data row while the pointer is over that row. It is affordance only and does not mean the row is selected.
_Avoid_: row highlight as selection, hover action / hover callback as the default meaning of hover

**Selected row**:
A DataTable data row that is currently in the selection set (checkbox multi-select or programmed selection keys). Selection is persistent until cleared; table row hover may stack on top of it.
_Avoid_: treating hover as selection, confusing sticky header chrome with selection
