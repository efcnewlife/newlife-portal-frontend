# Portal Frontend Template

`tmpl-portal-frontend` is a React + TypeScript admin template project. It keeps the core architecture (Auth, System RBAC, dynamic routing, and DataPage) while removing conference-specific business features, so you can copy it and start new projects quickly.

## Core Capabilities

- Auth flow with token-based permission parsing
- System modules (User / Role / Permission / Resource)
- Backend-driven menus with `component-registry` mapping
- Reusable DataPage CRUD architecture
- Demo DataPage (switchable mock service)

## Environment Variables

Create local settings first:

```bash
cp .env.example .env.local
```

Important flags:

- `VITE_USE_MOCK_AUTH=true`: Uses mock login/logout/me/refresh flow and does not call real auth APIs.
- `VITE_USE_MOCK_DEMO=true`: Demo page data is returned from `demoService` in-memory mocks.
- `VITE_SKIP_AUTH=true`: Developer shortcut mode that skips auth guarding directly (different from full mock auth flow).

## Start

```bash
pnpm install
pnpm run dev
```

Default URL: `http://localhost:5173`

## Project Structure (Template Highlights)

```text
src/
  api/
    config/            # API endpoints and request config
    services/          # Service layer (includes demo mock branch)
  components/
    DataPage/          # Reusable CRUD UI components
    Demo/              # Template demo pages
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

- i18n is initialized in `src/i18n/index.ts` using `react-i18next` with `lowerCaseLng: true` (locale codes are normalized, e.g. `zh-tw`).
- Add new translation keys to both locale files:
  - `src/i18n/locales/en/common.json` and `src/i18n/locales/zh-tw/common.json` for the default `translation` namespace.
  - `src/i18n/locales/en/language.json` and `src/i18n/locales/zh-tw/language.json` for language UI copy (namespace: `language`).
- Use dotted key names by domain and intent in `common.json` (for example: `common.search`, `auth.signIn`, `errors.network`).
- For the `language` namespace, use short keys (for example: `label`, `english`, `traditionalChinese`).
- In React components, use `useTranslation()` for the default namespace, or `useTranslation("language")` for language strings.
- In non-React modules (such as service/utils files), import `i18n` and use `i18n.t("your.key")` or `i18n.t("label", { ns: "language" })`.
