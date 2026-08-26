import { describe, expect, it } from "vitest";
import {
  LEGAL_DOCUMENT_KINDS,
  LEGAL_DOCUMENT_PRODUCTS,
  buildLegalDocumentUpdatePayload,
  createEmptyLegalDocumentTranslationMap,
  hydrateLegalDocumentTranslationMap,
  isLegalDocumentKind,
  isLegalDocumentProduct,
} from "./legalDocumentForm";

describe("legal document catalog", () => {
  it("lists built-in Product and Kind codes for this slice", () => {
    expect(LEGAL_DOCUMENT_PRODUCTS).toEqual(["facility-booking", "portal"]);
    expect(LEGAL_DOCUMENT_KINDS).toEqual(["terms_of_service", "privacy_policy"]);
  });

  it("accepts only catalog Product and Kind codes", () => {
    expect(isLegalDocumentProduct("facility-booking")).toBe(true);
    expect(isLegalDocumentProduct("portal")).toBe(true);
    expect(isLegalDocumentProduct("unknown")).toBe(false);
    expect(isLegalDocumentKind("terms_of_service")).toBe(true);
    expect(isLegalDocumentKind("privacy_policy")).toBe(true);
    expect(isLegalDocumentKind("tos")).toBe(false);
  });
});

describe("legal document translation map", () => {
  const locales = [
    {
      id: "locale-en",
      languageCode: "en",
      name: "English",
      isDefault: true,
      isActive: true,
    },
    {
      id: "locale-tw",
      languageCode: "zh",
      regionCode: "TW",
      name: "Traditional Chinese",
      isDefault: false,
      isActive: true,
    },
  ];

  it("creates an empty body per active locale", () => {
    expect(createEmptyLegalDocumentTranslationMap(locales)).toEqual({
      "locale-en": { body: "" },
      "locale-tw": { body: "" },
    });
  });

  it("hydrates bodies from existing translations and keeps missing locales empty", () => {
    const map = hydrateLegalDocumentTranslationMap(locales, [
      { localeId: "locale-en", body: "# Terms" },
      { localeId: "locale-missing", body: "ignored" },
    ]);

    expect(map).toEqual({
      "locale-en": { body: "# Terms" },
      "locale-tw": { body: "" },
    });
  });

  it("builds an update payload for every locale, including empty Markdown bodies", () => {
    const payload = buildLegalDocumentUpdatePayload({
      "locale-en": { body: "  Hello  " },
      "locale-tw": { body: "" },
    });

    expect(payload).toEqual({
      translations: [
        { localeId: "locale-en", body: "  Hello  " },
        { localeId: "locale-tw", body: "" },
      ],
    });
  });
});
