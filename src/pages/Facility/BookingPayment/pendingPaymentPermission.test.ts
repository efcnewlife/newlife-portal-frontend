import { describe, expect, it } from "vitest";
import {
  canConfirmPendingPayment,
  PENDING_PAYMENT_MODIFY_PERMISSION,
  PENDING_PAYMENT_READ_PERMISSION,
} from "./pendingPaymentPermission";

describe("canConfirmPendingPayment", () => {
  it("returns true when the user holds the modify permission", () => {
    const hasPermission = (permission: string) => permission === PENDING_PAYMENT_MODIFY_PERMISSION;
    expect(canConfirmPendingPayment(hasPermission)).toBe(true);
  });

  it("returns false for a read-only user; only an assigned operator may confirm", () => {
    const hasPermission = (permission: string) => permission === PENDING_PAYMENT_READ_PERMISSION;
    expect(canConfirmPendingPayment(hasPermission)).toBe(false);
  });
});
