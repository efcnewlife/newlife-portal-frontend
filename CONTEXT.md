# Newlife Portal Frontend

Admin SPA for Newlife Core — menus, RBAC, facility booking admin, ministry/org management — consuming `@efcnewlife/newlife-ui` and the Core API.

## Language

**Effective from / Effective to**:
Optional calendar-day bounds for when a room slot template, room blackout rule, or ministry schedule applies. In admin forms they are two independent optional dates, not one contiguous range selection.
_Avoid_: DateRangePicker as the default control for these fields, treating an open-ended bound as an invalid half-range

**Booking start / Booking end**:
The start and end instants of a facility booking (`startAt` / `endAt` on the API as UTC ISO). The admin UI edits them as date-and-time values with a display timezone, not as date-only or time-only fields.
_Avoid_: calendar-date-only booking, wall-clock string as the domain meaning of the instant

**DataTable**:
The Portal admin list shell built on `@efcnewlife/newlife-ui` Table primitives, plus pagination, sorting, row selection, and context menu. It is a host composite, not the library Table itself.
_Avoid_: Table (when meaning the Portal list page), DataGrid, Grid

**Table row hover**:
Transient visual emphasis on a DataTable data row while the pointer is over that row. It is affordance only and does not mean the row is selected.
_Avoid_: row highlight as selection, hover action / hover callback as the default meaning of hover

**Selected row**:
A DataTable data row that is currently in the selection set (checkbox multi-select or programmed selection keys). Selection is persistent until cleared; table row hover may stack on top of it.
_Avoid_: treating hover as selection, confusing sticky header chrome with selection
