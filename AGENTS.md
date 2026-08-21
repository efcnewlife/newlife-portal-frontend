# AGENTS.md — AI Entry Guide for newlife-portal-frontend

This document helps AI agents quickly understand the **Newlife Portal** admin SPA: architecture, conventions, and where to make changes. For setup narrative, see [`README.md`](README.md). For enforceable coding rules, see [`.cursor/rules/standard.mdc`](.cursor/rules/standard.mdc). For domain language, see [`CONTEXT.md`](CONTEXT.md).

---

## 1. What This Project Is

| Item                | Value                                                                                                               |
| ------------------- | ------------------------------------------------------------------------------------------------------------------- |
| **Purpose**         | Admin SPA for Newlife Core — RBAC, backend-driven menus, facility booking admin, ministry/org/member, content files |
| **Package**         | `newlife-portal-frontend` `0.1.0` (`private`)                                                                       |
| **Framework**       | React 19 + Vite 6 + TypeScript                                                                                      |
| **Styling**         | Tailwind CSS v4 (CSS-first `@theme` in `src/index.css`); host owns tokens                                           |
| **UI lib**          | `@efcnewlife/newlife-ui` (GitHub Packages)                                                                          |
| **Router**          | React Router v7 (`react-router`) with `RouterProvider`                                                              |
| **HTTP**            | Axios via `httpClient`; admin API prefix `/admin/api/v1`                                                            |
| **Auth**            | JWT (email/password + Microsoft Entra ID via MSAL popup)                                                            |
| **i18n**            | `i18next` + `react-i18next` (`en`, `zh-TW`, `zh-CN`)                                                                |
| **Dates**           | `dayjs` (UTC + timezone plugins)                                                                                    |
| **Package manager** | pnpm only (`.npmrc`, `pnpm-lock.yaml`)                                                                              |
| **Tests**           | Vitest (`src/**/*.test.ts`, Node environment)                                                                       |

### Related repositories

| Repo                        | Role                                                               |
| --------------------------- | ------------------------------------------------------------------ |
| `newlife-core-api`          | Backend; this app consumes `/admin/api/v1/*`                       |
| `newlife-ui`                | Shared React component library                                     |
| `facility-booking-frontend` | Member-facing booking SPA (consumes `/api/v1`, not this admin app) |
| `newlife-docs`              | Product / process documentation                                    |

---

## 2. Quick Commands

```bash
pnpm install              # requires NODE_AUTH_TOKEN (GitHub Packages)
./scripts/install-git-hooks.sh   # once per clone
pnpm run dev              # http://localhost:5173 (strictPort — fails if taken)
pnpm run type-check       # tsc -b --noEmit (required in CI)
pnpm run test             # vitest run
pnpm run test:watch       # vitest
pnpm run lint             # eslint . (not required for agent checks; commit hook runs eslint --fix on staged files)
pnpm run format           # prettier --write .
pnpm run format:check     # prettier --check .
pnpm run build            # tsc -b && vite build
pnpm run build:stg        # --mode staging
pnpm run build:prod       # --mode production
./scripts/check-branch-name.test.sh
./scripts/format-staged.test.sh
```

CI (`.github/workflows/ci.yml`) runs `pnpm install --frozen-lockfile` and **`pnpm run type-check`** on PRs/pushes to `main` and `develop`. Add `format:check` in the follow-up full-tree Prettier apply PR. It does not run `test` or `lint`. PRs also run `.github/workflows/branch-name.yml` (`Branch name` check).

### Branch names

Topic branches: `{type}/{issue-number}-{short-description}` (types: `feat` `fix` `hotfix` `refactor` `perf` `test` `docs` `chore` `build` `ci`). Exceptions: `release/x.y.z`, `spike/{short-description}`, plus `main` / `develop`. Local: `.githooks/pre-push` after install. Emergency: `git push --no-verify`. Consider marking `Branch name` required in GitHub branch protection.

### Commit format hook

After `./scripts/install-git-hooks.sh`, `.githooks/pre-commit` formats **staged** files via Prettier, runs `eslint --fix` on staged TS/JS (remaining **errors** fail the commit; warnings do not), and re-stages. Emergency: `git commit --no-verify`. See ADR 0005.

Copy `.env.example` → `.env.local` before running locally. Copy `.envrc.example` → `.envrc` (or export `NODE_AUTH_TOKEN`) so pnpm can install `@efcnewlife/newlife-ui`.

For local `newlife-ui` development, temporarily set `"@efcnewlife/newlife-ui": "file:../newlife-ui"` in `package.json`.

---

## 3. Repository Layout

```
/
├── src/
│   ├── App.tsx, main.tsx, index.css
│   ├── api/                # config/, services/, hooks/, mock/
│   ├── auth/               # MSAL instance
│   ├── components/         # DataPage/, calendar/, common/, translation/, …
│   ├── config/env.ts       # only place that reads import.meta.env
│   ├── const/              # Resource / Verb enums
│   ├── context/            # Auth, Menu, Notification, Theme, Sidebar, PageHeader
│   ├── hooks/
│   ├── i18n/               # init + locales/{en,zh-TW,zh-CN}/
│   ├── layout/             # AppLayout, AppHeader, AppSidebar
│   ├── pages/              # System/, Facility/, Ministry/, Org/, Member/, Content/, AuthPages/, Demo/
│   ├── routes/             # index.ts + modules/
│   ├── types/
│   └── utils/              # route-registry, route-filter-manager, component-registry, jwt, cn, …
├── docs/agents/            # Matt Pocock skill config
├── docs/adr/               # architectural decisions
├── CONTEXT.md              # ubiquitous language
├── .cursor/rules/standard.mdc
└── AGENTS.md
```

Path alias: `@` → `src/` (`vite.config.ts` and tsconfig). Keep them in sync.

---

## 4. App Entry & Routing

### Bootstrap

```
main.tsx
  → ThemeProvider → AppWrapper → App
App
  → AuthProvider → MenuProvider → NotificationProvider
  → AppContent (waits for auth + menus)
  → routeFilterManager.initializeRoutes(...) → RouterProvider
```

Static module registration: `initializeRoutes()` in `src/routes/index.ts` is invoked at module load from `src/layout/AppSidebar.tsx`.

### Registration chain

| Piece          | Path                                 | Role                                                                              |
| -------------- | ------------------------------------ | --------------------------------------------------------------------------------- |
| Module routes  | `src/routes/modules/`                | Declarative `AppRoute` / `ModuleRoute`                                            |
| Registry       | `src/utils/route-registry.ts`        | Holds registered modules                                                          |
| Filter manager | `src/utils/route-filter-manager.tsx` | Merges public routes + backend menus; builds the browser router under `AppLayout` |
| Component map  | `src/utils/component-registry.tsx`   | Backend resource `key` → React component                                          |

Routes are **not** all defined in `App.tsx`. Do not invent a parallel routing system.

### Route modules (`initializeRoutes`)

| Export               | File                    | Notes                                                                              |
| -------------------- | ----------------------- | ---------------------------------------------------------------------------------- |
| `authRoutes`         | `modules/auth.tsx`      | Public: `/signin`, `/forgot-password`, `/reset-password`, `/two-step-verification` |
| `dashboardRoutes`    | `modules/dashboard.tsx` | `/`, `/profile`                                                                    |
| `errorRoutes`        | `modules/errors.tsx`    | Error pages                                                                        |
| `systemMenuRoutes`   | `modules/System/`       | `/system/*`                                                                        |
| `facilityMenuRoutes` | `modules/Facility/`     | `/facility/*`                                                                      |
| `ministryMenuRoutes` | `modules/Ministry/`     | `/ministry/*`                                                                      |
| `orgMenuRoutes`      | `modules/Org/`          | `/org/*` (includes member persons)                                                 |
| `contentMenuRoutes`  | `modules/Content/`      | `/content/files`                                                                   |
| `demoRoutes`         | `modules/demo.tsx`      | **Only if `IS_DEV`**: `/demo/data-page`                                            |

Route paths use kebab-case (e.g. `/facility/room-slot-templates`).

### Backend-driven menus

1. After login, `MenuContext` (`src/context/MenuContext.tsx`) calls `resourceService.getAdminMenus()` → `GET /admin/api/v1/resource/menus`.
2. Menus refetch on i18n `languageChanged`.
3. `RouteFilterManager` maps each menu item with a `path` to a route; `element = resolveRouteElementByKey(it.key)`.
4. Dynamic routes merge with static protected routes; **dedupe by path prefers the dynamic (menu) route**.
5. Sidebar nav is built from menus (`useNavigationItems`), not from static modules alone.

### Component-registry keys

Unknown keys render `Blank`. Keep backend resource `key` strings identical to these:

| Key                             | Page                         |
| ------------------------------- | ---------------------------- |
| `DASHBOARD`                     | `Dashboard`                  |
| `SYSTEM_USER`                   | `UserManagement`             |
| `SYSTEM_RESOURCE`               | `ResourceManagement`         |
| `SYSTEM_PERMISSION`             | `PermissionManagement`       |
| `SYSTEM_ROLE`                   | `RoleManagement`             |
| `SYSTEM_SETTING`                | `SettingManagement`          |
| `SYSTEM_FCM_DEVICE`             | `Blank` (placeholder)        |
| `SYSTEM_LOG`                    | `Blank` (placeholder)        |
| `FACILITY_ROOM`                 | `RoomManagement`             |
| `FACILITY_ROOM_SLOT_TEMPLATE`   | `RoomSlotTemplateManagement` |
| `FACILITY_ROOM_BLACKOUT`        | `RoomBlackoutManagement`     |
| `FACILITY_RENTAL_RATE`          | `RentalRateManagement`       |
| `FACILITY_BOOKING`              | `BookingManagement`          |
| `FACILITY_BOOKING_OVERRIDE_LOG` | `OverrideLogManagement`      |
| `MINISTRY_MINISTRY`             | `MinistryManagement`         |
| `MINISTRY_MEMBER`               | `MinistryMemberManagement`   |
| `MINISTRY_APPROVAL`             | `MinistryApprovalManagement` |
| `ORG_POSITION`                  | `PositionManagement`         |
| `MEMBER_PERSON`                 | `PersonManagement`           |
| `CONTENT_FILE`                  | `FileManagement`             |

---

## 5. Auth & Authorization

| Concern            | Path                                                                                                     |
| ------------------ | -------------------------------------------------------------------------------------------------------- |
| Context            | `src/context/AuthContext.tsx` — `login`, `loginWithMicrosoft`, `logout`, `refreshUser`, `usePermissions` |
| Token / auth API   | `src/api/services/authService.ts`                                                                        |
| JWT scopes / roles | `src/utils/jwt.ts` (`getScopesFromToken`, `hasPermissionInScopes`; wildcard `resource:*`)                |
| MSAL               | `src/auth/msalInstance.ts`                                                                               |

### Login options

| Method          | Notes                                                                                                      |
| --------------- | ---------------------------------------------------------------------------------------------------------- |
| Email/password  | `POST /admin/api/v1/auth/login` — shown when `IS_SHOW_DEV_LOGIN` (`VITE_SHOW_DEV_LOGIN`, development only) |
| Microsoft Entra | MSAL popup → `POST /admin/api/v1/auth/login/microsoft` — button when `IS_MICROSOFT_LOGIN_ENABLED`          |
| Skip auth       | `IS_SKIP_AUTH` = `IS_DEV && VITE_SKIP_AUTH`; restores local user/token without `/auth/me`                  |

### Token refresh

`httpClient` on 401: one de-duplicated refresh via `POST /admin/api/v1/auth/refresh` using `refresh_token` from **localStorage** (remember-me), then retry once. Login / Microsoft / refresh URLs are excluded.

### Permissions

Parsed from the JWT `scope` claim on each `usePermissions().hasPermission()` check — **never** trusted from `localStorage` permission lists. Superadmin is role `"superadmin"`. DataPage toolbar/row actions use `Resource` + `Verb` from `src/const/enums.ts` (e.g. `Resource.FacilityBooking` = `"facility:booking"`).

---

## 6. API Layer

All network access lives under `src/api`. Pages call **services**, not `httpClient` (exception: established DataPage internals). Do not hardcode URL strings outside `src/api/config/index.ts`.

### `httpClient` (`src/api/services/httpClient.ts`)

- **Accept-Language** from `i18n.language`.
- **Authorization** Bearer: `sessionStorage` `auth_token` first, else `localStorage`.
- **Outbound** bodies and params: `deep_keys_to_snake_case` (not FormData). Backend request contract is snake_case; API JSON responses are camelCase — services/types handle response shapes (no auto camelCase).
- **Retry** network / timeout / 5xx up to 3 times; not 4xx.
- **401** refresh + one retry (except login/refresh).
- Errors → `ApiError`; backend `detail` preferred; network/timeout notify via `notificationManager`.

### Prefix

Real admin APIs use **`ADMIN_API_PREFIX = "/admin/api/v1"`**. This app does **not** call the member `/api/v1` surface. A few legacy paths without the prefix still exist (`PERMISSIONS.CHECK`, `RESOURCES.TREE`) — do not copy that pattern.

### Services (`src/api/services/`)

`authService`, `httpClient`, `userService`, `roleService`, `permissionService`, `resourceService`, `verbService`, `localeService`, `settingService`, `facilityService`, `ministryService`, `ministryCatalogService`, `orgService`, `fileService`, `demoService`.

### Mock flags (development only)

| Flag           | Behavior                                                                     |
| -------------- | ---------------------------------------------------------------------------- |
| `IS_MOCK_API`  | `IS_DEV && VITE_USE_MOCK_API` — stubs in most services via `src/api/mock/`   |
| `IS_MOCK_DEMO` | `IS_DEV && (VITE_USE_MOCK_DEMO \|\| USE_MOCK_API)` — `demoService` in-memory |

`fileService` has no `IS_MOCK_API` branch. Never use `import.meta.env` outside `src/config/env.ts`.

---

## 7. DataPage Architecture

Reusable admin list CRUD lives under `src/components/DataPage/` (`DataPage`, `DataTable`, `DataTableToolbar`, `SearchPopoverContent`, `DeleteForm`, `RestoreForm`). Page chrome is `src/components/common/ManagementPage.tsx`.

**File pattern:**

```text
*Management.tsx   → ManagementPage title/description shell
*DataPage.tsx     → columns, pagination, sorting, toolbar, service calls
*DataForm.tsx     → create/edit form
*DeleteForm.tsx / *RestoreForm.tsx / … → sub-flows
```

Pass `resource` (a `Resource` enum value) so toolbar/row actions check JWT scopes. For multilingual fields, use `TranslationTabsForm` and helpers in `src/utils/translationForm.ts`.

Do not reimplement Table/Modal/Input when `@efcnewlife/newlife-ui` already provides them. **DataTable** in this host is a composite on top of the library Table — see `CONTEXT.md`.

---

## 8. Pages / Bounded Contexts

| Domain       | `src/pages/`    | Features                                                                                                                   |
| ------------ | --------------- | -------------------------------------------------------------------------------------------------------------------------- |
| **System**   | `System/`       | User, Role, Permission, Resource, Setting                                                                                  |
| **Facility** | `Facility/`     | Room, RoomSlotTemplate, RoomBlackout, RentalRate (+ RentalRateTemplate panel), Booking (grid/calendar/drawer), OverrideLog |
| **Ministry** | `Ministry/`     | Ministry, MinistryMember, Approval                                                                                         |
| **Org**      | `Org/Position`  | Positions                                                                                                                  |
| **Member**   | `Member/Person` | Persons (routed under `/org/members`)                                                                                      |
| **Content**  | `Content/File`  | File management                                                                                                            |
| **Auth**     | `AuthPages/`    | SignIn, Forgot/Reset Password, TwoStepVerification                                                                         |
| **Demo**     | `Demo/`         | Dev DataPage demo (`IS_DEV` only)                                                                                          |
| **Other**    |                 | `Dashboard`, `Blank`, `UserProfile`, `OtherPage/NotFound`                                                                  |

Placeholders: System FCM devices and logs map to `Blank`.

---

## 9. i18n

| Item       | Value                                                                          |
| ---------- | ------------------------------------------------------------------------------ |
| Init       | `src/i18n/index.ts`                                                            |
| Locales    | `en`, `zh-TW`, `zh-CN`                                                         |
| Storage    | `localStorage` key `app_locale`                                                |
| Default NS | `common`                                                                       |
| Switch API | `change_app_language` (do not call `i18n.changeLanguage` directly in app code) |

**Namespaces:** `common`, `auth`, `errors`, `system`, `language`, `facility`, `org`, `member`, `ministry`, `content`, `calendar`.

JSON lives at `src/i18n/locales/<lng>/<namespace>.json`. Keep the same keys in all three locales. New namespaces must be imported, added to `resources`, and listed in `ns` in `src/i18n/index.ts`.

In UI: `t("facility:room.page.title")`. In non-React modules: `import i18n from "@/i18n"` then `i18n.t(...)`. Default copy in components is English; user-facing strings go through i18n.

---

## 10. Styling

- `src/index.css`: Tailwind v4, `@import "@efcnewlife/newlife-ui/theme/required-roles.css"`, `@source "../node_modules/@efcnewlife/newlife-ui/dist"`, host `@theme` (Outfit font, brand/gray scales).
- Dark mode: `@custom-variant dark` + `ThemeContext` (`.dark` on `<html>`).
- Merge class names with `cn` from `src/utils/index.ts` (`clsx` + `tailwind-merge`). Do not concatenate Tailwind strings by hand.
- Icons: `react-icons`, prefer the **`md`** set.
- Prefer newlife-ui primitives (`Button`, `Input`, `Select`, `Modal`, `ModalForm`, …).

---

## 11. Calendar

Host calendar under `src/components/calendar/` (`Calendar`, `DayView`, `WeekView`, `MonthView`, `EventBlock`, lane packing). Used by Facility Booking (`BookingCalendar.tsx` / `BookingDataPage`).

Read `CONTEXT.md` and `docs/adr/0001-calendar-concurrent-booking-lanes.md` before changing layout, collision packing, or density overflow. Month view exists in the component but is unused by the booking calendar (per ADR).

Unit tests: `packDayEventLanes.test.ts`, `formatEventTime.test.ts`.

---

## 12. Adding a Page (Checklist)

Use an existing System or Facility CRUD page as the reference.

1. Page under `src/pages/<Domain>/` (`*Management` + `*DataPage` + forms).
2. Static routes in `src/routes/modules/<Domain>/` (kebab-case paths).
3. Export the module and register it in `src/routes/index.ts` → `initializeRoutes()`.
4. Map the backend menu `key` in `src/utils/component-registry.tsx`.
5. Create the matching resource/menu in **newlife-core-api** with the **same key** and path.
6. Endpoints in `src/api/config/index.ts`; wrap calls in `src/api/services/`.
7. i18n keys in `en` / `zh-TW` / `zh-CN` (register a new namespace in `i18n/index.ts` if needed).
8. Permission strings via `Resource` / `Verb` in `src/const/enums.ts` for DataPage `resource` / toolbar.

---

## 13. Naming Conventions

| Kind                                             | Convention              | Example                                      |
| ------------------------------------------------ | ----------------------- | -------------------------------------------- |
| Variables, functions                             | camelCase               | `isAuthenticated`                            |
| Components / page files                          | PascalCase              | `RoomManagement.tsx`                         |
| Domain dirs under `pages/` and `routes/modules/` | PascalCase              | `Facility/`, `System/`                       |
| Utils / config files                             | kebab-case or camelCase | `route-filter-manager.tsx`, `caseConvert.ts` |
| Constants, env vars                              | UPPER_SNAKE_CASE        | `VITE_API_BASE_URL`                          |
| Route paths                                      | kebab-case              | `/facility/room-slot-templates`              |
| Comments / default copy                          | English                 | User strings via i18n                        |

Some newer helpers use snake_case (`change_app_language`, `normalize_locale_code`, `remember_me`). Match the local file's existing style.

Files that use HTML / `ReactNode` / `JSX.Element` must use `.tsx`. Prefer arrow functions for components and hooks.

---

## 14. Testing

Vitest is configured in `vite.config.ts` (`environment: "node"`, `include: ["src/**/*.test.ts"]`).

```bash
pnpm run test
pnpm run test:watch
```

| Location                                                   | Role                            |
| ---------------------------------------------------------- | ------------------------------- |
| `src/components/calendar/*.test.ts`                        | Lane packing, event time format |
| `src/utils/dateUtil.test.ts`, `dayjsApi.test.ts`           | Date helpers                    |
| `src/components/DataPage/getDataTableRowClassName.test.ts` | Row class names                 |
| `src/pages/Facility/Booking/bookingSaveError.test.ts`      | Booking save error mapping      |

No Testing Library / DOM suite. Co-locate `*.test.ts` next to the unit under test. CI does not run vitest yet — still run tests locally for calendar/utils/booking logic.

---

## 15. Environment Variables

Centralized in `src/config/env.ts`. Never use `import.meta.env` elsewhere.

| Variable                                              | Role                                  |
| ----------------------------------------------------- | ------------------------------------- |
| `VITE_API_BASE_URL`                                   | Default `http://127.0.0.1:8000`       |
| `VITE_API_TIMEOUT`                                    | Default `90000`                       |
| `VITE_SKIP_AUTH`                                      | Dev skip auth                         |
| `VITE_SHOW_DEV_LOGIN`                                 | Dev email/password on sign-in         |
| `VITE_USE_MOCK_API`                                   | Dev service stubs                     |
| `VITE_USE_MOCK_DEMO`                                  | Demo page mocks                       |
| `VITE_AZURE_CLIENT_ID` / `TENANT_ID` / `REDIRECT_URI` | MSAL                                  |
| `VITE_APP_NAME` / `TITLE` / `VERSION`                 | Branding                              |
| `VITE_ENABLE_DEBUG` / `VITE_LOG_LEVEL`                | Dev tooling                           |
| `NODE_AUTH_TOKEN`                                     | pnpm GitHub Packages (not a Vite var) |

Derived flags: `IS_DEV`, `IS_STAGING`, `IS_PROD`, `IS_SKIP_AUTH`, `IS_SHOW_DEV_LOGIN`, `IS_MOCK_API`, `IS_MOCK_DEMO`, `IS_MICROSOFT_LOGIN_ENABLED`.

---

## 16. Do NOT (Agent Guardrails)

| Action                                                      | Reason                                                   |
| ----------------------------------------------------------- | -------------------------------------------------------- |
| Use `import.meta.env` outside `src/config/env.ts`           | Env is centralized                                       |
| Hardcode API paths outside `src/api/config`                 | Contract lives in one place                              |
| Call `httpClient` from pages                                | Go through services                                      |
| Reimplement newlife-ui controls                             | Host consumes the library                                |
| Invent a second routing system                              | Modules + registry + filter manager + component-registry |
| Trust permissions from `localStorage`                       | Parse JWT scopes                                         |
| Call member `/api/v1` from this app                         | Admin prefix only                                        |
| Skip `component-registry` when adding a backend-driven page | Menu key will render `Blank`                             |
| Check/format with eslint as a required agent step           | Project standard                                         |
| `git commit` / `push` / `merge` unless the user asks        | Automation policy                                        |

---

## 17. Key Files Index

| File                                                 | Why read it                            |
| ---------------------------------------------------- | -------------------------------------- |
| `README.md`                                          | Install, GitHub Packages, flags        |
| `.cursor/rules/standard.mdc`                         | Naming, DataPage, routing, i18n rules  |
| `CONTEXT.md`                                         | Domain language (calendar, DataTable)  |
| `src/config/env.ts`                                  | All env flags                          |
| `src/App.tsx`                                        | Provider + router bootstrap            |
| `src/routes/index.ts`                                | Module registration                    |
| `src/utils/route-filter-manager.tsx`                 | Menu → routes                          |
| `src/utils/component-registry.tsx`                   | Backend key → page                     |
| `src/context/AuthContext.tsx`                        | Auth + `usePermissions`                |
| `src/context/MenuContext.tsx`                        | Admin menus                            |
| `src/api/config/index.ts`                            | Endpoint map                           |
| `src/api/services/httpClient.ts`                     | Interceptors, refresh, case conversion |
| `src/components/DataPage/DataPage.tsx`               | CRUD shell                             |
| `src/i18n/index.ts`                                  | Locales and namespaces                 |
| `src/const/enums.ts`                                 | `Resource`, `Verb`                     |
| `docs/adr/0001-calendar-concurrent-booking-lanes.md` | Booking calendar layout                |

---

## 18. Mental Model for AI Agents

When given a task, first classify it:

| Task type                     | Start here                                                                                            |
| ----------------------------- | ----------------------------------------------------------------------------------------------------- |
| New admin list page           | Mirror a System/Facility `*Management`/`*DataPage` → routes module → component-registry → backend key |
| Menu shows Blank / wrong page | Menu API `key` vs `component-registry`                                                                |
| Toolbar hidden / 403          | JWT scopes + `Resource`/`Verb` + DataPage `resource`                                                  |
| API contract / 401 loop       | `httpClient`, `authService`, `API_ENDPOINTS`                                                          |
| Auth / MSAL                   | `AuthContext`, `msalInstance`, Azure env flags                                                        |
| Copy / locale                 | `src/i18n/locales/*` + `i18n/index.ts`                                                                |
| Booking calendar layout       | `components/calendar/*` + ADR 0001 + `CONTEXT.md`                                                     |
| Styling / dark mode           | `index.css` + newlife-ui + `ThemeContext`                                                             |
| Mock vs real API              | `IS_MOCK_API` / `IS_MOCK_DEMO` + service branches                                                     |
| Unit logic                    | Co-located `*.test.ts` under `src/`                                                                   |

**Prefer minimal diffs.** Match existing patterns in the same domain before introducing new abstractions.

---

## Agent skills

### Issue tracker

Issues live in this repo's GitHub Issues (via `gh`). See `docs/agents/issue-tracker.md`.

### Triage labels

Default triage roles map 1:1 to label strings (`needs-triage`, `needs-info`, `ready-for-agent`, `ready-for-human`, `wontfix`). See `docs/agents/triage-labels.md`.

### Domain docs

Single-context: root `CONTEXT.md` + `docs/adr/`. See `docs/agents/domain.md`.
