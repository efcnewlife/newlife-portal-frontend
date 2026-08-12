# Newlife Portal Frontend

Admin SPA for Newlife Core — menus, RBAC, facility booking admin, ministry/org management — consuming `@efcnewlife/newlife-ui` and the Core API.

## Language

**Effective from / Effective to**:
Optional calendar-day bounds for when a room slot template, room blackout rule, or ministry schedule applies. In admin forms they are two independent optional dates, not one contiguous range selection.
_Avoid_: DateRangePicker as the default control for these fields, treating an open-ended bound as an invalid half-range

**Booking start / Booking end**:
The start and end instants of a facility booking (`startAt` / `endAt` on the API as UTC ISO). The admin UI edits them as date-and-time values with a display timezone, not as date-only or time-only fields.
_Avoid_: calendar-date-only booking, wall-clock string as the domain meaning of the instant
