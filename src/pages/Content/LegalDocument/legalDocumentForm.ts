import type { LocaleItem } from "@/api/services/localeService";
import type { LegalDocumentTranslationItem, LegalDocumentUpdatePayload } from "@/api/services/legalDocumentService";

export const LEGAL_DOCUMENT_PRODUCTS = ["facility-booking", "portal"] as const;
export const LEGAL_DOCUMENT_KINDS = ["terms_of_service", "privacy_policy"] as const;

export type LegalDocumentProduct = (typeof LEGAL_DOCUMENT_PRODUCTS)[number];
export type LegalDocumentKind = (typeof LEGAL_DOCUMENT_KINDS)[number];

export interface LegalDocumentTranslationFields {
  body: string;
}

export type LegalDocumentTranslationMap = Record<string, LegalDocumentTranslationFields>;

export type { LegalDocumentTranslationItem, LegalDocumentUpdatePayload };

export const isLegalDocumentProduct = (value: string): value is LegalDocumentProduct =>
  (LEGAL_DOCUMENT_PRODUCTS as readonly string[]).includes(value);

export const isLegalDocumentKind = (value: string): value is LegalDocumentKind =>
  (LEGAL_DOCUMENT_KINDS as readonly string[]).includes(value);

export const createEmptyLegalDocumentTranslationMap = (locales: LocaleItem[]): LegalDocumentTranslationMap =>
  locales.reduce<LegalDocumentTranslationMap>((acc, locale) => {
    acc[locale.id] = { body: "" };
    return acc;
  }, {});

export const hydrateLegalDocumentTranslationMap = (
  locales: LocaleItem[],
  existingTranslations?: LegalDocumentTranslationItem[]
): LegalDocumentTranslationMap => {
  const map = createEmptyLegalDocumentTranslationMap(locales);
  if (!existingTranslations?.length) return map;

  for (const item of existingTranslations) {
    if (map[item.localeId]) {
      map[item.localeId] = { body: item.body ?? "" };
    }
  }
  return map;
};

export const buildLegalDocumentUpdatePayload = (map: LegalDocumentTranslationMap): LegalDocumentUpdatePayload => ({
  translations: Object.entries(map).map(([localeId, fields]) => ({
    localeId,
    body: fields.body ?? "",
  })),
});
