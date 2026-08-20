import { afterEach, describe, expect, it, vi } from "vitest";
import type { ApiError } from "@/types/api";
import { notificationManager } from "@/utils/notificationManager";
import { isTransportFailure, notifyApiError, notifySuccess } from "@/utils/operationFeedback";

vi.mock("@/utils/notificationManager", () => ({
  notificationManager: {
    show: vi.fn(),
  },
}));

vi.mock("@/utils/resolveApiErrorDescription", () => ({
  resolveApiErrorDescription: vi.fn((error: ApiError) => {
    if (error.details?.error_code === "FACILITY_ROOM_NOT_FOUND") {
      return "Room was not found";
    }
    return undefined;
  }),
}));

const showMock = vi.mocked(notificationManager.show);

afterEach(() => {
  showMock.mockClear();
});

describe("notifySuccess", () => {
  it("shows a success toast at top-right for 3s", () => {
    notifySuccess({ title: "Saved", description: "Room saved" });
    expect(showMock).toHaveBeenCalledWith({
      variant: "success",
      title: "Saved",
      description: "Room saved",
      position: "top-right",
      hideDuration: 3000,
      autoClose: true,
    });
  });
});

describe("notifyApiError", () => {
  it("shows an error toast with fallback description when no code mapping", () => {
    const error: ApiError = { code: 500, message: "Internal Server Error" };
    notifyApiError(error, {
      title: "Save failed",
      fallbackDescription: "Failed to save. Please try again.",
    });
    expect(showMock).toHaveBeenCalledWith({
      variant: "error",
      title: "Save failed",
      description: "Failed to save. Please try again.",
      position: "top-right",
      hideDuration: 5000,
      autoClose: true,
    });
    expect(showMock.mock.calls[0][0].description).not.toBe(error.message);
  });

  it("uses resolveApiErrorDescription when error_code is mapped", () => {
    const error: ApiError = {
      code: 404,
      message: "Room xyz not found",
      details: { error_code: "FACILITY_ROOM_NOT_FOUND" },
    };
    notifyApiError(error, {
      title: "Save failed",
      fallbackDescription: "Failed to save. Please try again.",
    });
    expect(showMock).toHaveBeenCalledWith(
      expect.objectContaining({
        description: "Room was not found",
      }),
    );
  });

  it("prefers resolveDescription callback over default mapping", () => {
    const error: ApiError = {
      code: 409,
      message: "conflict",
      details: { error_code: "FACILITY_ROOM_NOT_FOUND" },
    };
    notifyApiError(error, {
      title: "Save failed",
      fallbackDescription: "fallback",
      resolveDescription: () => "Custom booking message",
    });
    expect(showMock).toHaveBeenCalledWith(
      expect.objectContaining({
        description: "Custom booking message",
      }),
    );
  });

  it("does not show a toast for transport failures (code 0)", () => {
    notifyApiError(
      { code: 0, message: "Network Error" },
      { title: "Save failed", fallbackDescription: "fallback" },
    );
    expect(showMock).not.toHaveBeenCalled();
  });

  it("does not show a toast when transportNotified is set", () => {
    notifyApiError(
      { code: 408, message: "Timeout", transportNotified: true },
      { title: "Save failed", fallbackDescription: "fallback" },
    );
    expect(showMock).not.toHaveBeenCalled();
  });
});

describe("isTransportFailure", () => {
  it("detects code 0 and transportNotified", () => {
    expect(isTransportFailure({ code: 0, message: "x" })).toBe(true);
    expect(isTransportFailure({ code: 408, message: "x", transportNotified: true })).toBe(true);
    expect(isTransportFailure({ code: 400, message: "x" })).toBe(false);
    expect(isTransportFailure(new Error("x"))).toBe(false);
  });
});
