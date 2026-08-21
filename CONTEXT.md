# Newlife Portal Frontend

Admin SPA for Newlife Core — menus, RBAC, facility booking admin, ministry/org management — consuming `@efcnewlife/newlife-ui` and the Core API.

## Language

### Ministry stewards

**Ministry Steward**:
A user assigned to a Ministry as `primary` or `secondary` on that Ministry's steward roster. This is who may represent the Ministry (including booking on behalf). It is not a pastoral Person record and not the facility-booking "priority member" identity.
_Avoid_: Ministry Member (when meaning booking priority), Member Person (`/org/members`), owner (that is the Position incumbent)

**Steward roster**:
The full set of Ministry Stewards for one Ministry. Domain rule: exactly one primary steward and at least one secondary steward.
_Avoid_: treating primary/secondary as auth.role or org.position, a roster with zero or many primaries

**Steward directory query**:
A query whose result is Ministries, not membership rows. It may match a Ministry name or a Steward's display name/email. A match does not return the Steward roster; the roster loads for the selected Ministry.
_Avoid_: one row per steward, treating this as Member Person search, stuffing the roster into the directory payload

### Admin lists

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

**Booking Grid**:
The admin day-scoped occupancy map: rooms as frozen rows, time as a horizontally scrollable 00:00–24:00 axis. It is not Calendar-with-rooms and not the List DataTable.
_Avoid_: Calendar week/day layout rules, Primary-only row placement, stretching hour columns to fill the viewport

**Grid cell**:
One 30-minute create target on Booking Grid. There are 48 cells per day; the last is 23:30–24:00. The trailing 12:00 AM label is not a cell.
_Avoid_: 60-minute cells, a 49th cell at 24:00, Room slot template duration as cell size

**Grid occupancy block**:
A continuous bar for one booking on one room row, from Booking start / Booking end clipped to the Grid day window. Multi-room bookings reuse the same interval on every `facilityIds` row.
_Avoid_: discrete timetable cell fill, per-room intervals on the same booking, matching rooms by `facilityNames`

**Grid day window**:
The operator-local half-open day `[00:00, 24:00)` of the Booking Grid anchor date. Same local-day rule as Calendar.
_Avoid_: facility timezone as the day boundary, an 08:00–22:00 window

**Primary facility**:
The first room line on a booking (`facilityId` on the list item). List room filters use this key. Booking Grid occupancy uses `facilityIds` (with Primary fallback), not Primary alone.
_Avoid_: treating Primary as the only occupied room on Grid

**Booking view mode**:
Which admin booking surface is active: `list`, `calendar`, or `grid` (URL/`view` state).
_Avoid_: conflating Calendar packing with Grid occupancy

**Calendar layout**:
Which Calendar chrome is active inside Booking view mode `calendar`: `week`, `day`, or `month`. It is stored in the URL with the booking `date` (alongside `view=calendar`), not only in ephemeral component state.
_Avoid_: treating Calendar layout as Booking view mode, conflating Month with Booking Grid, relying on refresh-loss local state as the source of truth for layout

**Calendar month layout**:
The month Calendar layout: left is a month grid of Calendar booking events; each visible line in a cell is a compact summary (single fixed-color dot, Booking start time, Booker). How many lines fit is measured from the cell's height (at least one line when the day has events); when more events exist than fit, a clickable "+ N more" selects that day as the Calendar anchor date without opening a remainder popover. Clicking a summary line opens that booking and sets the anchor to that day. Days from adjacent months in the visible grid are selectable and show summaries; choosing one sets the anchor (and the shown month follows). Selecting a day keeps Calendar layout `month` and sets the Calendar anchor date. Right is the same day time-axis of Calendar booking events as Day for that anchor date, including the same Calendar density overflow rule (`K = 10` → Booking view mode `grid` for that date). Toolbar prev/next steps by one month and preserves the day-of-month when possible.
_Avoid_: month grid as date-only navigation with no in-cell summaries, a list panel instead of the day time-axis, treating in-cell lines as the full Day time-axis, lunar / non-booking decorations, status- or room-colored dots as the v1 rule, remainder popover for overflow, stepping Month prev/next by day or week, a divergent overflow K on the month right pane

**Calendar date control**:
The Calendar toolbar control that sets the Calendar anchor date via a date picker and includes a Today action to jump to the current calendar day. It replaces a Today-only button and applies to every Calendar layout (`week`, `day`, `month`).
_Avoid_: a separate Today button beside an independent date picker, treating this control as a Booking view mode switch, Calendar-only Today while Month uses a different jump control

**Booking range query**:
The non-paginated read used by Calendar and Booking Grid: given a required visible time window (`dateFrom` / `dateTo`), return every booking whose interval overlaps that window (`start < windowEnd` and `end > windowStart`). Cancelled bookings are excluded by default and may be included via an explicit query flag. The window length is capped (admin UI ranges fit within about two months). It is not the List DataTable `pages` query.
_Avoid_: `getBookingPages` with a large `page_size` as the Calendar/Grid contract, filtering only by `start_at` inside the window, treating List pagination as occupancy completeness, requiring cancelled rows for the default occupancy surfaces

**DataTable**:
The Portal admin list shell built on `@efcnewlife/newlife-ui` Table primitives, plus pagination, sorting, row selection, and context menu. It is a host composite, not the library Table itself.
_Avoid_: Table (when meaning the Portal list page), DataGrid, Grid

### Operation feedback

**Operation feedback**:
The outcome notice shown after an admin mutation or load attempt (create, update, delete, restore, cancel, bind, save, fetch). It is a toast via `@efcnewlife/newlife-ui` notification (`success` | `warning` | `error`), not a blocking dialog. CRUD success always shows Operation feedback.
_Avoid_: `window.alert`, treating confirmation Modal as the outcome notice, treating field `error` props as operation feedback, silent success after CRUD

**Form field error**:
Inline validation on a single control (or a small local group) before or instead of submit. It stays on the field; it is not Operation feedback. Validation never uses toast or `alert`.
_Avoid_: toast for required-field misses, `alert` for reject-reason required, warning toast for missing password

**Transport failure**:
A request that never got a usable HTTP response (network down, timeout). The HTTP client may notify once; callers must not show a second Operation feedback for the same failure.
_Avoid_: page-level toast/`alert` stacked on top of the client's network/timeout toast

**Feedback severity**:
`success` = mutation or intentional load path completed; `error` = the attempt failed (including HTTP 4xx/5xx business rejection); `warning` = non-failure caution the user can continue past; `info` is not part of the default admin CRUD vocabulary.
_Avoid_: mapping HTTP 4xx to `warning`, toast `warning` for Form field errors, using `info` toasts for CRUD or shared feedback helpers

**Feedback copy**:
Operation feedback title is always host i18n (verb outcome). Failure description prefers a mapped `error_code` → i18n string; if there is no mapping, use a generic i18n fallback. Do not show raw backend `detail` / `ApiError.message` to the user. Expanding stable `error_code` coverage is a parallel backend track (separate issue), not a reason to delay the toast channel unification.
_Avoid_: English `detail` in the toast, generic-only copy when an `error_code` mapper exists (e.g. booking), blocking frontend feedback unification on a full error-code catalog

**Feedback chrome**:
Operation feedback toasts use `top-right`; success auto-hides at 3s; error (and warning if ever used) at 5s.
_Avoid_: `top-center` / `bottom-right` drift per feature, per-page hideDuration

**Auth form error**:
Login / sign-in failure copy shown inline on the auth form only. It is not Operation feedback and must not also fire a toast for the same failure (Transport failure still follows its own once-only rule). Login success has no toast (redirect only).
_Avoid_: authService toast + SignIn inline double channel, success toast on login redirect

**Table row hover**:
Transient visual emphasis on a DataTable data row while the pointer is over that row. It is affordance only and does not mean the row is selected.
_Avoid_: row highlight as selection, hover action / hover callback as the default meaning of hover

**Selected row**:
A DataTable data row that is currently in the selection set (checkbox multi-select or programmed selection keys). Selection is persistent until cleared; table row hover may stack on top of it.
_Avoid_: treating hover as selection, confusing sticky header chrome with selection
