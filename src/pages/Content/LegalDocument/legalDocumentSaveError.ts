import type { ApiError } from "@/types/api";

export const LEGAL_DOCUMENT_ERROR_CODE = {
  EXISTS: "CONTENT_LEGAL_DOCUMENT_EXISTS",
  IN_RECYCLE_BIN: "CONTENT_LEGAL_DOCUMENT_IN_RECYCLE_BIN",
  NOT_FOUND: "CONTENT_LEGAL_DOCUMENT_NOT_FOUND",
} as const;

type Translate = (key: string, options?: Record<string, unknown>) => string;

const isApiError = (error: unknown): error is ApiError =>
  Boolean(error && typeof error === "object" && "code" in error && typeof (error as ApiError).code === "number");

/** Maps Legal Document create/update `error_code` to content i18n keys (not raw backend detail). */
export const resolveLegalDocumentSaveErrorMessage = (error: unknown, t: Translate): string | undefined => {
  if (!isApiError(error)) {
    return undefined;
  }

  const errorCode = typeof error.details?.error_code === "string" ? error.details.error_code : undefined;
  if (errorCode === LEGAL_DOCUMENT_ERROR_CODE.IN_RECYCLE_BIN) {
    return t("legalDocument.errors.inRecycleBin");
  }
  if (errorCode === LEGAL_DOCUMENT_ERROR_CODE.EXISTS) {
    return t("legalDocument.errors.exists");
  }
  if (errorCode === LEGAL_DOCUMENT_ERROR_CODE.NOT_FOUND) {
    return t("legalDocument.errors.notFound");
  }
  return undefined;
};
