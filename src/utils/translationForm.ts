import type { LocaleItem } from "@/api/services/localeService";
import type { AdminTranslationInput, AdminTranslationItem } from "@/types/translation";
import { get_default_locale_id } from "@/utils/localeResolve";

export interface TranslationFields {
  name?: string;
  description?: string;
  remark?: string;
  scheduleNote?: string;
}

export type TranslationMap = Record<string, TranslationFields>;

export interface LegacyTranslationFallback {
  name?: string;
  description?: string;
  remark?: string;
  scheduleNote?: string;
}

export const createEmptyTranslationMap = (locales: LocaleItem[]): TranslationMap => {
  return locales.reduce<TranslationMap>((acc, locale) => {
    acc[locale.id] = { name: "", description: "", remark: "", scheduleNote: "" };
    return acc;
  }, {});
};

export const hydrateTranslationMap = (
  locales: LocaleItem[],
  existingTranslations?: AdminTranslationItem[],
  legacyFallback?: LegacyTranslationFallback,
): TranslationMap => {
  const map = createEmptyTranslationMap(locales);
  const default_locale_id = get_default_locale_id(locales);

  if (existingTranslations?.length) {
    for (const item of existingTranslations) {
      if (map[item.localeId]) {
        map[item.localeId] = {
          name: item.name || "",
          description: item.description || "",
          remark: item.remark || "",
          scheduleNote: (item as { scheduleNote?: string }).scheduleNote || "",
        };
      }
    }
  }

  if (legacyFallback && default_locale_id && map[default_locale_id]) {
    const current = map[default_locale_id];
    map[default_locale_id] = {
      name: current.name || legacyFallback.name || "",
      description: current.description || legacyFallback.description || "",
      remark: current.remark || legacyFallback.remark || "",
      scheduleNote: current.scheduleNote || legacyFallback.scheduleNote || "",
    };
  }

  return map;
};

export const buildTranslationPayload = (map: TranslationMap): AdminTranslationInput[] => {
  return Object.entries(map)
    .filter(([, fields]) => fields.name?.trim())
    .map(([localeId, fields]) => ({
      localeId,
      name: fields.name!.trim(),
      description: fields.description?.trim() || undefined,
      remark: fields.remark?.trim() || undefined,
      scheduleNote: fields.scheduleNote?.trim() || undefined,
    }));
};

export const validateDefaultLocaleName = (
  map: TranslationMap,
  defaultLocaleId: string | undefined,
): string | undefined => {
  if (!defaultLocaleId) {
    return "translation.defaultLocaleRequired";
  }
  const name = map[defaultLocaleId]?.name?.trim();
  if (!name) {
    return "translation.defaultLocaleRequired";
  }
  return undefined;
};

export const localeTabLabel = (locale: LocaleItem, isDefault?: boolean): string => {
  const base = locale.nativeName || locale.name || locale.languageCode;
  return isDefault ? `${base} (default)` : base;
};

export const sortActiveLocales = (items: LocaleItem[]): LocaleItem[] => {
  const active_items = items.filter((item) => item.isActive);
  const default_item = active_items.find((item) => item.isDefault);
  if (!default_item) {
    return active_items;
  }
  const others = active_items.filter((item) => !item.isDefault);
  return [default_item, ...others];
};
