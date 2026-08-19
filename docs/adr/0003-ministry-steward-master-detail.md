# Ministry Stewards page is master–detail, not a DataTable

`/ministry/members` was a DataTable toolbar plus a Search popover that only picked a Ministry, then the same replace-roster editor already used on the Ministry form. Operators could not see data on landing, could not search by Steward, and had two writable copies of the same Steward roster.

The page is a **master–detail** index of Ministries: left rail is the Steward directory (all non-deleted Ministries, filterable by status and by Steward directory query); right pane is the Steward roster for the selected Ministry, saved with the existing replace-members API. Selection is `?ministry=<id>`. Unsaved roster edits block changing selection.

After create, roster writes happen only here. The Ministry **edit** form shows a read-only steward summary and links to this page with that query. The Ministry **create** form still collects the roster so submit rules (exactly one primary, at least one secondary) can be met in one sitting.

This page is not a DataTable of membership rows, not Member Person (`/org/members`), and not the facility-booking "priority member" identity.

## Considered Options

- **Membership-row table (person × Ministry)** — rejected: empty rosters disappear; write grain is still one roster.
- **Ministry cards or a contact-style grouped list as the only chrome** — deferred; master–detail keeps directory and replace on one screen.
- **Keep both the edit form and this page as writable editors** — rejected: two replace calls overwrite each other.
- **Load steward names on the directory payload** — rejected in Core ADR 0004; the rail shows Ministry identity; the roster loads on select.

## Consequences

- Landing no longer depends on a Search popover as a gate.
- The Portal must not use `GET` ministries `list` (active-only) for the left rail.
- Core Steward directory query (Core ADR 0004) is required for person search; this ADR does not change that HTTP contract.
