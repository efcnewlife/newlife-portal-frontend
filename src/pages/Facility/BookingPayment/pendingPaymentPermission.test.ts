import { describe, expect, it } from "vitest";
import {
  canConfirmPendingPayment,
  canViewPendingPaymentWorkflow,
  PENDING_PAYMENT_MODIFY_PERMISSION,
  PENDING_PAYMENT_READ_PERMISSION,
} from "./pendingPaymentPermission";

describe("canViewPendingPaymentWorkflow", () => {
  it("returns true when the user holds the read permission", () => {
    const hasPermission = (permission: string) => permission === PENDING_PAYMENT_READ_PERMISSION;
    expect(canViewPendingPaymentWorkflow(hasPermission)).toBe(true);
  });

  it("returns false when the user lacks the read permission", () => {
    const hasPermission = () => false;
    expect(canViewPendingPaymentWorkflow(hasPermission)).toBe(false);
  });
});

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
