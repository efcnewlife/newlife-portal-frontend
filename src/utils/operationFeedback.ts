import type { ApiError } from "@/types/api";
import { notificationManager } from "@/utils/notificationManager";
import { resolveApiErrorDescription } from "@/utils/resolveApiErrorDescription";

const SUCCESS_HIDE_MS = 3000;
const ERROR_HIDE_MS = 5000;
const FEEDBACK_POSITION = "top-right" as const;

export interface NotifySuccessOptions {
  title: string;
  description?: string;
}

export interface NotifyApiErrorOptions {
  title: string;
  fallbackDescription: string;
  resolveDescription?: (error: ApiError) => string | undefined;
}

const isApiError = (error: unknown): error is ApiError =>
  Boolean(error && typeof error === "object" && "code" in error && typeof (error as ApiError).code === "number");

/** Transport failures are already toasted by httpClient; do not notify again. */
export const isTransportFailure = (error: unknown): boolean => {
  if (!isApiError(error)) return false;
  return error.transportNotified === true || error.code === 0;
};

export const notifySuccess = (options: NotifySuccessOptions): void => {
  notificationManager.show({
    variant: "success",
    title: options.title,
    description: options.description,
    position: FEEDBACK_POSITION,
    hideDuration: SUCCESS_HIDE_MS,
    autoClose: true,
  });
};

export const notifyApiError = (error: unknown, options: NotifyApiErrorOptions): void => {
  if (isTransportFailure(error)) {
    return;
  }

  let description = options.fallbackDescription;
  if (isApiError(error)) {
    const fromResolver = options.resolveDescription?.(error);
    if (fromResolver) {
      description = fromResolver;
    } else {
      const fromCode = resolveApiErrorDescription(error);
      if (fromCode) {
        description = fromCode;
      }
    }
  }

  notificationManager.show({
    variant: "error",
    title: options.title,
    description,
    position: FEEDBACK_POSITION,
    hideDuration: ERROR_HIDE_MS,
    autoClose: true,
  });
};
