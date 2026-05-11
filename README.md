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

## Start

```bash
pnpm install
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
