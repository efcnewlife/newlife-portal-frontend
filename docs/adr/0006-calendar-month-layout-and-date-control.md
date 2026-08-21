# 0006. Calendar month layout and date control

## Status

Accepted

## Context

Booking Calendar only offered week and day. Operators needed a month overview without losing the selected day's time-axis detail. The toolbar Today control could only jump to the current calendar day, not pick an arbitrary Calendar anchor date. Reusing the classic full-bleed month grid (events only in cells) would fight Day's time-axis and ADR 0001's density overflow story. Keeping Calendar layout only in component state meant refresh lost week/day/month.

## Decision

Add Calendar layout `month` beside `week` and `day`, and replace the Today-only control with a Calendar date control.

- **Split pane:** Left is the month grid; right is the same day time-axis of Calendar booking events as Day for the Calendar anchor date (lane packing and Calendar density overflow with `K = 10` → Booking view mode `grid` for that date).
- **In-cell summary:** Each visible line is a compact summary: single fixed-color dot, Booking start time, Booker. Line count is measured from cell height (at least one line when the day has events). Clickable `+ N more` selects that day as anchor; it does not open a remainder popover. Clicking a summary opens that booking and sets the anchor. Selecting a day keeps layout `month`.
- **Adjacent-month padding days** in the visible grid are selectable and show summaries; choosing one sets the anchor (shown month follows).
- **Toolbar:** In month, prev/next steps by one month and preserves day-of-month when possible. Calendar date control (date picker + Today action) sets the Calendar anchor date for every Calendar layout (`week`, `day`, `month`). Day's existing right-hand mini month stays for now.
- **URL:** With `view=calendar`, persist Calendar layout (e.g. `layout=month`) alongside `date`.
- **Data:** Calendar (and Grid) load via the core-api Booking range query (core ADR 0007), not List `pages`. Delivery is phased: range query + wire Calendar/Grid first; then Month UI and date control.

## Consequences

- Month is a navigation-plus-preview surface; Day remains the primary dense day chrome; Grid remains the overflow occupancy map.
- ADR 0001 still owns week/day lane packing; this ADR owns Month chrome and the date control.
- Do not restore Today-only toolbar jump, remainder popovers for cell overflow, status/room-colored dots as the v1 Month rule, or Calendar layout that exists only in ephemeral component state without superseding this ADR.
