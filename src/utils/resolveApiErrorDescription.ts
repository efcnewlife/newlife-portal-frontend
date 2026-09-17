import i18n from "@/i18n";
import type { ApiError } from "@/types/api";

/** Maps backend `error_code` to `common:feedback.errors.*`. Unknown codes return undefined. */
const ERROR_CODE_TO_I18N_KEY: Record<string, string> = {
  FACILITY_BOOKING_SCHEDULING_CONFLICT: "feedback.errors.facilityBookingSchedulingConflict",
  FACILITY_BOOKING_ROOM_BLACKOUT: "feedback.errors.facilityBookingRoomBlackout",
  FACILITY_BOOKING_NOT_FOUND: "feedback.errors.facilityBookingNotFound",
  FACILITY_ROOM_NOT_FOUND: "feedback.errors.facilityRoomNotFound",
  FACILITY_ROOM_CODE_EXISTS: "feedback.errors.facilityRoomCodeExists",
  FACILITY_SLOT_TEMPLATE_NOT_FOUND: "feedback.errors.facilitySlotTemplateNotFound",
  FACILITY_SLOT_TEMPLATE_OVERLAP: "feedback.errors.facilitySlotTemplateOverlap",
  FACILITY_BLACKOUT_NOT_FOUND: "feedback.errors.facilityBlackoutNotFound",
  FACILITY_BLACKOUT_OVERLAP: "feedback.errors.facilityBlackoutOverlap",
  FACILITY_RENTAL_RATE_NOT_FOUND: "feedback.errors.facilityRentalRateNotFound",
  FACILITY_RENTAL_RATE_EXISTS: "feedback.errors.facilityRentalRateExists",
  FACILITY_RENTAL_RATE_TEMPLATE_NOT_FOUND: "feedback.errors.facilityRentalRateTemplateNotFound",
  FACILITY_RENTAL_RATE_TEMPLATE_NAME_EXISTS: "feedback.errors.facilityRentalRateTemplateNameExists",
  FACILITY_RENTAL_RATE_TEMPLATE_IN_USE: "feedback.errors.facilityRentalRateTemplateInUse",
  FACILITY_BOOKING_INVALID_TIME_RANGE: "feedback.errors.facilityBookingInvalidTimeRange",
  FACILITY_BOOKING_ROOMS_REQUIRED: "feedback.errors.facilityBookingRoomsRequired",
  FACILITY_BOOKING_MAX_ROOMS: "feedback.errors.facilityBookingMaxRooms",
  FACILITY_BOOKING_MINISTRY_INACTIVE: "feedback.errors.facilityBookingMinistryInactive",
  ORG_MINISTRY_NOT_FOUND: "feedback.errors.orgMinistryNotFound",
  ORG_MINISTRY_PRIMARY_REQUIRED: "feedback.errors.orgMinistryPrimaryRequired",
  ORG_MINISTRY_SECONDARY_REQUIRED: "feedback.errors.orgMinistrySecondaryRequired",
  ORG_MINISTRY_NOT_PENDING_APPROVAL: "feedback.errors.orgMinistryNotPendingApproval",
  ORG_MINISTRY_INVALID_STATUS_FOR_SUBMIT: "feedback.errors.orgMinistryInvalidStatusForSubmit",
  ORG_MINISTRY_OWNER_POSITION_REQUIRED: "feedback.errors.orgMinistryOwnerPositionRequired",
  ORG_POSITION_NOT_FOUND: "feedback.errors.orgPositionNotFound",
  ORG_POSITION_CODE_EXISTS: "feedback.errors.orgPositionCodeExists",
  MEMBER_PERSON_NOT_FOUND: "feedback.errors.memberPersonNotFound",
  MEMBER_PERSON_USER_ALREADY_LINKED: "feedback.errors.memberPersonUserAlreadyLinked",
  AUTH_USER_NOT_FOUND: "feedback.errors.authUserNotFound",
  AUTH_USER_ALREADY_EXISTS: "feedback.errors.authUserAlreadyExists",
  AUTH_ROLE_NOT_FOUND: "feedback.errors.authRoleNotFound",
  AUTH_ROLE_CODE_EXISTS: "feedback.errors.authRoleCodeExists",
  AUTH_PERMISSION_NOT_FOUND: "feedback.errors.authPermissionNotFound",
  AUTH_PERMISSION_CODE_EXISTS: "feedback.errors.authPermissionCodeExists",
  AUTH_RESOURCE_NOT_FOUND: "feedback.errors.authResourceNotFound",
  AUTH_RESOURCE_CODE_EXISTS: "feedback.errors.authResourceCodeExists",
  SYSTEM_SETTING_NOT_FOUND: "feedback.errors.systemSettingNotFound",
  SYSTEM_SETTING_KEY_EXISTS: "feedback.errors.systemSettingKeyExists",
  SYSTEM_SETTING_IN_RECYCLE_BIN: "feedback.errors.systemSettingInRecycleBin",
  SYSTEM_SETTING_BUILTIN_DELETE_FORBIDDEN: "feedback.errors.systemSettingBuiltinDeleteForbidden",
};

export const resolveApiErrorDescription = (error: ApiError): string | undefined => {
  const errorCode = typeof error.details?.error_code === "string" ? error.details.error_code : undefined;
  if (!errorCode) {
    return undefined;
  }
  const key = ERROR_CODE_TO_I18N_KEY[errorCode];
  if (!key) {
    return undefined;
  }
  return i18n.t(`common:${key}`);
};
