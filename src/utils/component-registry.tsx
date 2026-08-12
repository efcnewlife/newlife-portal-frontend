import Blank from "@/pages/Blank";
import Dashboard from "@/pages/Dashboard";
import BookingManagement from "@/pages/Facility/Booking/BookingManagement";
import OverrideLogManagement from "@/pages/Facility/OverrideLog/OverrideLogManagement";
import RentalRateManagement from "@/pages/Facility/RentalRate/RentalRateManagement";
import RoomManagement from "@/pages/Facility/Room/RoomManagement";
import RoomSlotTemplateManagement from "@/pages/Facility/RoomSlotTemplate/RoomSlotTemplateManagement";
import RoomBlackoutManagement from "@/pages/Facility/RoomBlackout/RoomBlackoutManagement";
import MinistryManagement from "@/pages/Ministry/Ministry/MinistryManagement";
import MinistryMemberManagement from "@/pages/Ministry/MinistryMember/MinistryMemberManagement";
import MinistryApprovalManagement from "@/pages/Ministry/Approval/MinistryApprovalManagement";
import PersonManagement from "@/pages/Member/Person/PersonManagement";
import FileManagement from "@/pages/Content/File/FileManagement";
import PositionManagement from "@/pages/Org/Position/PositionManagement";
import PermissionManagement from "@/pages/System/Permission/PermissionManagement";
import ResourceManagement from "@/pages/System/Resource/ResourceManagement";
import RoleManagement from "@/pages/System/Role/RoleManagement";
import UserManagement from "@/pages/System/User/UserManagement";
import SettingManagement from "@/pages/System/Setting/SettingManagement";
import React from "react";

// Register routable components keyed by backend resource key
const componentRegistry: Record<string, React.ComponentType> = {
  // Dashboard - main homepage
  DASHBOARD: Dashboard,
  // System
  SYSTEM_USER: UserManagement,
  SYSTEM_RESOURCE: ResourceManagement,
  SYSTEM_PERMISSION: PermissionManagement,
  SYSTEM_ROLE: RoleManagement,
  SYSTEM_SETTING: SettingManagement,
  SYSTEM_FCM_DEVICE: Blank,
  SYSTEM_LOG: Blank,
  // Facility booking
  FACILITY_ROOM: RoomManagement,
  FACILITY_ROOM_SLOT_TEMPLATE: RoomSlotTemplateManagement,
  FACILITY_ROOM_BLACKOUT: RoomBlackoutManagement,
  FACILITY_RENTAL_RATE: RentalRateManagement,
  FACILITY_BOOKING: BookingManagement,
  FACILITY_BOOKING_OVERRIDE_LOG: OverrideLogManagement,
  // Ministry
  MINISTRY_MINISTRY: MinistryManagement,
  MINISTRY_MEMBER: MinistryMemberManagement,
  MINISTRY_APPROVAL: MinistryApprovalManagement,
  // Organization (Platform Schema v2)
  ORG_POSITION: PositionManagement,
  // Member
  MEMBER_PERSON: PersonManagement,
  // Content
  CONTENT_FILE: FileManagement,
};

function normalizeKey(key: string): string {
  return key?.trim();
}

export function resolveRouteElementByKey(key: string): React.ReactElement {
  const normalizedKey = normalizeKey(key);
  const Component = componentRegistry[normalizedKey];

  if (Component) {
    return React.createElement(Component);
  }

  // Return default Blank component when no mapped component is found
  // console.warn(`Component not found for key: "${key}", using Blank component`);
  return React.createElement(Blank);
}

export type {};
