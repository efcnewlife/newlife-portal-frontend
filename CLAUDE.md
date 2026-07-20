# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
pnpm install          # Install dependencies (requires NODE_AUTH_TOKEN for @efcnewlife scope)
pnpm run dev          # Start dev server at http://localhost:5173
pnpm run type-check   # TypeScript type checking (no emit)
pnpm run lint         # ESLint
pnpm run build        # Production build (tsc + vite)
pnpm run build:stg    # Staging build
pnpm run build:prod   # Production build (explicit)
```

No test runner is configured.

## GitHub Packages Setup

`@efcnewlife/newlife-ui` is hosted on GitHub Packages. Install requires a GitHub PAT with `read:packages`:

```bash
export NODE_AUTH_TOKEN=ghp_xxxxxxxx
pnpm install
```

For local development of `newlife-ui`, temporarily set `"@efcnewlife/newlife-ui": "file:../newlife-ui"` in `package.json`.

## Environment Variables

Copy `.envrc.example` to `.env.local`. Key flags:

- `VITE_API_BASE_URL` — backend API base (default: `http://127.0.0.1:8000`)
- `VITE_SKIP_AUTH=true` — bypass auth guard; uses placeholder token for API calls (dev only)
- `VITE_SHOW_DEV_LOGIN=true` — show email/password login on sign-in page (dev only)
- `VITE_USE_MOCK_DEMO=true` — Demo page uses in-memory mock data instead of API
- `VITE_AZURE_CLIENT_ID` / `VITE_AZURE_TENANT_ID` / `VITE_AZURE_REDIRECT_URI` — enable "Sign in with Microsoft" button

All env vars are centralized in [src/config/env.ts](src/config/env.ts); never use `import.meta.env` directly elsewhere.

## Architecture

### Backend-Driven Menus & Dynamic Routing

The app uses a backend-driven menu system. After login, `MenuContext` fetches the user's accessible menus from the API (`resourceService.getAdminMenus()`). `RouteFilterManager` (`src/utils/route-filter-manager.tsx`) converts these menu items into React Router routes at runtime by mapping backend `key` strings to page components via the **component registry** (`src/utils/component-registry.tsx`).

**To add a new page:**
1. Create the page component under `src/pages/<Domain>/`.
2. Add a route module in `src/routes/modules/<Domain>/`.
3. Register the module in `src/routes/index.ts` → `initializeRoutes()`.
4. Add the backend resource key → component mapping in `src/utils/component-registry.tsx`.
5. Create the matching resource/menu entry in the backend with the same key string.

### Auth Flow

`AuthContext` (`src/context/AuthContext.tsx`) manages auth state via `useReducer`. It supports:
- Email/password login (`authService.login`)
- Microsoft Entra ID login via MSAL popup (`loginWithMicrosoft`)
- Token refresh via `httpClient` interceptor (one automatic 401 retry)

Permissions are parsed directly from the JWT token on each check (never trusted from `localStorage`). Use `usePermissions()` from `AuthContext` to check permissions/roles in components.

### DataPage Architecture

`src/components/DataPage/` is a reusable CRUD UI system. Most management pages (`UserManagement`, `RoleManagement`, etc.) use `DataPage.tsx` as their shell with composable sub-components (`DataTable`, `DataTableToolbar`, `SearchPopoverContent`, `DeleteForm`, `RestoreForm`). New business pages should follow the same pattern.

### API Service Layer

All API calls go through `src/api/services/`. Services call `httpClient` (Axios instance with auth header injection and token refresh). Pages must not call `httpClient` directly — always go through a service. The `demoService.ts` uses in-memory mocks when `IS_MOCK_DEMO` is true.

### i18n

- Namespaces: `common`, `auth`, `errors`, `system`, `facility`, `language`
- Locale files: `src/i18n/locales/<en|zh-TW|zh-CN>/<namespace>.json`
- Always use `namespace:key` syntax: `t("system:user.page.title")`, `t("errors:network")`
- Default namespace is `common` — `t("cancel")` resolves to `common.cancel`
- Keep all three locale JSON files in sync manually when adding keys
- In non-React modules, import `i18n` from `@/i18n` and use `i18n.t(...)`

### Path Alias

`@` maps to `src/`. Use `@/components/...`, `@/api/...`, etc. throughout.
