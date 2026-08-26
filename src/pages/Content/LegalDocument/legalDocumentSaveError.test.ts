import { describe, expect, it } from "vitest";
import type { ApiError } from "@/types/api";
import { resolveLegalDocumentSaveErrorMessage } from "./legalDocumentSaveError";

const t = (key: string): string => key;

const apiError = (overrides: Partial<ApiError> & { details?: ApiError["details"] }): ApiError => ({
  code: 409,
  message: "Legal Document exists in recycle bin; restore it instead",
  ...overrides,
});

describe("resolveLegalDocumentSaveErrorMessage", () => {
  it("maps recycle-bin conflict to restore guidance", () => {
    const error = apiError({
      details: { error_code: "CONTENT_LEGAL_DOCUMENT_IN_RECYCLE_BIN" },
    });
    expect(resolveLegalDocumentSaveErrorMessage(error, t)).toBe("legalDocument.errors.inRecycleBin");
  });

  it("maps active-exists conflict to exists guidance", () => {
    const error = apiError({
      details: { error_code: "CONTENT_LEGAL_DOCUMENT_EXISTS" },
    });
    expect(resolveLegalDocumentSaveErrorMessage(error, t)).toBe("legalDocument.errors.exists");
  });

  it("maps not-found to notFound guidance", () => {
    const error = apiError({
      code: 404,
      message: "Legal Document not found",
      details: { error_code: "CONTENT_LEGAL_DOCUMENT_NOT_FOUND" },
    });
    expect(resolveLegalDocumentSaveErrorMessage(error, t)).toBe("legalDocument.errors.notFound");
  });

  it("returns undefined for unknown codes so callers keep the Operation fallback", () => {
    const error = apiError({
      details: { error_code: "CONTENT_FILE_NOT_FOUND" },
    });
    expect(resolveLegalDocumentSaveErrorMessage(error, t)).toBeUndefined();
  });

  it("returns undefined for non-ApiError values", () => {
    expect(resolveLegalDocumentSaveErrorMessage(new Error("boom"), t)).toBeUndefined();
  });
});
