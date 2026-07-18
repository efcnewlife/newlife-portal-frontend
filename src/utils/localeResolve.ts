import type { LocaleItem } from "@/api/services/localeService";
import type { AppLocale } from "@/i18n";
import { build_locale_code, normalize_locale_code } from "@/i18n";

export const APP_LOCALE_OPTIONS: AppLocale[] = ["en", "zh-TW", "zh-CN"];

export const locale_item_to_code = (locale: LocaleItem): string => {
  return build_locale_code(locale.languageCode, locale.scriptCode, locale.regionCode);
};

export const resolve_locale_id_for_app_language = (
  items: LocaleItem[],
  app_locale: AppLocale,
): string | undefined => {
  const active_items = items.filter((item) => item.isActive);
  const matched = active_items.find((item) => normalize_locale_code(locale_item_to_code(item)) === app_locale);
  return matched?.id;
};

export const get_default_locale_id = (items: LocaleItem[]): string | undefined => {
  return items.find((item) => item.isActive && item.isDefault)?.id;
};

export const resolve_locale_id_for_language_code = (
  items: LocaleItem[],
  language_code: string,
): string | undefined => {
  const app_locale = normalize_locale_code(language_code);
  if (!app_locale) {
    return get_default_locale_id(items);
  }
  return resolve_locale_id_for_app_language(items, app_locale) ?? get_default_locale_id(items);
};
