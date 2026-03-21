// Shared project enums

import { CountryCode } from "@/types/common";

// Demo domain
export enum Gender {
  Unknown = 0,
  Male = 1,
  Female = 2,
}

export enum PopoverPosition {
  Top = "top",
  TopLeft = "top_left",
  TopRight = "top_right",
  Right = "right",
  RightTop = "right_top",
  RightBottom = "right_bottom",
  Bottom = "bottom",
  BottomLeft = "bottom_left",
  BottomRight = "bottom_right",
  Left = "left",
  LeftTop = "left_top",
  LeftBottom = "left_bottom",
}

export enum Verb {
  Read = "read",
  Create = "create",
  Modify = "modify",
  Delete = "delete",
}

export enum Resource {
  // General resources
  // [comms]
  CommsNotification = "comms:notification",
  CommsNotificationHistory = "comms:notification_history",

  // [conference]
  ConferenceConferences = "conference:conferences",
  ConferenceEventSchedule = "conference:event_schedule",

  // [content]
  ContentFile = "content:file",
  ContentInstructor = "content:instructor",
  ContentLocation = "content:location",
  ContentTestimony = "content:testimony",

  // [support]
  SupportFaq = "support:faq",
  SupportFeedback = "support:feedback",

  // [workshop]
  WorkshopRegistration = "workshop:registration",
  WorkshopWorkshops = "workshop:workshops",

  // System resources
  SystemFcmDevice = "system:fcm_device",
  SystemLog = "system:log",
  SystemPermission = "system:permission",
  SystemResource = "system:resource",
  SystemRole = "system:role",
  SystemUser = "system:user",
}

export const CountryCodes: CountryCode[] = [
  { name: "USA", code: "+1" }, // USA(United States）
  { name: "CAN", code: "+1" }, // Canada(Canada）
  { name: "MEX", code: "+52" }, // Mexico(Mexico）
  { name: "PER", code: "+51" }, // Peru(Peru）
  { name: "ARG", code: "+54" }, // Argentina(Argentina）
  { name: "BRA", code: "+55" }, // Brazil(Brazil）
  { name: "CHL", code: "+56" }, // Chile(Chile）
  { name: "COL", code: "+57" }, // Colombia(Colombia）
  { name: "VEN", code: "+58" }, // Venezuela (Venezuela）
  { name: "NLD", code: "+31" }, // Netherlands(Netherlands）
  { name: "ESP", code: "+34" }, // Spain(Spain）
  { name: "ITA", code: "+39" }, // Italy(Italy）
  { name: "AUT", code: "+43" }, // Austria(Austria）
  { name: "SWE", code: "+46" }, // Sweden(Sweden）
  { name: "POL", code: "+48" }, // Poland(Poland）
  { name: "FRA", code: "+33" }, // France(France）
  { name: "GBR", code: "+44" }, // U.K(United Kingdom）
  { name: "DEU", code: "+49" }, // Germany(Germany）
  { name: "MYS", code: "+60" }, // Malaysia(Malaysia）
  { name: "IDN", code: "+62" }, // Indonesia(Indonesia）
  { name: "PHL", code: "+63" }, // the Philippines(Philippines）
  { name: "THA", code: "+66" }, // Thailand(Thailand）
  { name: "SGP", code: "+65" }, // Singapore(Singapore）
  { name: "JPN", code: "+81" }, // Japan(Japan）
  { name: "VNM", code: "+84" }, // Vietnam(Vietnam）
  { name: "KOR", code: "+82" }, // South Korea(South Korea）
  { name: "IND", code: "+91" }, // India(India）
  { name: "LKA", code: "+94" }, // Sri Lanka (Sri Lanka）
  { name: "CHN", code: "+86" }, // China(China）
  { name: "HKG", code: "+852" }, // Hongkong(Hong Kong）
  { name: "TWN", code: "+886" }, // Taiwan(Taiwan）
  { name: "BGD", code: "+880" }, // Bengal(Bangladesh）
];
