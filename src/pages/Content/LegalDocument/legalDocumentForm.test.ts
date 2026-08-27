import { describe, expect, it } from "vitest";
import {
  LEGAL_DOCUMENT_KINDS,
  LEGAL_DOCUMENT_PRODUCTS,
  buildLegalDocumentCreatePayload,
  buildLegalDocumentUpdatePayload,
  createEmptyLegalDocumentTranslationMap,
  hydrateLegalDocumentTranslationMap,
  isLegalDocumentBodyEmpty,
  isLegalDocumentEffectiveDate,
  isLegalDocumentKind,
  isLegalDocumentProduct,
  listLegalDocumentCatalogPairs,
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

  it("lists every built-in Product x Kind pair for create", () => {
    expect(listLegalDocumentCatalogPairs()).toEqual([
      { product: "facility-booking", kind: "terms_of_service" },
      { product: "facility-booking", kind: "privacy_policy" },
      { product: "portal", kind: "terms_of_service" },
      { product: "portal", kind: "privacy_policy" },
    ]);
  });

  it("builds a create payload only for catalog Product, Kind, and Effective Date", () => {
    expect(buildLegalDocumentCreatePayload("portal", "privacy_policy", "2026-01-15")).toEqual({
      product: "portal",
      kind: "privacy_policy",
      effectiveDate: "2026-01-15",
    });
    expect(buildLegalDocumentCreatePayload("unknown", "privacy_policy", "2026-01-15")).toBeNull();
    expect(buildLegalDocumentCreatePayload("portal", "cookie_policy", "2026-01-15")).toBeNull();
    expect(buildLegalDocumentCreatePayload("portal", "privacy_policy", "")).toBeNull();
    expect(buildLegalDocumentCreatePayload("portal", "privacy_policy", "01/15/2026")).toBeNull();
  });
});

describe("legal document Effective Date", () => {
  it("accepts only YYYY-MM-DD calendar days", () => {
    expect(isLegalDocumentEffectiveDate("2026-01-15")).toBe(true);
    expect(isLegalDocumentEffectiveDate("2026-1-15")).toBe(false);
    expect(isLegalDocumentEffectiveDate("")).toBe(false);
    expect(isLegalDocumentEffectiveDate("not-a-date")).toBe(false);
  });
});

describe("legal document View body", () => {
  it("treats blank and whitespace-only Markdown as empty", () => {
    expect(isLegalDocumentBodyEmpty("")).toBe(true);
    expect(isLegalDocumentBodyEmpty("   \n\t")).toBe(true);
    expect(isLegalDocumentBodyEmpty(undefined)).toBe(true);
    expect(isLegalDocumentBodyEmpty("# Terms")).toBe(false);
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

  it("builds an update payload with Effective Date and every locale body", () => {
    const payload = buildLegalDocumentUpdatePayload(
      {
        "locale-en": { body: "  Hello  " },
        "locale-tw": { body: "" },
      },
      "2026-03-01"
    );

    expect(payload).toEqual({
      effectiveDate: "2026-03-01",
      translations: [
        { localeId: "locale-en", body: "  Hello  " },
        { localeId: "locale-tw", body: "" },
      ],
    });
  });

  it("returns null update payload when Effective Date is missing or invalid", () => {
    const map = { "locale-en": { body: "Hello" } };
    expect(buildLegalDocumentUpdatePayload(map, "")).toBeNull();
    expect(buildLegalDocumentUpdatePayload(map, "03/01/2026")).toBeNull();
  });
});
