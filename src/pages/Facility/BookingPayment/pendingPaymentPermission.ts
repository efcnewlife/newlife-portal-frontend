import { Resource, Verb } from "@/const/enums";

export const PENDING_PAYMENT_READ_PERMISSION = `${Resource.FacilityBookingPayment}:${Verb.Read}`;
export const PENDING_PAYMENT_MODIFY_PERMISSION = `${Resource.FacilityBookingPayment}:${Verb.Modify}`;

type HasPermission = (permission: string) => boolean;

/** Gates the per-row Confirm payment action; only an assigned user may confirm. */
export const canConfirmPendingPayment = (hasPermission: HasPermission): boolean =>
  hasPermission(PENDING_PAYMENT_MODIFY_PERMISSION);
