# System module i18n notes

## i18next namespaces

The app registers **`common`**, **`auth`**, **`errors`**, **`system`**, and **`language`** in [`src/i18n/index.ts`](index.ts). Default namespace is **`common`**.

- Use **`namespace:key`** in code, for example: `t("common:cancel")`, `t("system:user.page.title")`, `t("errors:network")`, `t("auth:signIn")`.
- The **language picker** keeps using `useTranslation("language")` and short keys (e.g. `tLanguage("label")`).

Each namespace is loaded from a separate JSON file per locale (`common.json` maps to the `common` namespace, etc.). Values are **nested objects** inside that file (**no extra wrapper key**).

| File (`locales/<lng>/`) | Namespace  |
| ----------------------- | ---------- |
| `common.json`           | `common`   |
| `auth.json`             | `auth`     |
| `errors.json`           | `errors`   |
| `system.json`           | `system`   |
| `language.json`         | `language` |

## Maintaining locales

Edit **`src/i18n/locales/en/*.json`**, **`zh-TW/*.json`**, and **`zh-CN/*.json`** directly. Keep the same nesting and keys across languages.

## Key prefix (conceptual)

Inside each namespace JSON, mirror the logical prefix without repeating the namespace segment in nesting (e.g. under **`system`** namespace root: `user`, `role`, `shared`, …).

### Do not translate

- API field keys, paths, codes, IDs, debugging class names
- Backend-returned data (except formatting)

## Validation

```bash
pnpm exec tsc -b --noEmit
```
