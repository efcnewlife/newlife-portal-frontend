# Newlife Portal

`newlife-portal-frontend` is the React + TypeScript admin frontend for Newlife Portal. It provides Auth, System RBAC, backend-driven menus with dynamic routing, and the reusable DataPage architecture.

## Core Capabilities

- Auth flow with token-based permission parsing
- System modules (User / Role / Permission / Resource)
- Backend-driven menus with `component-registry` mapping
- Reusable DataPage CRUD architecture
- Demo DataPage (switchable mock service)

## GitHub Packages (`@efcnewlife/newlife-ui`)

UI primitives are published as `@efcnewlife/newlife-ui`. This repo includes [`.npmrc`](./.npmrc) so the `@efcnewlife` scope uses GitHub Packages; authentication uses the **`NODE_AUTH_TOKEN`** environment variable.

**Local install:** create a GitHub PAT with `read:packages`, then:

```bash
export NODE_AUTH_TOKEN=ghp_xxxxxxxx
pnpm install
```

Add the same secret as **`PACKAGE_TOKEN`** (or reuse a name your org prefers) in GitHub Actions for CI so `pnpm install` can resolve the private package.

If the package version is not published yet, temporarily set the dependency to `"file:../newlife-ui"` in `package.json` (path relative to this repo), then switch back to `"^0.1.0"` after the first release.

## Environment Variables

Create local settings first:

```bash
cp .env.example .env.local
```

Important flags:

- `VITE_USE_MOCK_DEMO=true`: Demo page data is returned from `demoService` in-memory mocks.
- `VITE_SKIP_AUTH=true`: Developer shortcut mode that skips auth guarding and uses a placeholder token for API calls.

### Microsoft Entra ID (optional)

Set `VITE_AZURE_CLIENT_ID`, `VITE_AZURE_TENANT_ID`, and optional `VITE_AZURE_REDIRECT_URI` to enable "Sign in with Microsoft". Use the same SPA app registration client ID as `AZURE_APP_CLIENT_ID` on the Core API (and the same value Facility Booking uses — the API accepts one client ID per environment). See `.env.example` and the Core API README Microsoft Entra section.

### Sentry telemetry (optional)

The app runs normally without any Sentry settings. `src/main.tsx` initializes the client once from `TELEMETRY_CONFIG` (`src/config/env.ts`).

| Variable                                   | Purpose                                                                                                                      |
| ------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------- |
| `VITE_SENTRY_DSN`                          | Public project DSN. Empty → telemetry off.                                                                                   |
| `VITE_SENTRY_ENABLED`                      | `development`: export only when `true`. `staging` / `production`: export when unset or `true`; any other value turns it off. |
| `VITE_SENTRY_RELEASE_VERSION`              | Deployed builds only. `production`: `x.y.z`. `staging`: short commit SHA (7–12 lowercase hex).                               |
| `VITE_SENTRY_TRACES_SAMPLE_RATE`           | Optional `0..1`. Unset keeps tracing off. Set to trace page loads, navigation, and requests, connected to Core API.          |
| `VITE_SENTRY_REPLAYS_SESSION_SAMPLE_RATE`  | Optional `0..1`. Share of sessions recorded as masked Replay. Unset (with the next one unset) keeps Replay off.              |
| `VITE_SENTRY_REPLAYS_ON_ERROR_SAMPLE_RATE` | Optional `0..1`. Share of sessions whose last minute is kept and sent when an error occurs.                                  |

| Vite mode     | Environment | Release                                |
| ------------- | ----------- | -------------------------------------- |
| `development` | `dev`       | `newlife-portal-frontend@local`        |
| `staging`     | `stg`       | `newlife-portal-frontend@<short-sha>`  |
| `production`  | `prod`      | `newlife-portal-frontend@<x.y.z>`      |
| anything else | —           | telemetry off (includes Vitest `test`) |

A deployed build with a missing or mismatched release version stays off rather than reporting a placeholder release. A future deployment pipeline must pass the same release value to the SDK build and to any release / source-map upload.

What is sent when telemetry is on (no other options are required):

| Channel      | Source                                                         | Notes                                                                                                                                                  |
| ------------ | -------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Errors       | React root error hooks, `window.onerror`, unhandled rejections | Exception text is dropped; types and stack frames remain                                                                                               |
| API failures | `httpClient`                                                   | 5xx only, grouped by method + route + status; the SDK collapses consecutive identical failures. 4xx, timeouts, and offline errors do not create issues |
| Logs         | `console.warn` / `console.error`                               | Authored text only, never arguments. The API client's own failure log is not sent                                                                      |
| Breadcrumbs  | Console warn/error, clicks, navigation, fetch/XHR              | No query strings, fragments, selector attribute values, or console arguments                                                                           |
| User         | `AuthContext`                                                  | Internal Administrator ID only; cleared with breadcrumbs on logout and any unauthenticated transition                                                  |

Every channel passes through `src/telemetry/privacy.ts` before it leaves the browser. Bodies, credentials, tokens, names, email addresses, phone numbers, and remarks are excluded. Sessions, metrics, client reports, and Profiling are not part of this integration. Never commit a real DSN or any Sentry auth token.

#### Tracing and Replay (optional)

Off unless their sample rates are set; an invalid rate leaves that channel off. No sampling targets are prescribed; choose rates per environment. Use `1` only for local verification unless you choose otherwise.

| Channel | Enabled by                                 | Notes                                                                                                                                                                                        |
| ------- | ------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Tracing | `VITE_SENTRY_TRACES_SAMPLE_RATE`           | Page load, navigation, and request spans (SDK default streamed spans). Query strings, fragments, selector attribute values, and user attributes other than the internal ID are removed       |
| Replay  | either `VITE_SENTRY_REPLAYS_*_SAMPLE_RATE` | All text and inputs masked; images, SVG, and video blocked; `title`, `placeholder`, `aria-label`, `alt` masked; no network headers or bodies. Page and link URLs keep scheme, host, and path |

Trace propagation:

- Sentry-native `sentry-trace` and `baggage` headers, which Core API continues (`SENTRY_TRACES_SAMPLE_RATE` set there too). W3C `traceparent` is off (`propagateTraceparent: false`); no OpenTelemetry bridge in the browser.
- Headers go only to `${VITE_API_BASE_URL}/admin/api/v1…` (anchored match). MSAL, `/api/v1`, `/healthz`, file hosts, and other origins never receive them. Core API's CORS already allows any request header. `VITE_API_BASE_URL` must be an absolute URL; otherwise no request receives trace headers and browser traces stay unconnected.

Replay recordings are sent uncompressed: the SDK masks text but not `href` / `src`, so the transport rewrites those URLs (and the page URL rrweb records) before sending. A recording that cannot be read is dropped, not sent.

Logout or an account change ends the previous Administrator's trace and Replay; the next one starts fresh in the mode sampling chose at page load.

Local check: run Core API with `SENTRY_ENABLED=true SENTRY_TRACES_SAMPLE_RATE=1.0`, then the Portal with `VITE_SENTRY_ENABLED=true VITE_SENTRY_TRACES_SAMPLE_RATE=1 VITE_SENTRY_REPLAYS_SESSION_SAMPLE_RATE=1`. Point both DSNs at a local collector (or a dev Sentry project) and confirm a browser `http.client` span is the parent of Core's `http.server` transaction.

## Start

```bash
pnpm install
./scripts/install-git-hooks.sh   # once per clone; see AGENTS.md Branch names
pnpm run dev
```

Default URL: `http://localhost:5173`

## Project Structure

```text
src/
  api/
    config/            # API endpoints and request config
    services/          # Service layer (includes demo mock branch)
  components/
    DataPage/          # Reusable CRUD UI components
    Demo/              # Demo pages
  context/
    AuthContext.tsx
    MenuContext.tsx
  pages/
    AuthPages/
    System/
    Demo/
  routes/
    modules/
      auth.tsx
      dashboard.tsx
      demo.tsx
      System/
  utils/
    component-registry.tsx
    route-filter-manager.tsx
```

## Recommended Extension Steps

1. Add your business route modules under `src/routes/modules`.
2. Add resource-key-to-component mappings in `src/utils/component-registry.tsx`.
3. In backend resource/menu data, create keys that match the registry.
4. Add business services in `src/api/services`, and let pages call APIs only through services.

## i18n Contribution Guide

- i18n is initialized in `src/i18n/index.ts` using `react-i18next` with BCP 47 locale tags (`en`, `zh-TW`, `zh-CN`).
- Copy lives in **`common`**, **`auth`**, **`errors`**, **`system`**, and **`language`** namespaces (one JSON fragment per domain under `src/i18n/locales/<lng>/`; see `src/i18n/SYSTEM_I18N_MIGRATION.md`).
- In UI code use **`namespace:key`** (for example: `t("common:search")`, `t("system:user.page.title")`, `t("errors:network")`, `t("auth:signIn")`). Default namespace is **`common`**, so `t("cancel")` resolves inside `common` when no prefix is needed.
- For the `language` namespace, use short keys (for example: `label`, `english`) with `useTranslation("language")`, or pass `{ ns: "language" }` to `t`.
- In non-React modules, import `i18n` and use `i18n.t("errors:network")` etc., or `i18n.t("label", { ns: "language" })`.
- Keep **`en`** / **`zh-TW`** / **`zh-CN`** JSON fragments in sync manually (same keys/shape across locales). Runtime does not execute repo **`scripts`** for i18n.
