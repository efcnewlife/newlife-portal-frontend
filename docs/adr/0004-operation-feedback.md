# Operation feedback is toast-only; never raw backend detail

Admin CRUD and load outcomes use **Operation feedback**: `@efcnewlife/newlife-ui` notification toasts (`success` | `error`, rarely `warning`). `window.alert` is not an outcome channel. Every successful mutation shows a success toast. Form validation stays on field errors; login failures stay as Auth form error (inline only). Transport failure (network/timeout) is toasted once by `httpClient`; callers must not notify again for the same failure.

HTTP business failures go through shared helpers `notifySuccess` / `notifyApiError`. Toast chrome is `top-right`, success 3s / error 5s. Failure **title** is host i18n; **description** is `error_code` → i18n when a mapper exists, otherwise a generic i18n fallback — never raw `detail` / `ApiError.message` (often English, sometimes non-string 422 shapes). `info` is not part of the CRUD helper vocabulary.

Stable `error_code` coverage on Core API is a **parallel** track (separate issue/repo), not a gate on shipping the Portal channel unification. Booking’s existing `error_code` mapper remains the pattern.

## Considered Options

- **Keep `alert` for Facility/Ministry; toast only for System** — rejected: operators cannot form one expectation.
- **Show backend `detail` as description** — rejected: locale mismatch and unsafe/opaque strings; prefer codes + i18n.
- **httpClient toasts every HTTP error** — rejected: pages need domain mappers and “swallow” paths; helper owns HTTP outcome toasts.
- **Silent success (close modal + refresh only)** — rejected: success must be as visible as failure.
- **Map HTTP 4xx to `warning`** — rejected: for admin mutations, rejection is still failure (`error`).

## Consequences

- Portal must sweep `alert(` outcome paths and align User/Permission/auth with the helpers.
- Core API error-code expansion can land later without changing toast chrome or helper signatures.
- File upload row status, confirmation Modals, and Demo-only `info` remain outside this ADR’s CRUD rules.
